-- =====================================================
-- comments: 칼럼 기사와 일상 글 댓글에 대댓글을 단다
-- 적용 방법: Supabase Studio → SQL Editor 에 그대로 붙여넣고 Run
--            (여러 번 실행해도 안전하다)
-- 작성일: 2026-11-06
-- =====================================================
-- 20261106_comments_history.sql 을 먼저 적용해야 한다.
-- 게임 의견 댓글(20261104_game_post_comments.sql)과 같은 방식이다.
-- 대댓글은 한 단계까지이고, 같은 글의 맨 위 댓글에만 달 수 있다. 대댓글에 답하면 화면이 같은 줄에 이름을 붙여 이어 쓴다.
-- 대댓글도 글 칸(article_id 나 history_id)을 함께 가지므로 글 하나의 댓글은 한 번에 읽힌다.
-- 댓글을 지우면 그 대댓글도 함께 지워진다.
-- 20261103_comments_limits.sql 을 나중에 다시 돌리면 도배 방지 함수가 옛 내용(5건, 관리자도 셈)으로 돌아가므로 이 파일도 다시 돌린다.

alter table public.comments
  add column if not exists parent_id uuid references public.comments (id) on delete cascade;

create index if not exists idx_comments_parent_id
  on public.comments (parent_id);

-- 댓글을 쓸 때 부모 댓글 칸도 넣을 수 있게 한다. 수정은 여전히 본문만 허용한다.
grant insert (article_id, history_id, parent_id, text) on public.comments to authenticated;

-- 대댓글은 같은 글의 맨 위 댓글에만 달 수 있다
create or replace function public.comments_check_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is not null and not exists (
    select 1 from public.comments
    where id = new.parent_id
      and parent_id is null
      and article_id is not distinct from new.article_id
      and history_id is not distinct from new.history_id
  ) then
    raise exception 'invalid_parent' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_comments_check_parent on public.comments;
create trigger trg_comments_check_parent
  before insert on public.comments
  for each row execute function public.comments_check_parent();

-- 도배 방지: 한 사람이 10분에 10건까지. 대댓글로 대화가 잦아지므로 게임 의견 댓글처럼 5건에서 늘렸다.
-- 관리자는 여러 댓글에 잇달아 답할 수 있으므로 세지 않는다.
-- 관리자 주소는 src/lib/constants.js 의 ADMIN_EMAIL 과 같아야 한다.
create or replace function public.comments_limit_rate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.jwt() ->> 'email' = 'sciencegive@gmail.com' then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('comments_limit_rate:' || new.user_id::text, 0));
  if (
    select count(*) from public.comments
    where user_id = new.user_id
      and created_at > now() - interval '10 minutes'
  ) >= 10 then
    raise exception 'too_many_comments' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- 새 칸을 화면이 바로 쓸 수 있도록 PostgREST 가 표 구조를 다시 읽게 한다
notify pgrst, 'reload schema';
