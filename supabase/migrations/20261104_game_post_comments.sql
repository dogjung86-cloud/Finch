-- =====================================================
-- game_post_comments: 게임 의견의 댓글과 대댓글, 관리자 고정, 금칙어
-- 적용 방법: Supabase Studio → SQL Editor 에 그대로 붙여넣고 Run
--            (여러 번 실행해도 안전하다)
-- 작성일: 2026-11-04
-- =====================================================
-- 20261102_game_posts.sql 과 20261103_game_posts_limits.sql 을 먼저 적용해야 한다.
-- 20261102_game_posts.sql 을 나중에 다시 돌리면 수정 시각 함수가 옛 내용으로 돌아가므로 이 파일도 다시 돌린다.
-- 댓글은 누구나 읽고, 쓰기는 로그인한 사람만 한다. 대댓글은 한 단계까지다.
-- 작성자 id 와 이름은 화면이 보낸 값을 믿지 않고 로그인 토큰에서 채운다.
-- 의견이 지워지면 그 댓글이, 댓글이 지워지면 그 대댓글이 함께 지워진다.
-- 회원 탈퇴로 auth.users 행이 지워지면 그 사람의 댓글도 함께 지워진다.
-- 관리자 주소는 src/lib/constants.js 의 ADMIN_EMAIL 과 같아야 한다.

create table if not exists public.game_post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.game_posts (id) on delete cascade,
  parent_id   uuid references public.game_post_comments (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null default left(
                coalesce(
                  nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
                  nullif(auth.jwt() -> 'user_metadata' ->> 'name', ''),
                  nullif(split_part(auth.jwt() ->> 'email', '@', 1), ''),
                  '익명'
                ),
                40
              ),
  body        text not null,
  pinned_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  -- 1000 은 src/components/games/boardParts.jsx 의 MAX_LENGTH 와 같아야 한다
  constraint game_post_comments_body_check
    check (char_length(body) <= 1000 and btrim(body, E' \t\r\n') <> '')
);

create index if not exists idx_game_post_comments_post_created_at
  on public.game_post_comments (post_id, created_at);
create index if not exists idx_game_post_comments_parent
  on public.game_post_comments (parent_id);
create index if not exists idx_game_post_comments_user_created_at
  on public.game_post_comments (user_id, created_at desc);

alter table public.game_post_comments enable row level security;

-- 댓글 쓰기는 의견, 부모 댓글, 본문만, 수정은 본문만 허용한다. 고정은 아래 함수로만 한다.
revoke all on public.game_post_comments from anon, authenticated;
grant select on public.game_post_comments to anon, authenticated;
grant insert (post_id, parent_id, body) on public.game_post_comments to authenticated;
grant update (body) on public.game_post_comments to authenticated;
grant delete on public.game_post_comments to authenticated;

drop policy if exists "game_post_comments_select_all" on public.game_post_comments;
create policy "game_post_comments_select_all"
  on public.game_post_comments for select
  using (true);

drop policy if exists "game_post_comments_insert_own" on public.game_post_comments;
create policy "game_post_comments_insert_own"
  on public.game_post_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "game_post_comments_update_own" on public.game_post_comments;
create policy "game_post_comments_update_own"
  on public.game_post_comments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "game_post_comments_delete_own_or_admin" on public.game_post_comments;
create policy "game_post_comments_delete_own_or_admin"
  on public.game_post_comments for delete
  to authenticated
  using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'sciencegive@gmail.com');

-- 대댓글은 같은 의견의 맨 위 댓글에만 달 수 있다
create or replace function public.game_post_comments_check_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is not null and not exists (
    select 1 from public.game_post_comments
    where id = new.parent_id
      and post_id = new.post_id
      and parent_id is null
  ) then
    raise exception 'invalid_parent' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_game_post_comments_check_parent on public.game_post_comments;
create trigger trg_game_post_comments_check_parent
  before insert on public.game_post_comments
  for each row execute function public.game_post_comments_check_parent();

-- 도배 방지: 한 사람이 10분에 10건까지. 의견보다 대화가 잦아 숫자를 늘렸다.
-- 동시에 보낸 요청들이 서로를 세지 못해 한도를 넘는 일이 없도록 사람별로 잠그고 센다.
-- 관리자는 여러 의견에 잇달아 답할 수 있으므로 세지 않는다.
create or replace function public.game_post_comments_limit_rate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.jwt() ->> 'email' = 'sciencegive@gmail.com' then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('game_post_comments_limit_rate:' || new.user_id::text, 0));
  if (
    select count(*) from public.game_post_comments
    where user_id = new.user_id
      and created_at > now() - interval '10 minutes'
  ) >= 10 then
    raise exception 'too_many_comments' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_game_post_comments_limit_rate on public.game_post_comments;
