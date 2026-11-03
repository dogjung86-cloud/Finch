-- =====================================================
-- game_posts: 게시판 글자 수 제한과 도배 방지의 빈틈 메우기
-- 적용 방법: Supabase Studio → SQL Editor 에 그대로 붙여넣고 Run
--            (여러 번 실행해도 안전하다)
-- 작성일: 2026-11-03
-- =====================================================
-- 20261102_game_posts.sql 을 먼저 적용해야 한다.
-- 숫자는 그대로다: 1000자까지, 한 사람이 10분에 5건까지. 세는 방법만 고친다.
-- 20261102_game_posts.sql 을 나중에 다시 돌리면 함수가 잠금 없는 옛 내용으로 돌아가므로 이 파일도 다시 돌린다.

-- 뒤에 공백을 붙여 한도를 넘지 못하도록 글자 수는 다듬지 않은 원문으로 센다.
-- 화면은 앞뒤 공백을 지우고 보내므로 평범한 글은 달라지는 것이 없다.
-- 1000 은 src/components/games/GameBoard.jsx 의 MAX_LENGTH 와 같아야 한다
-- 20261102 의 check 는 이름이 없어서 DB 가 game_posts_body_check 라고 붙였다. 같은 이름으로 바꿔 넣는다.
alter table public.game_posts drop constraint if exists game_posts_body_check;
alter table public.game_posts
  add constraint game_posts_body_check
  check (char_length(body) <= 1000 and btrim(body, E' \t\r\n') <> '');

-- 도배 방지: 한 사람이 10분에 5건까지
-- 동시에 보낸 요청들이 서로를 세지 못해 한도를 넘는 일이 없도록 사람별로 잠그고 센다.
-- 트리거 trg_game_posts_limit_rate 는 이미 이 함수를 부르므로 그대로 둔다.
create or replace function public.game_posts_limit_rate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('game_posts_limit_rate:' || new.user_id::text, 0));
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
