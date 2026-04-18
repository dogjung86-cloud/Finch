'use client';

import Link from 'next/link';
import SmartImage from './SmartImage';
import { stripHtmlToText } from '../lib/htmlText';

export default function HistoryListSection({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="history-home" id="history-section">
      <div className="history-home__inner">
        <header className="history-home__header">
          <h2 className="history-home__title">100년 전 과학</h2>
          <p className="history-home__sub">옛날 옛적 과학사 이야기</p>
        </header>

        <div className="history-home__grid">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/history/${item.id}`}
              className="history-home__card"
            >
              {item.thumbnail && (
                <div className="history-home__card-img">
                  <SmartImage
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 360px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}
              <div className="history-home__card-body">
                <h3 className="history-home__card-title">{item.title}</h3>
                {item.content && (
                  <p className="history-home__card-excerpt">
                    {stripHtmlToText(item.content, 90)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="history-home__footer">
          <Link href="/history" className="history-home__all">
            전체 아카이브 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
