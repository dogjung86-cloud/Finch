'use client';

import Link from 'next/link';
import SmartImage from '../../../src/components/SmartImage';

export default function HistoryDetailClient({ item }) {
  return (
    <div className="history-page">
      <div className="history-page__container">
        <Link href="/history" className="history-page__back">← 100년 전 과학 목록</Link>

        <article className="history-detail">
          <header className="history-detail__header">
            {item.date_original && (
              <span className="history-detail__date">{item.date_original}</span>
            )}
            <h1 className="history-detail__title">{item.title}</h1>
            {item.source && (
              <span className="history-detail__source">출처: {item.source}</span>
            )}
          </header>

          {item.thumbnail && (
            <div className="history-detail__thumb">
              <SmartImage
                src={item.thumbnail}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                style={{ objectFit: 'cover' }}
                priority
              />
            </div>
          )}

          {item.content && (
            <div
              className="history-detail__content"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          )}
        </article>
      </div>
    </div>
  );
}