create trigger trg_game_post_comments_limit_rate
  before insert on public.game_post_comments
  for each row execute function public.game_post_comments_limit_rate();

-- 수정 시각은 서버 시계로 남긴다. 고정만 바꿀 때는 수정된 글로 표시하지 않는다.
create or replace function public.game_posts_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.body is distinct from old.body then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_game_post_comments_touch_updated_at on public.game_post_comments;
create trigger trg_game_post_comments_touch_updated_at
  before update on public.game_post_comments
  for each row execute function public.game_posts_touch_updated_at();

-- =====================================================
-- 관리자 고정
-- =====================================================
-- 고정한 의견은 게시판 맨 위에, 고정한 댓글은 그 의견의 댓글 맨 위에 나온다. 대댓글은 고정할 수 없다.
-- 일반 사용자에게는 pinned_at 쓰기 권한이 없고, 관리자만 아래 두 함수로 바꾼다.
alter table public.game_posts add column if not exists pinned_at timestamptz;

create or replace function public.set_game_post_pinned(target_id uuid, pinned boolean)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  result timestamptz;
begin
  if auth.jwt() ->> 'email' is distinct from 'sciencegive@gmail.com' then
    raise exception 'admin_only' using errcode = '42501';
  end if;
  update public.game_posts
    set pinned_at = case when pinned then now() end
    where id = target_id
    returning pinned_at into result;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  return result;
end;
$$;

create or replace function public.set_game_post_comment_pinned(target_id uuid, pinned boolean)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  result timestamptz;
begin
  if auth.jwt() ->> 'email' is distinct from 'sciencegive@gmail.com' then
    raise exception 'admin_only' using errcode = '42501';
  end if;
  update public.game_post_comments
    set pinned_at = case when pinned then now() end
    where id = target_id
      and parent_id is null
    returning pinned_at into result;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  return result;
end;
$$;

