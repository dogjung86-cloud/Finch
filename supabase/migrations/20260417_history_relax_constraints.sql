-- =====================================================
-- history_science: date_original / month_day NOT NULL 제약 제거
-- 적용 방법: Supabase Studio → SQL Editor 에 그대로 붙여넣고 Run
-- 작성일: 2026-04-17
-- =====================================================
-- 어드민 폼에서는 제목/썸네일/본문만 받으므로, 날짜 계열 컬럼은
-- NULL 을 허용하도록 완화한다. 기존 데이터는 그대로 유지.

ALTER TABLE history_science
  ALTER COLUMN date_original DROP NOT NULL,
  ALTER COLUMN month_day DROP NOT NULL;
