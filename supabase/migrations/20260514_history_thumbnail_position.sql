-- =====================================================
-- history_science: 썸네일 포커스 포인트(object-position) 컬럼 추가
-- 적용 방법: Supabase Studio → SQL Editor 에 그대로 붙여넣고 Run
-- 작성일: 2026-05-14
-- =====================================================
-- 목록 카드(홈/과학사 페이지)에서 썸네일을 어느 지점을 중심으로
-- 보여줄지 admin 에서 직접 조절할 수 있도록 한다.
-- 값 형식: CSS object-position 문자열 (예: "50% 30%", "70% 50%")
-- 미설정 시 기존 동작과 동일하게 50% 50% (중앙)으로 폴백.

ALTER TABLE history_science
  ADD COLUMN IF NOT EXISTS thumbnail_position TEXT;
