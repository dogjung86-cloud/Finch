-- =====================================================
-- 미사용 테이블/함수 제거
--
-- 사유:
--  1) user_game_state — fly_darwin_saves 가 이미 같은 역할로 존재.
--  2) game_votes      — 좋아요/싫어요 기능을 도입하지 않기로 결정.
--
-- 적용 방법: Supabase Studio → SQL Editor 에 붙여넣고 Run
-- =====================================================

-- 1) user_game_state 정리
drop trigger if exists trg_user_game_state_touch on public.user_game_state;
drop policy  if exists "user_game_state_select_own" on public.user_game_state;
drop policy  if exists "user_game_state_insert_own" on public.user_game_state;
drop policy  if exists "user_game_state_update_own" on public.user_game_state;
drop table   if exists public.user_game_state;

-- 2) game_votes 정리
drop function if exists public.get_game_vote_counts(text);
drop policy  if exists "game_votes_select_all"  on public.game_votes;
drop policy  if exists "game_votes_insert_own"  on public.game_votes;
drop policy  if exists "game_votes_update_own"  on public.game_votes;
drop policy  if exists "game_votes_delete_own"  on public.game_votes;
drop table   if exists public.game_votes;

-- touch_updated_at 함수는 다른 테이블에서 재사용 가능 — 일단 보존.
-- 어디서도 안 쓰면 아래 주석 풀어서 제거.
-- drop function if exists public.touch_updated_at();
