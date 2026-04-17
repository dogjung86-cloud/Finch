import { createServerSupabase } from '../../src/lib/supabase-server';
import ArticlesPageClient from './ArticlesPageClient';

export const revalidate = 60;

export const metadata = {
  title: '과학 기사 모음 | Finch 과학 매거진',
  description:
    '물리·화학·생물·천문 등 카테고리별 최신 과학 기사를 한 곳에서. 쉽고 재미있게 읽는 사이언스 아티클 — 과학 매거진 Finch.',
  alternates: { canonical: '/articles' },
  openGraph: {
    title: '과학 기사 모음 | Finch',
    description: '카테고리별 최신 과학 기사 – 쉽고 재미있게 읽는 사이언스 아티클',
    url: 'https://www.finch.co.kr/articles',
    type: 'website',
  },
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
