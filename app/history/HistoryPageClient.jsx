'use client';

import Link from 'next/link';
import SmartImage from '../../src/components/SmartImage';
import { stripHtmlToProse } from '../../src/lib/htmlText';


export default function HistoryPageClient({ items }) {
  return (
    <div className="history-page">
      <div className="history-page__container">
        <Link href="/" className="history-page__back">← 홈으로</Link>

        <div className="history-page__header">
          <h1 className="history-page__title">쓸데없이 재밌는 과학사</h1>
          <p className="history-page__sub">엉뚱한 과학의 순간들</p>
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
                    <SmartImage
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 160px"
                      style={{ objectFit: 'cover', objectPosition: item.thumbnail_position || '50% 50%' }}
                    />
                  </div>
                )}
                <div className="history-card__body">
                  {item.date_original && <span className="history-card__date">{item.date_original}</span>}
                  <h3 className="history-card__title">{item.title}</h3>
                  {item.content && (
                    <p className="history-card__excerpt">
                      {stripHtmlToProse(item.content, 120)}
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
