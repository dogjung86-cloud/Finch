-- =====================================================
-- comments: 일상 글(history_science)에도 댓글을 단다
-- 적용 방법: Supabase Studio → SQL Editor 에 그대로 붙여넣고 Run
--            (여러 번 실행해도 안전하다)
-- 작성일: 2026-11-06
-- =====================================================
-- 20261103_comments_drop_email.sql 과 20261103_comments_limits.sql 을 먼저 적용해야 한다.
-- 칼럼 기사 댓글과 같은 표를 쓴다. 댓글 한 줄은 칼럼 기사(article_id)나 일상 글(history_id) 가운데 정확히 하나에 달린다.
-- 글자 수 제한, 도배 방지(한 사람이 10분에 5건, 두 종류를 합쳐 센다), 금칙어, 수정 시각 트리거는
-- 표에 걸려 있으므로 일상 글 댓글에도 그대로 적용된다. 읽기, 수정, 삭제 정책도 그대로다.
-- 칼럼 댓글처럼 글이 공개됐는지는 따지지 않는다. 비공개 글은 화면에 나오지 않으므로 댓글 창도 없다.
-- 일상 글을 지우면 그 글의 댓글도 함께 지워진다.

alter table public.comments
  add column if not exists history_id uuid references public.history_science (id) on delete cascade;

alter table public.comments alter column article_id drop not null;

alter table public.comments drop constraint if exists comments_one_target;
alter table public.comments
  add constraint comments_one_target
  check (num_nonnulls(article_id, history_id) = 1);

create index if not exists idx_comments_history_id
  on public.comments (history_id, created_at desc);

-- 댓글을 쓸 때 일상 글 칸도 넣을 수 있게 한다. 수정은 여전히 본문만 허용한다.
grant insert (article_id, history_id, text) on public.comments to authenticated;

-- 새 칸을 화면이 바로 쓸 수 있도록 PostgREST 가 표 구조를 다시 읽게 한다
notify pgrst, 'reload schema';
