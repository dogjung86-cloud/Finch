import { createServerSupabase } from '../../src/lib/supabase-server';
import ArticlesPageClient from './ArticlesPageClient';

export const metadata = {
  title: '전체 기사 – Finch',
  description: 'Finch의 모든 과학 기사를 카테고리별로 탐색하세요.',
};

export default async function ArticlesPage() {
  const supabase = createServerSupabase();
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, excerpt, thumbnail, author, category, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  return <ArticlesPageClient articles={articles || []} />;
}
