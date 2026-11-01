import PageHead from '../../src/components/site/PageHead';
import ArticlesHub from '../../src/components/articles/ArticlesHub';
import { getAllColumns, getHistoryItems, sortByDateDesc } from '../../src/lib/content';
import { SITE } from '../../src/data/site';

export const revalidate = 60;

export const metadata = {
  title: '쓸데없이 재밌는 과학사',
  description: '100년 전 신문과 잡지에 실렸던 엉뚱한 과학 이야기를 다시 읽습니다. 과학드림의 과학사 칼럼.',
  alternates: { canonical: '/history' },
  openGraph: {
    title: '쓸데없이 재밌는 과학사 | 과학드림',
    description: '100년 전 신문 속 엉뚱한 과학의 순간들',
    url: `${SITE.url}/history`,
    type: 'website',
  },
};

export default async function HistoryPage() {
  const [columns, history] = await Promise.all([getAllColumns(), getHistoryItems()]);
  const items = sortByDateDesc([...columns, ...history]);
  return (
    <>
      <PageHead
        eyebrow="Article · History"
        title="쓸데없이 재밌는 과학사"
        lead="100년 전 신문과 잡지 속에 묻혀 있던 엉뚱하고 재밌는 과학의 순간들을 꺼내 읽습니다."
      />
      <ArticlesHub items={items} initialSeries="history" />
    </>
  );
}
