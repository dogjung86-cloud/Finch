-- =====================================================
-- 숨김 금칙어: 칼럼 기사·일상 글 댓글, 게임 의견과 그 댓글
-- 적용 방법: Supabase Studio → SQL Editor 에 그대로 붙여넣고 Run
--            (여러 번 실행해도 안전하다)
-- 작성일: 2026-11-06
-- =====================================================
-- 20261106_comments_replies.sql 과 20261104_game_post_comments.sql 을 먼저 적용해야 한다
-- (글 정리 함수 board_normalize_text 를 그대로 쓴다).
--
-- 욕설 금칙어(board_blocked_words)는 글을 아예 막는다. 여기 숨김 금칙어는 글을 받아 두고 숨긴다.
-- 숨김 금칙어나 외부 링크가 들어간 글은 쓴 사람 본인과 관리자에게만 보이고 다른 사람에게는 보이지 않는다.
-- 걸린 부분은 hidden_word 칸에 남는다. 관리자 화면은 이 칸으로 '금칙어 포함' 표시를 하고 따로 모아 보여 준다.
-- 글을 고쳐서 금칙어가 빠지면 다시 모두에게 보인다.
-- 관리자(sciencegive@gmail.com)는 검사하지 않는다. 관리자는 링크도 넣을 수 있다.
-- 관리자 주소는 src/lib/constants.js 의 ADMIN_EMAIL 과 같아야 한다.
-- 말을 더하거나 빼려면 Table Editor 에서 board_hidden_words 를 고친다. pattern 은 Postgres 정규식이고,
-- 소문자로 바꾼 원문과 board_normalize_text 를 거친 글 양쪽에 맞춘다 (표.절, p b s 처럼 띄우거나 기호를 끼워도 걸린다).
-- 이미 올라온 글은 다시 검사하지 않고, 새로 쓰거나 고칠 때만 검사한다 (2026-11-06 적용 때 걸리는 글은 없었다).

-- ── 숨김 금칙어 목록 ──
create table if not exists public.board_hidden_words (
  pattern text primary key,
  -- 잘못된 정규식이나 빈 글에도 맞는 정규식이 들어와 모든 글이 숨겨지는 일을 막는다
  constraint board_hidden_words_pattern_check check (not ('' ~ pattern))
);

alter table public.board_hidden_words enable row level security;
revoke all on public.board_hidden_words from anon, authenticated;

insert into public.board_hidden_words (pattern) values
  ('표절'),
  -- 베끼기, 베끼다, 베끼는, 베껴, 베꼈다, 베낀
  ('베끼|베껴|베꼈|베낀'),
  -- pbs, pbs eons
  ('pbs'),
  -- 해외, 해외 영상
  ('해외'),
  -- 외부 링크: http(s) 주소, 그리고 www. 이나 흔한 도메인 끝말로 된 주소. 과학드림 홈페이지(finch.co.kr)와 이메일은 뺀다.
  ('https?://(?!(?:www\.)?finch\.co\.kr)[^\s]+'),
  ('(?<![a-z0-9@./-])(?!(?:www\.)?finch\.co\.kr)(?:[a-z0-9-]+\.)+(?:com|net|org|kr|io|me|tv|ly|gl|be|co|info|xyz|link|app|dev|page|shop|site)(?![a-z0-9-])[^\s]*')
on conflict (pattern) do nothing;

-- ── 검사 ──
-- 걸린 부분을 돌려준다. 걸린 말이 없으면 null
create or replace function public.board_hidden_match(input text)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  raw text := lower(coalesce(input, ''));
  normalized text := public.board_normalize_text(coalesce(input, ''));
  matched text;
begin
  select coalesce(substring(raw from w.pattern), substring(normalized from w.pattern))
    into matched
    from public.board_hidden_words w
    where raw ~ w.pattern or normalized ~ w.pattern
    order by w.pattern
    limit 1;
  return nullif(btrim(matched, E' \n'), '');
end;
$$;

-- 표마다 본문 칸 이름이 달라서 칸 이름을 트리거 인자로 받는다. 목록을 읽을 권한이 사용자에게 없으므로 함수 주인 권한으로 검사한다
create or replace function public.board_flag_hidden()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.jwt() ->> 'email' = 'sciencegive@gmail.com' then
    new.hidden_word := null;
  else
    new.hidden_word := public.board_hidden_match(to_jsonb(new) ->> coalesce(tg_argv[0], 'body'));
  end if;
  return new;
end;
$$;

revoke all on function public.board_hidden_match(text) from public, anon, authenticated;
revoke all on function public.board_flag_hidden() from public, anon, authenticated;

-- ── 표마다 숨김 칸과 트리거 ──
-- hidden_word 는 쓰기 권한(grant insert/update 칸 목록)에 없어서 사용자가 직접 넣거나 지울 수 없고, 트리거만 채운다.
alter table public.comments add column if not exists hidden_word text;
alter table public.game_posts add column if not exists hidden_word text;
alter table public.game_post_comments add column if not exists hidden_word text;

drop trigger if exists trg_comments_flag_hidden on public.comments;
create trigger trg_comments_flag_hidden
  before insert or update of text on public.comments
  for each row execute function public.board_flag_hidden('text');

drop trigger if exists trg_game_posts_flag_hidden on public.game_posts;
create trigger trg_game_posts_flag_hidden
  before insert or update of body on public.game_posts
  for each row execute function public.board_flag_hidden('body');

drop trigger if exists trg_game_post_comments_flag_hidden on public.game_post_comments;
create trigger trg_game_post_comments_flag_hidden
  before insert or update of body on public.game_post_comments
  for each row execute function public.board_flag_hidden('body');

-- ── 읽기 정책: 숨긴 글은 쓴 사람과 관리자만 읽는다 ──
-- 예전 읽기 정책이 하나라도 남으면 정책끼리 OR 로 합쳐져 숨긴 글이 그대로 보이므로, 세 표의 SELECT 정책을 모두 지우고 새로 만든다.
do $$
declare
  p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('comments', 'game_posts', 'game_post_comments')
      and cmd = 'SELECT'
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end;
$$;

create policy "comments_select"
  on public.comments for select
  using (
    hidden_word is null
    or auth.uid() = user_id
    or auth.jwt() ->> 'email' = 'sciencegive@gmail.com'
  );

create policy "game_posts_select_all"
  on public.game_posts for select
  using (
    hidden_word is null
    or auth.uid() = user_id
    or auth.jwt() ->> 'email' = 'sciencegive@gmail.com'
  );

create policy "game_post_comments_select_all"
  on public.game_post_comments for select
  using (
    hidden_word is null
    or auth.uid() = user_id
    or auth.jwt() ->> 'email' = 'sciencegive@gmail.com'
  );

-- 새 칸을 화면이 바로 쓸 수 있도록 PostgREST 가 표 구조를 다시 읽게 한다
notify pgrst, 'reload schema';

-- 확인용: 세 표의 정책 목록. SELECT 는 위에서 만든 것 하나씩만 있어야 하고, ALL 정책이 있으면 그것도 읽기를 열어 주므로 살펴본다
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename in ('comments', 'game_posts', 'game_post_comments')
order by tablename, cmd, policyname;
