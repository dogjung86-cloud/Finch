import PageHead from '../../src/components/site/PageHead';
import ArticlesHub from '../../src/components/articles/ArticlesHub';
import { getAllColumns, getHistoryItems, sortByDateDesc } from '../../src/lib/content';
import { OG_IMAGE, SITE } from '../../src/data/site';

export const revalidate = 60;

export const metadata = {
  title: '일상',
  description: '과학드림의 일상 기록을 모았습니다.',
  alternates: { canonical: '/history' },
  openGraph: {
    title: '일상 | 과학드림',
    description: '과학드림의 일상 기록',
    url: `${SITE.url}/history`,
    type: 'website',
    images: [OG_IMAGE],
  },
};

export default async function HistoryPage() {
  const [columns, history] = await Promise.all([getAllColumns(), getHistoryItems()]);
  const items = sortByDateDesc([...columns, ...history]);
  return (
    <>
      <PageHead
        chapter="article"
        eyebrow="Article · 일상"
        title="일상"
      />
      <ArticlesHub items={items} initialSeries="history" />
    </>
  );
}
