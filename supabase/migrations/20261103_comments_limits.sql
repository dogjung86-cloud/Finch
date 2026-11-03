-- =====================================================
-- comments: 댓글 글자 수 제한과 도배 방지
-- 적용 방법: Supabase Studio → SQL Editor 에 그대로 붙여넣고 Run
--            (여러 번 실행해도 안전하다)
-- 작성일: 2026-11-03
-- =====================================================
-- 20261103_comments_drop_email.sql 을 먼저 적용해야 한다 (user_id 칸이 필요하다).
-- 숫자는 게임 게시판 game_posts 와 같다: 1000자까지, 한 사람이 10분에 5건까지.
-- 이미 올린 댓글을 고치거나 지우는 것은 횟수에 세지 않는다.

-- 뒤에 공백을 붙여 한도를 넘지 못하도록 글자 수는 다듬지 않은 원문으로 센다.
-- 1000 은 src/components/ArticlePage.jsx 의 COMMENT_MAX_LENGTH 와 같아야 한다
alter table public.comments drop constraint if exists comments_text_length;
alter table public.comments
  add constraint comments_text_length
  check (char_length(text) <= 1000 and btrim(text, E' \t\r\n') <> '');

-- 도배 방지: 한 사람이 10분에 5건까지
-- 동시에 보낸 요청들이 서로를 세지 못해 한도를 넘는 일이 없도록 사람별로 잠그고 센다.
-- 세는 쿼리는 이미 있는 idx_comments_user_id 를 쓴다.
create or replace function public.comments_limit_rate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('comments_limit_rate:' || new.user_id::text, 0));
  if (
    select count(*) from public.comments
    where user_id = new.user_id
      and created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'too_many_comments' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_comments_limit_rate on public.comments;
create trigger trg_comments_limit_rate
  before insert on public.comments
  for each row execute function public.comments_limit_rate();
