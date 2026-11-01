import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경변수가 없는 로컬 미리보기에서도 앱 전체가 죽지 않도록 자리표시 값으로 생성한다.
// (배포 환경에는 항상 실제 값이 들어 있으므로 동작이 바뀌지 않는다)
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'public-anon-key-not-configured',
);
