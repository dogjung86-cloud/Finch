-- =====================================================
-- 글, 과학사, 이미지를 쓰는 권한을 관리자 계정으로만 좁힌다
-- 적용 방법: Supabase Studio → SQL Editor 에 그대로 붙여넣고 Run
--            (여러 번 실행해도 안전하다)
-- 작성일: 2026-11-03
-- =====================================================
-- 이전에는 articles 를 로그인 없이, history_science 를 아무 로그인으로나 쓸 수 있었다.
-- 이미지도 finch-100-years-ago 는 로그인 없이, article-thumbnails 는 아무 로그인으로나 올리고 덮어쓸 수 있었다.
-- 방문 기록은 아무 로그인으로나 읽을 수 있었다. 쓰기는 방문자마다 해야 하므로 그대로 둔다.
-- 공개된 글을 읽는 정책은 바꾸지 않는다.
-- 어드민 화면은 sciencegive@gmail.com 로그인 세션으로 쓰고, 조회수 함수 increment_view_count 는
-- security definer 라서 둘 다 그대로 동작한다.

-- 요즘 과학 글
drop policy if exists "Anon insert" on public.articles;
drop policy if exists "Anon update" on public.articles;
drop policy if exists "Anon delete" on public.articles;
drop policy if exists articles_admin_insert on public.articles;
drop policy if exists articles_admin_update on public.articles;
drop policy if exists articles_admin_delete on public.articles;
create policy articles_admin_insert on public.articles
  for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'sciencegive@gmail.com');
create policy articles_admin_update on public.articles
  for update to authenticated
  using ((auth.jwt() ->> 'email') = 'sciencegive@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'sciencegive@gmail.com');
create policy articles_admin_delete on public.articles
  for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'sciencegive@gmail.com');

-- 과학사 글
drop policy if exists "Auth manage" on public.history_science;
drop policy if exists history_science_admin_manage on public.history_science;
create policy history_science_admin_manage on public.history_science
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'sciencegive@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'sciencegive@gmail.com');

-- 방문 기록
drop policy if exists "Auth can read" on public.page_views;
drop policy if exists page_views_admin_read on public.page_views;
create policy page_views_admin_read on public.page_views
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'sciencegive@gmail.com');

-- 글 이미지. 공개 버킷이라 이미지 주소로 보는 것은 이 정책과 상관없이 된다.
drop policy if exists "anon insert finch-100-years-ago" on storage.objects;
drop policy if exists "anon update finch-100-years-ago" on storage.objects;
drop policy if exists "Allow authenticated update" on storage.objects;
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "article-thumbnails authenticated select" on storage.objects;
drop policy if exists "article-thumbnails authenticated update" on storage.objects;
drop policy if exists finch_100y_delete on storage.objects;
drop policy if exists finch_100y_insert on storage.objects;
drop policy if exists finch_100y_update on storage.objects;
drop policy if exists article_images_admin_manage on storage.objects;
create policy article_images_admin_manage on storage.objects
  for all to authenticated
  using (
    bucket_id in ('article-thumbnails', 'finch-100-years-ago')
    and (auth.jwt() ->> 'email') = 'sciencegive@gmail.com'
  )
  with check (
    bucket_id in ('article-thumbnails', 'finch-100-years-ago')
    and (auth.jwt() ->> 'email') = 'sciencegive@gmail.com'
  );
