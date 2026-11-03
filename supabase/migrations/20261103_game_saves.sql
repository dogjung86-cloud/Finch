-- =====================================================
-- game_saves: 사이트가 게임 대신 맡아 주는 게임 기록
-- 적용 방법: Supabase Studio → SQL Editor 에 그대로 붙여넣고 Run
--            (여러 번 실행해도 안전하다)
-- 작성일: 2026-11-03
-- =====================================================
-- 게임 하나에 한 사람당 한 줄이고, 본인 줄만 읽고 쓰고 지운다.
-- 회원 탈퇴로 auth.users 행이 지워지면 함께 지워진다.
-- 내용은 게임이 만든 JSON 이고, 64KB 를 넘으면 받지 않는다.

create table if not exists public.game_saves (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_slug  text not null check (char_length(game_slug) between 1 and 40),
  data       jsonb not null check (octet_length(data::text) <= 65536),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_slug)
);

alter table public.game_saves enable row level security;

revoke all on public.game_saves from anon, authenticated;
grant select, insert, update, delete on public.game_saves to authenticated;

drop policy if exists "game_saves_select_own" on public.game_saves;
create policy "game_saves_select_own"
  on public.game_saves for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "game_saves_insert_own" on public.game_saves;
create policy "game_saves_insert_own"
  on public.game_saves for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "game_saves_update_own" on public.game_saves;
create policy "game_saves_update_own"
  on public.game_saves for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "game_saves_delete_own" on public.game_saves;
create policy "game_saves_delete_own"
  on public.game_saves for delete
  to authenticated
  using (auth.uid() = user_id);

-- 저장 시각은 서버 시계로 남긴다
create or replace function public.game_saves_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_game_saves_touch_updated_at on public.game_saves;
create trigger trg_game_saves_touch_updated_at
  before update on public.game_saves
  for each row execute function public.game_saves_touch_updated_at();
