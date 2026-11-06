import PageHead from '../../src/components/site/PageHead';
import ArticlesHub from '../../src/components/articles/ArticlesHub';
import { getAllColumns, getHistoryItems, sortByDateDesc } from '../../src/lib/content';
import { OG_IMAGE, SITE } from '../../src/data/site';

export const revalidate = 60;

export const metadata = {
  title: 'Article',
  description:
    '과학드림의 과학 칼럼과 일상 기록을 모았습니다.',
  alternates: { canonical: '/articles' },
  openGraph: {
    title: 'Article | 과학드림',
    description: '과학드림의 과학 칼럼과 일상 기록',
    url: `${SITE.url}/articles`,
    type: 'website',
    images: [OG_IMAGE],
  },
};

export default async function ArticlesPage() {
  const [columns, history] = await Promise.all([getAllColumns(), getHistoryItems()]);
  const items = sortByDateDesc([...columns, ...history]);
  return (
    <>
      <PageHead
        chapter="article"
        title="과학 칼럼, 기록"
        lead="흥미로운 과학 소식을 발견하면 칼럼으로 씁니다."
      />
      <ArticlesHub items={items} initialSeries="all" />
    </>
  );
}
