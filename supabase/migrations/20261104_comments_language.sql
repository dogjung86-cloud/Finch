-- =====================================================
-- comments: 기사 댓글에도 금칙어를 적용한다
-- 적용 방법: Supabase Studio → SQL Editor 에 그대로 붙여넣고 Run
--            (여러 번 실행해도 안전하다)
-- 작성일: 2026-11-04
-- =====================================================
-- 20261104_game_post_comments.sql 을 먼저 적용해야 한다. 금칙어 표와 글 정리 함수를 그대로 쓴다.
-- 20261104_game_post_comments.sql 을 나중에 다시 돌리면 검사 함수가 body 칸만 보는 옛 내용으로 돌아가므로 이 파일도 다시 돌린다.
-- 이미 올라온 댓글은 건드리지 않고, 새로 쓰거나 고칠 때만 검사한다.

-- 표마다 본문 칸 이름이 달라서 칸 이름을 트리거 인자로 받는다. 인자가 없으면 body 를 본다.
create or replace function public.board_check_language()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := public.board_normalize_text(to_jsonb(new) ->> coalesce(tg_argv[0], 'body'));
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

drop trigger if exists trg_comments_check_language on public.comments;
create trigger trg_comments_check_language
  before insert or update of text on public.comments
  for each row execute function public.board_check_language('text');
