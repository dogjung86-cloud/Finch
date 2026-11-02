-- =====================================================
-- game_posts: Games 탭 의견 게시판
-- 적용 방법: Supabase Studio → SQL Editor 에 그대로 붙여넣고 Run
--            (여러 번 실행해도 안전하다)
-- 작성일: 2026-11-02
-- =====================================================
-- 글은 누구나 읽고, 쓰기는 로그인한 사람만 한다.
-- 작성자 id 와 이름은 화면이 보낸 값을 믿지 않고 로그인 토큰에서 채운다.
-- 이 표는 누구나 읽을 수 있으므로 이메일은 저장하지 않는다.
-- 회원 탈퇴로 auth.users 행이 지워지면 그 사람의 글도 함께 지워진다.

create table if not exists public.game_posts (
  id          uuid primary key default gen_random_uuid(),
  game_slug   text not null check (char_length(game_slug) between 1 and 40),
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
  body        text not null check (char_length(btrim(body, E' \t\r\n')) between 1 and 1000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create index if not exists idx_game_posts_created_at
  on public.game_posts (created_at desc);
create index if not exists idx_game_posts_game_created_at
  on public.game_posts (game_slug, created_at desc);
create index if not exists idx_game_posts_user_created_at
  on public.game_posts (user_id, created_at desc);

alter table public.game_posts enable row level security;

-- 글쓰기는 주제와 본문만, 수정은 본문만 허용한다
revoke all on public.game_posts from anon, authenticated;
grant select on public.game_posts to anon, authenticated;
grant insert (game_slug, body) on public.game_posts to authenticated;
grant update (body) on public.game_posts to authenticated;
grant delete on public.game_posts to authenticated;

drop policy if exists "game_posts_select_all" on public.game_posts;
create policy "game_posts_select_all"
  on public.game_posts for select
  using (true);

drop policy if exists "game_posts_insert_own" on public.game_posts;
create policy "game_posts_insert_own"
  on public.game_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "game_posts_update_own" on public.game_posts;
create policy "game_posts_update_own"
  on public.game_posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 관리자 주소는 src/lib/constants.js 의 ADMIN_EMAIL 과 같아야 한다
drop policy if exists "game_posts_delete_own_or_admin" on public.game_posts;
create policy "game_posts_delete_own_or_admin"
  on public.game_posts for delete
  to authenticated
  using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'sciencegive@gmail.com');

-- 도배 방지: 한 사람이 10분에 5건까지
create or replace function public.game_posts_limit_rate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    select count(*) from public.game_posts
    where user_id = new.user_id
      and created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'too_many_posts' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_game_posts_limit_rate on public.game_posts;
create trigger trg_game_posts_limit_rate
  before insert on public.game_posts
  for each row execute function public.game_posts_limit_rate();

-- 수정 시각은 서버 시계로 남긴다
create or replace function public.game_posts_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_game_posts_touch_updated_at on public.game_posts;
create trigger trg_game_posts_touch_updated_at
  before update on public.game_posts
  for each row execute function public.game_posts_touch_updated_at();
