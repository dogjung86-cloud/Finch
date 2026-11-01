import PageHead from '../../src/components/site/PageHead';
import ArticlesHub from '../../src/components/articles/ArticlesHub';
import { getAllColumns, getHistoryItems, sortByDateDesc } from '../../src/lib/content';
import { SITE } from '../../src/data/site';

export const revalidate = 60;

export const metadata = {
  title: 'Article',
  description:
    '과학드림의 과학 칼럼. 요즘 과학 소식과 쓸데없이 재밌는 과학사 이야기를 쉽고 재밌게 풀어 씁니다.',
  alternates: { canonical: '/articles' },
  openGraph: {
    title: 'Article | 과학드림',
    description: '요즘 과학 이야기와 쓸데없이 재밌는 과학사',
    url: `${SITE.url}/articles`,
    type: 'website',
  },
};

export default async function ArticlesPage() {
  const [columns, history] = await Promise.all([getAllColumns(), getHistoryItems()]);
  const items = sortByDateDesc([...columns, ...history]);
  return (
    <>
      <PageHead
        eyebrow="Article"
        title="과학 칼럼"
        lead="흥미로운 과학 소식을 발견하면 칼럼으로 씁니다. 요즘 과학 이야기와 쓸데없이 재밌는 과학사를 함께 모았어요."
      />
      <ArticlesHub items={items} initialSeries="all" />
    </>
  );
}
