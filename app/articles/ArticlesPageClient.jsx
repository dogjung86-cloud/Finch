'use client';

import { useState } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: '천문우주', label: '천문우주' },
  { id: '생명진화', label: '생명진화' },
  { id: '뇌심리', label: '뇌심리' },
  { id: '지구환경', label: '지구환경' },
  { id: '물리화학', label: '물리화학' },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return '방금 전';
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function ArticlesPageClient({ articles }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all'
    ? articles
    : articles.filter((a) => a.category === activeCategory);

  return (
    <div className="articles-page">
      <div className="articles-page__container">
        <Link href="/" className="articles-page__back">← 홈으로</Link>

        <div className="articles-page__header">
          <h1 className="articles-page__title">전체 기사</h1>
          <p className="articles-page__sub">Finch의 모든 과학 기사를 탐색하세요</p>
        </div>

        <div className="articles-page__tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`articles-page__tab ${activeCategory === cat.id ? 'articles-page__tab--active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="articles-page__empty">
            이 카테고리에 아직 기사가 없습니다.
          </div>
        ) : (
          <div className="articles-page__grid">
            {filtered.map((a) => (
              <Link key={a.id} href={`/article/${a.id}`} className="articles-page__card">
                <div className="articles-page__card-img">
                  <img src={a.thumbnail} alt={a.title} referrerPolicy="no-referrer" />
                </div>
                <div className="articles-page__card-body">
                  {a.category && (
                    <span className="articles-page__card-cat">{a.category}</span>
                  )}
                  <h3 className="articles-page__card-title">{a.title}</h3>
                  <p className="articles-page__card-excerpt">{a.excerpt}</p>
                  <span className="articles-page__card-meta">{a.author} · {formatDate(a.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
