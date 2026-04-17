-- =====================================================
-- 점수/통계 동기화 마이그레이션
-- 적용 방법: Supabase Studio → SQL Editor 에 그대로 붙여넣고 Run
-- 작성일: 2026-04-17
-- =====================================================

-- =====================================================
-- 1. user_game_state — 사용자 게임 진행 상태
--    coins / shop / daily(출석·미션)을 한 row 에 묶어 보관.
--    shop·daily 는 jsonb 로 두어 게임 자료구조 변화에 유연하게 대응.
-- =====================================================
create table if not exists public.user_game_state (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  total_coins  integer not null default 0,
  shop_data    jsonb   not null default '{}'::jsonb,
  daily_data   jsonb   not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

create index if not exists idx_user_game_state_updated_at
  on public.user_game_state(updated_at desc);

alter table public.user_game_state enable row level security;

-- 본인 행만 SELECT
drop policy if exists "user_game_state_select_own" on public.user_game_state;
create policy "user_game_state_select_own"
  on public.user_game_state for select
  using (auth.uid() = user_id);

-- 본인 행만 INSERT
drop policy if exists "user_game_state_insert_own" on public.user_game_state;
create policy "user_game_state_insert_own"
  on public.user_game_state for insert
  with check (auth.uid() = user_id);

-- 본인 행만 UPDATE
drop policy if exists "user_game_state_update_own" on public.user_game_state;
create policy "user_game_state_update_own"
  on public.user_game_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_user_game_state_touch on public.user_game_state;
create trigger trg_user_game_state_touch
  before update on public.user_game_state
  for each row execute function public.touch_updated_at();

-- =====================================================
-- 2. game_votes — Finch 사이트의 게임 좋아요/싫어요
--    사용자당 게임당 1표 (UNIQUE).
-- =====================================================
create table if not exists public.game_votes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  game_id     text not null,
  vote        text not null check (vote in ('like','dislike')),
  created_at  timestamptz not null default now(),
  unique (user_id, game_id)
);

create index if not exists idx_game_votes_game on public.game_votes(game_id, vote);

alter table public.game_votes enable row level security;

-- 카운트 집계용으로 모든 사용자가 SELECT 가능
drop policy if exists "game_votes_select_all" on public.game_votes;
create policy "game_votes_select_all"
  on public.game_votes for select
  using (true);

-- 본인 행만 INSERT/UPDATE/DELETE
drop policy if exists "game_votes_insert_own" on public.game_votes;
create policy "game_votes_insert_own"
  on public.game_votes for insert
  with check (auth.uid() = user_id);

drop policy if exists "game_votes_update_own" on public.game_votes;
create policy "game_votes_update_own"
  on public.game_votes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "game_votes_delete_own" on public.game_votes;
create policy "game_votes_delete_own"
  on public.game_votes for delete
  using (auth.uid() = user_id);

-- 게임별 like/dislike 합계 RPC (1회 호출로 두 값 모두 가져오기)
create or replace function public.get_game_vote_counts(p_game_id text)
returns table (likes bigint, dislikes bigint)
language sql
stable
as $$
  select
    coalesce(sum(case when vote = 'like'    then 1 else 0 end), 0) as likes,
    coalesce(sum(case when vote = 'dislike' then 1 else 0 end), 0) as dislikes
  from public.game_votes
  where game_id = p_game_id;
$$;

-- =====================================================
-- 끝
-- =====================================================
