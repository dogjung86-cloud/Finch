import { createClient } from '@supabase/supabase-js';

// 서버 컴포넌트용 클라이언트. 환경변수가 없으면 null 을 돌려주고,
// 호출하는 쪽에서 빈 목록으로 처리한다.
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
