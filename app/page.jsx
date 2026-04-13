import { createServerSupabase } from '../src/lib/supabase-server';
import HomePageClient from './HomePageClient';

export default async function HomePage() {
  const supabase = createServerSupabase();
  // display_order 기준 정렬, 같은 순서면 최신 우선
  const { data: allArticles } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  // display_order당 최신 1개만 선택 (새 기사가 기존 기사를 대체)
  const seen = new Set();
  const articles = (allArticles || []).filter((a) => {
    if (seen.has(a.display_order)) return false;
    seen.add(a.display_order);
    return true;
  }).slice(0, 6);

  return <HomePageClient articles={articles || []} />;
}
