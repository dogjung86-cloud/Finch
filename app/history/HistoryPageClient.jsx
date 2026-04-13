'use client';

import Link from 'next/link';


export default function HistoryPageClient({ items }) {
  return (
    <div className="history-page">
      <div className="history-page__container">
        <Link href="/" className="history-page__back">← 홈으로</Link>

        <div className="history-page__header">
          <h1 className="history-page__title">100년 전 과학</h1>
          <p className="history-page__sub">과거의 과학 이야기를 되짚어봅니다</p>
        </div>

        {items.length === 0 ? (
          <div className="history-page__empty">
            아직 등록된 기사가 없습니다.
          </div>
        ) : (
          <div className="history-page__list">
            {items.map((item) => (
              <Link key={item.id} href={`/history/${item.id}`} className="history-card">
                {item.thumbnail && (
                  <div className="history-card__img">
                    <img src={item.thumbnail} alt={item.title} />
                  </div>
                )}
                <div className="history-card__body">
                  {item.date_original && <span className="history-card__date">{item.date_original}</span>}
                  <h3 className="history-card__title">{item.title}</h3>
                  {item.content && (
                    <p className="history-card__excerpt">
                      {item.content.length > 120 ? item.content.slice(0, 120) + '...' : item.content}
                    </p>
                  )}
                  {item.source && (
                    <span className="history-card__source">출처: {item.source}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
