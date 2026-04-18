'use client';

import Link from 'next/link';
import MagazineGrid from '../src/components/MagazineGrid';
import HistoryListSection from '../src/components/HistoryListSection';

export default function HomePageClient({ articles, historyItems }) {
  const latestHistory = historyItems && historyItems.length > 0 ? historyItems[0] : null;

  return (
    <>
      <MagazineGrid articles={articles} latestHistory={latestHistory} />
      <HistoryListSection items={historyItems} />

      <div className="playlab-cta-wrap">
        <Link href="/playlab" className="playlab-cta">
          <span className="playlab-cta__icon" aria-hidden="true">🎮</span>
          <div className="playlab-cta__body">
            <span className="playlab-cta__label">Play Lab</span>
            <span className="playlab-cta__title">과학을 게임으로 즐겨보세요</span>
          </div>
          <span className="playlab-cta__arrow" aria-hidden="true">→</span>
        </Link>
      </div>
    </>
  );
}
