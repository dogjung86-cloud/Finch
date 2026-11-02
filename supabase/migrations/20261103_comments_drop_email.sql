-- =====================================================
-- comments: 작성자 이메일 칸을 없애고 user_id 로 본인을 확인한다
-- 적용 방법: Supabase Studio → SQL Editor 에 그대로 붙여넣고 Run
--            (여러 번 실행해도 안전하다)
-- 작성일: 2026-11-03
-- =====================================================
-- 댓글은 누구나 읽는 표인데 user_email 칸이 있어서 공개 키만으로 작성자 이메일을 읽을 수 있었다.
-- 이제 이메일은 저장하지 않고, 어드민 화면에도 이메일 없이 이름만 나온다.
-- 작성자 id, 이름, 사진은 화면이 보낸 값을 믿지 않고 로그인 토큰에서 채운다.
-- 회원 탈퇴로 auth.users 행이 지워지면 그 사람의 댓글도 함께 지워진다.
-- 누구나 읽는 정책 comments_select 는 바꾸지 않는다.

alter table public.comments
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- 이미 있는 댓글은 이메일로 계정을 찾아 옮긴다.
-- 계정을 못 찾은 댓글이 있으면 아래 set not null 에서 오류가 나고 전체가 되돌려진다.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'comments' and column_name = 'user_email'
  ) then
    update public.comments c
    set user_id = u.id
    from auth.users u
    where c.user_id is null
      and lower(u.email) = lower(c.user_email);
  end if;
end;
$$;

-- 이메일을 비교하던 정책을 먼저 지워야 칸을 지울 수 있다
drop policy if exists "comments_insert" on public.comments;
drop policy if exists "comments_update" on public.comments;
drop policy if exists "comments_delete" on public.comments;

alter table public.comments drop column if exists user_email;

alter table public.comments
  alter column user_id set not null,
  alter column user_id set default auth.uid(),
  alter column user_name set default left(
    coalesce(
      nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
      nullif(auth.jwt() -> 'user_metadata' ->> 'name', ''),
      '익명'
    ),
    40
  ),
  alter column user_avatar set default nullif(auth.jwt() -> 'user_metadata' ->> 'avatar_url', '');

create index if not exists idx_comments_user_id
  on public.comments (user_id);

-- 댓글 쓰기는 글과 본문만, 수정은 본문만 허용한다
revoke all on public.comments from anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert (article_id, text) on public.comments to authenticated;
grant update (text) on public.comments to authenticated;
grant delete on public.comments to authenticated;

create policy "comments_insert"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "comments_update"
  on public.comments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 관리자 주소는 src/lib/constants.js 의 ADMIN_EMAIL 과 같아야 한다
create policy "comments_delete"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'sciencegive@gmail.com');

-- 수정 시각은 서버 시계로 남긴다
create or replace function public.comments_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_comments_touch_updated_at on public.comments;
create trigger trg_comments_touch_updated_at
  before update on public.comments
  for each row execute function public.comments_touch_updated_at();