revoke all on function public.set_game_post_pinned(uuid, boolean) from public, anon, authenticated;
revoke all on function public.set_game_post_comment_pinned(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_game_post_pinned(uuid, boolean) to authenticated;
grant execute on function public.set_game_post_comment_pinned(uuid, boolean) to authenticated;

-- =====================================================
-- 금칙어
-- =====================================================
-- 의견과 댓글을 저장할 때 DB 가 검사하므로 화면을 거치지 않은 요청도 막힌다.
-- 목록은 화면 코드에 넣지 않고 이 표에만 둔다 (공개되는 코드에 욕설 목록을 싣지 않기 위해서다).
-- 말을 더하려면 Table Editor 에서 board_blocked_words 에 한 줄을 넣으면 된다. 평범한 낱말을 그대로 써도 된다.
-- pattern 은 Postgres 정규식이고, board_normalize_text 를 거친 글에 맞춘다 (소문자, 기호 없음).
-- 묶음은 (?:...) 로 쓴다. 걸린 부분을 안내 문구에 보여 주는데 (...) 는 그 부분만 잘라 내기 때문이다.
-- 과학 글에 흔한 말(새끼 거북, 시발점, 변태, 교미, 정자, 씨방 등)이 걸리지 않게 앞뒤 글자로 좁혀 두었다.
create table if not exists public.board_blocked_words (
  pattern text primary key,
  -- 잘못된 정규식이나 빈 글에도 맞는 정규식이 들어와 모든 글이 막히는 일을 막는다
  constraint board_blocked_words_pattern_check check (not ('' ~ pattern))
);

alter table public.board_blocked_words enable row level security;
revoke all on public.board_blocked_words from anon, authenticated;

-- 빠져나가는 방법을 한 가지 모양으로 모은다. 시.발 은 기호를 지우고, 시 발 은 한 글자씩 띄운 것만 붙이고,
-- 시1발 은 글자 사이 숫자를 뺀 줄을 하나 더 만들어 함께 검사한다.
-- 띄어쓰기를 전부 없애지 않는 것은 "다시 발견", "파킨슨병 신경세포" 같은 글이 걸리기 때문이다.
create or replace function public.board_normalize_text(input text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  token text;
  joined text := '';
  last_single boolean := false;
begin
  foreach token in array regexp_split_to_array(
    regexp_replace(lower(normalize(input, nfc)), '[^가-힣ㄱ-ㅣa-z0-9\s🖕]', '', 'g'),
    '\s+'
  ) loop
    continue when token = '';
    if last_single and char_length(token) = 1 then
      joined := joined || token;
    else
      joined := joined || ' ' || token;
    end if;
    last_single := char_length(token) = 1;
  end loop;
  joined := ltrim(joined);
  return joined || E'\n' || regexp_replace(joined, '([가-힣ㄱ-ㅣ])[0-9]+(?=[가-힣ㄱ-ㅣ])', '\1', 'g');
end;
$$;

revoke all on function public.board_normalize_text(text) from public, anon, authenticated;

-- 목록을 읽을 권한이 사용자에게 없으므로 함수 주인 권한으로 검사한다
create or replace function public.board_check_language()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := public.board_normalize_text(new.body);
  matched text;
begin
  select substring(normalized from w.pattern)
    into matched
    from public.board_blocked_words w
    where normalized ~ w.pattern
    limit 1;
  if found then
    raise exception 'blocked_language' using errcode = 'P0001', detail = btrim(matched, E' \n');
  end if;
  return new;
end;
$$;

revoke all on function public.board_check_language() from public, anon, authenticated;

drop trigger if exists trg_game_posts_check_language on public.game_posts;
create trigger trg_game_posts_check_language
  before insert or update of body on public.game_posts
  for each row execute function public.board_check_language();

drop trigger if exists trg_game_post_comments_check_language on public.game_post_comments;
create trigger trg_game_post_comments_check_language
  before insert or update of body on public.game_post_comments
  for each row execute function public.board_check_language();

insert into public.board_blocked_words (pattern) values
  -- 씨발 계열
  ('(?<![저가솜글말날맘음불꽃볍홀박])씨[이ㅣㅡ]*(?:발|빨|뻘|펄|팔|벌)'),
  ('씨부[랄럴]|씨불[알랄]'),
  ('(?:^|\s)아?씨[바빠](?:$|\s|놈|년|새끼|라|랄|ㅋ|ㅎ)'),
  ('(?<![다역혹몹즉잠])시[이ㅣㅡ]*발(?!점|역|지|택|차|견|전|표|생|사(?!람)|휘|명|달|동|효|행|굴|매|주|상|송|언|족|톱|레|음|열|화|병|작|자국|바닥|목|등|가락|판|걸음|끝|칙|랄|육|광|각|급|령|탁|단|돋|코|악|원|진(?!짜)|췌|현)'),
  ('시빨(?!간|개|갛|강)|시펄'),
  ('(?<![다역혹몹즉잠])시벌(?!레|어|써)'),
  ('(?<![다역혹몹즉잠])시팔(?!자|아|았|고|려|렸|면)'),
  ('(?:^|\s)아?시바(?!\s*(?:신|여신|견|이누|교|파))(?:$|\s|놈|년|새끼|라|랄|ㅋ|ㅎ)'),
  ('(?:^|\s)[쉬슈][이]*(?:발|벌|빨|팔|펄)'),
  ('(?:^|\s)스[이]*(?:발(?!바르)|벌|빨)|(?:^|\s)쓰[이]*(?:발|벌|빨|뻘)|[싀씌][이]*발'),
  ('[ㅅㅆ](?:발|빨)|[시씨]ㅂ'),
  ('ㅆㅣㅂㅏㄹ|ㅅㅣㅂㅏㄹ'),
  ('(?:^|\s)[시씨십]8|(?:^|\s)18(?:놈|넘|새끼)|개18'),
  -- 자음으로 줄여 쓴 욕
  ('ㅅㅂ|ㅆㅂ|ㅂㅅ|ㅄ|ㅈㄹ|ㅅㄲ|ㅈㄴ|ㅁㅊㄴ'),
  ('ㅈ같|ㅈ까|ㅈ밥'),
  ('ㅗㅗ|(?:^|\s)ㅗ(?:$|\s)|🖕'),
  -- 병신 계열
  ('병[ㅣㅡ]*신(?!년|경|호|약|규|종|청|기하|체|화|선|속|제|문|비|뢰|설)'),
  ('븅[이]*신|빙신|벙신|병쉰|병싄|병ㅅ|ㅂ신|ㅂㅕㅇㅅㅣㄴ'),
  ('(?:^|\s)등신(?!대|불|상|체|경)|등신(?:아|놈|새끼|같)'),
  -- 지랄
  ('지[이ㅣㅡ]*랄|찌랄|쥐랄|즤랄|지럴'),
  -- 새끼 계열 (새끼 혼자는 동물 새끼라서 막지 않는다)
  ('(?<![조번날지안우베덮마솔무])개\s*(?:새끼|새기|쌔끼|쌔기|쉐끼|색기|색끼|세끼|섀끼|샛기|새퀴|쉑|색히)'),
  ('쌔끼|쉐끼|쒜끼|섀끼|쌰끼|새퀴|새킈|색히|쌔퀴'),
  ('새끼(?:야|들아)'),
  ('(?:^|\s)(?:이|저|그|니|네|느그)새끼'),
  ('(?:미친|망할|쓰레기|더러운)\s*새끼'),
  ('(?<![조번날지안우베덮마솔무])개\s*자식'),
  ('(?:^|\s)(?:이|저|그)?개(?:놈|넘|년)'),
  ('(?:^|\s)개(?:같|소리|쓰레기)|개돼지'),
  -- 존나, 좆 계열 (좇다는 맞는 말이라 막지 않는다)
  ('(?<![생보공잔온현실의기병상자])존[ㅣㅡ]*나'),
  ('(?<![생보공잔온현실의기병상자])존(?:니(?!스|아)|내(?!려|리)|만(?:한|아|이|끼))'),
  ('좆|좃|졷|좇(?:같|까|밥)|조까(?!지)|(?:^|\s)조또(?:$|\s)|조낸'),
  -- 미친 (이 게임 미쳤다, 미친 게임 처럼 칭찬으로 쓰는 말은 막지 않는다)
  ('미친\s*(?:놈|넘|년|새끼|자식|쉐끼|색기)|또라이|정신병자|찐따'),
  -- 부모 욕과 그 밖의 심한 욕
  ('느금|니애미|니에미|네애미|니기미|(?:^|\s)니미(?:$|\s|럴|랄|씨|시|뽕)'),
  ('애미(?:없|뒤|새|년|창|뒈)|애비(?:없|뒤|새|뒈)|엠창|앰창|엠뒤|앰뒤'),
  ('후레자식|호래자식|호로자식|호로새끼|육시럴|육시랄|염병(?:하|할|떠)'),
  ('썅|쌍(?:놈|년|넘)|잡(?:놈|년)|걸레년|화냥년|창녀|창년(?!도)|갈보(?!리)|씨방새|뒈지|뒈져|뒈진|디져라'),
  ('씹(?:새|쌔|년|놈|넘|창|할|헐|세|질|물|구멍|보지)'),
  -- 사람을 깎아내리는 말
  ('틀딱|맘충|한남충|김치녀|된장녀|보슬아치|꼴페미|짱깨|쪽바리|깜둥이|똥꼬충|급식충|일베충'),
  -- 음담패설 (교미, 정자, 자궁 같은 과학 낱말은 막지 않는다)
  ('(?<![니터])[쎅섹쌕셱][스쓰]|섹파|섹드립'),
  ('야동|야겜|야설|포르노|헨타이|몸캠|몰카|원나잇|조건만남|오르가즘|빠구리|꼬추|붕가붕가'),
  ('떡(?:치|친|쳐)(?!기|구|즈)|딸딸이|(?:^|\s)딸(?:치|쳐|친)(?!구)'),
  ('자위(?:행위|하|했|중|질|기구|영상)'),
  ('보지(?:털|물|구멍|빨)|보짓|보빨|(?:내|니|네)보지(?:$|\s)'),
  ('자지(?:털|물|구멍|빨)|(?:내|니|네)자지(?:$|\s)'),
  ('젖탱이|젖통|빨통'),
  ('(?<![한금동산진록만요장황])강간|윤간'),
  ('(?<![품물성본지])질싸|입싸(?:$|\s|했|함|하)|얼싸(?!안|둥|절|하|좋|쿠)'),
  ('(?<![이직최전])후장(?!식|포|총)|쓰리[섬썸]|스리[섬썸]'),
  -- 영어와 한영 전환 없이 친 욕
  ('fu+ck|fuk(?!u)|fck|phuck|bullshit|(?<![a-z])shit(?!ak)|bitch|asshole|nigg(?:er|a)|faggot|pussy'),
  ('(?<![a-z])cunt|(?<![a-z])whore|(?<![a-z])slut|porn'),
  ('(?<![a-z])sex(?![a-z])(?!\s*(?:chromosome|ratio|determination|selection|hormone|cell))'),
  ('ssibal|sibal|shibal|ssibbal|tlqkf|tlqk|qudtls|whssk|wlfkf|rotorl|byungsin|byeongsin|gaesaekki')
on conflict (pattern) do nothing;
