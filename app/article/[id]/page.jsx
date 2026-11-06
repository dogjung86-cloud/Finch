import { notFound } from 'next/navigation';
import { getColumnById } from '../../../src/lib/content';
import ArticlePageClient from './ArticlePageClient';
import { OG_IMAGE } from '../../../src/data/site';

// ── 동적 메타데이터 (SEO 핵심!) ──
export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await getColumnById(id);

  if (!article) {
    return { title: '기사를 찾을 수 없습니다' };
  }

  return {
    title: article.title,
    description: article.excerpt || '',
    alternates: { canonical: `/article/${id}` },
    openGraph: {
      title: article.title,
      description: article.excerpt || '',
      images: article.thumbnail ? [{ url: article.thumbnail }] : [OG_IMAGE],
      type: 'article',
      siteName: '과학드림',
      authors: [article.author || '과학드림'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || '',
      images: article.thumbnail ? [article.thumbnail] : [OG_IMAGE.url],
    },
  };
}

// ── 서버 컴포넌트: 기사 데이터를 서버에서 가져와서 완성된 HTML로 전달 ──
export default async function ArticleRoute({ params }) {
  const { id } = await params;
  const article = await getColumnById(id);

  if (!article) {
    notFound();
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
      name: article.author || '과학드림',
    },
    publisher: {
      '@type': 'Organization',
      name: '과학드림',
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
