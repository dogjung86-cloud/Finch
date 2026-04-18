import { supabase } from './supabase';

// 어드민 저장/삭제 후 ISR 캐시를 즉시 무효화.
// 실패해도 치명적이지 않으므로 에러를 삼키고 로그만 남긴다.
export async function revalidatePaths(paths) {
  if (!paths || paths.length === 0) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ paths }),
    });
  } catch (err) {
    console.error('revalidatePaths error:', err);
  }
}
