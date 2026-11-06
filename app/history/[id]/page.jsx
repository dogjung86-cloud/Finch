import { notFound } from 'next/navigation';
import { getHistoryById, SERIES } from '../../../src/lib/content';
import HistoryDetailClient from './HistoryDetailClient';
import { OG_IMAGE } from '../../../src/data/site';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const item = await getHistoryById(id);

  if (!item) return { title: '글을 찾을 수 없습니다' };

  return {
    title: `${item.title} · ${SERIES.history.label}`,
    alternates: { canonical: `/history/${id}` },
    openGraph: {
      title: item.title,
      images: item.thumbnail ? [{ url: item.thumbnail }] : [OG_IMAGE],
      type: 'article',
      siteName: '과학드림',
    },
  };
}

export default async function HistoryDetailRoute({ params }) {
  const { id } = await params;
  const item = await getHistoryById(id);

  if (!item) {
    notFound();
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
      name: '과학드림',
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
      '@id': `https://www.finch.co.kr/history/${id}`,
    },
    articleSection: SERIES.history.label,
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
