import { createServerSupabase } from '../../../src/lib/supabase-server';
import ArticlePageClient from './ArticlePageClient';

// ── 동적 메타데이터 (SEO 핵심!) ──
export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = createServerSupabase();
  const { data: article } = await supabase
    .from('articles')
    .select('title, excerpt, thumbnail, author')
    .eq('id', id)
    .single();

  if (!article) {
    return { title: '기사를 찾을 수 없습니다 – Finch' };
  }

  return {
    title: `${article.title} – Finch`,
    description: article.excerpt || '',
    openGraph: {
      title: article.title,
      description: article.excerpt || '',
      images: article.thumbnail ? [{ url: article.thumbnail }] : [],
      type: 'article',
      siteName: 'Finch',
      authors: [article.author || 'The Finch'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || '',
      images: article.thumbnail ? [article.thumbnail] : [],
    },
  };
}

// ── 서버 컴포넌트: 기사 데이터를 서버에서 가져와서 완성된 HTML로 전달 ──
export default async function ArticleRoute({ params }) {
  const { id } = await params;
  const supabase = createServerSupabase();
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !article) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: '#999' }}>
        <h1>기사를 찾을 수 없습니다</h1>
        <p>삭제되었거나 존재하지 않는 기사입니다.</p>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || '',
    image: article.thumbnail ? [article.thumbnail] : undefined,
    datePublished: article.created_at,
    dateModified: article.updated_at || article.created_at,
    author: {
      '@type': 'Person',
      name: article.author || 'The Finch',
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
      '@id': `https://www.finch.co.kr/article/${id}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticlePageClient article={article} />
    </>
  );
}
