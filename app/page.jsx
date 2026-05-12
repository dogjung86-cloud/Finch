import { createServerSupabase } from '../src/lib/supabase-server';
import HomePageClient from './HomePageClient';

// 홈은 60초 ISR — admin 저장 후 최대 60초까지 반영 지연
export const revalidate = 60;

export default async function HomePage() {
  const supabase = createServerSupabase();
  // 홈 카드에 필요한 컬럼만 — full_content 등 본문 필드는 제외해 RSC 페이로드 축소
  const [articlesRes, historyRes] = await Promise.all([
    supabase
      .from('articles')
      .select('id,title,excerpt,thumbnail,author,category,created_at,display_order')
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('history_science')
      .select('id,title,thumbnail,content')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  // display_order당 최신 1개만 선택 (새 기사가 기존 기사를 대체)
  const seen = new Set();
  const articles = (articlesRes.data || []).filter((a) => {
    if (seen.has(a.display_order)) return false;
    seen.add(a.display_order);
    return true;
  }).slice(0, 8);

  const historyItems = historyRes.data || [];

  return <HomePageClient articles={articles} historyItems={historyItems} />;
}
