'use client';

import { useMemo, useState } from 'react';
import ArticleCard from './ArticleCard';
import { COLUMN_CATEGORIES, SERIES } from '../../lib/series';

const PAGE = 12;

// 아티클 모아보기: 시리즈 탭 + (요즘 과학일 때) 분야 필터 + 더 보기
export default function ArticlesHub({ items, initialSeries = 'all' }) {
  const [series, setSeries] = useState(initialSeries);
  const [category, setCategory] = useState('all');
  const [limit, setLimit] = useState(PAGE);

  const counts = useMemo(
    () => ({
      all: items.length,
      column: items.filter((i) => i.series === 'column').length,
      history: items.filter((i) => i.series === 'history').length,
    }),
    [items],
  );

  const categories = useMemo(() => {
    const present = new Set(items.filter((i) => i.series === 'column' && i.category).map((i) => i.category));
    return COLUMN_CATEGORIES.filter((c) => present.has(c));
  }, [items]);

  const filtered = useMemo(() => {
    let list = series === 'all' ? items : items.filter((i) => i.series === series);
    if (series === 'column' && category !== 'all') list = list.filter((i) => i.category === category);
    return list;
  }, [items, series, category]);

  const pickSeries = (id) => {
    setSeries(id);
    setCategory('all');
    setLimit(PAGE);
  };

  const visible = filtered.slice(0, limit);

  const tabs = [
    { id: 'all', label: '전체' },
    { id: 'column', label: SERIES.column.label },
    { id: 'history', label: SERIES.history.label },
  ];

  return (
    // data-* 는 미리보기 사본(scripts/preview-runtime.js)이 탭과 분야 필터를 흉내 낼 때 읽는다
    <section className="container hub" aria-label="칼럼 목록" data-initial-series={initialSeries} data-categories={categories.join(',')}>
      <div className="tabs" role="group" aria-label="시리즈">
        {tabs.map((t) => (
          <button key={t.id} type="button" className="tab" data-series={t.id} aria-pressed={series === t.id} onClick={() => pickSeries(t.id)}>
            {t.label}
            <span className="tab__count">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {series === 'column' && categories.length > 0 && (
        <div className="pills hub__cats" role="group" aria-label="분야">
          {['all', ...categories].map((c) => (
            <button
              key={c}
              type="button"
              className="pill"
              aria-pressed={category === c}
              onClick={() => {
                setCategory(c);
                setLimit(PAGE);
              }}
            >
              {c === 'all' ? '모든 분야' : c}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="empty hub__empty">아직 올라온 글이 없어요.</p>
      ) : (
        <>
          <div className="article-grid hub__grid">
            {visible.map((item, i) => (
              <div key={item.key} data-series={item.series} data-category={item.category || ''} data-reveal style={{ '--d': `${(i % 3) * 60}ms` }}>
                <ArticleCard item={item} priority={i < 3} />
              </div>
            ))}
          </div>
          {filtered.length > limit && (
            <div className="hub__more">
              <button type="button" className="btn btn--outline btn--lg" onClick={() => setLimit((n) => n + PAGE)}>
                글 더 보기
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
