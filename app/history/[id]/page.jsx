import { createServerSupabase } from '../../../src/lib/supabase-server';
import HistoryDetailClient from './HistoryDetailClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = createServerSupabase();
  const { data: item } = await supabase
    .from('history_science')
    .select('title, thumbnail')
    .eq('id', id)
    .single();

  if (!item) return { title: '항목을 찾을 수 없습니다 – Finch' };

  return {
    title: `${item.title} – 100년 전 과학 – Finch`,
    alternates: { canonical: `/history/${id}` },
    openGraph: {
      title: item.title,
      images: item.thumbnail ? [{ url: item.thumbnail }] : [],
      type: 'article',
      siteName: 'Finch',
    },
  };
}

export default async function HistoryDetailRoute({ params }) {
  const { id } = await params;
  const supabase = createServerSupabase();
  const { data: item, error } = await supabase
    .from('history_science')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !item) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: '#999' }}>
        <h1>항목을 찾을 수 없습니다</h1>
        <p>삭제되었거나 존재하지 않는 항목입니다.</p>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title,
    image: item.thumbnail ? [item.thumbnail] : undefined,
    datePublished: item.created_at,
    dateModified: item.updated_at || item.created_at,
    author: {
      '@type': 'Organization',
      name: 'Finch',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Finch',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.finch.co.kr/images/favicon/favicon-512x512.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.finch.co.kr/history/${id}`,
    },
    articleSection: '100년 전 과학',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HistoryDetailClient item={item} />
    </>
  );
}
