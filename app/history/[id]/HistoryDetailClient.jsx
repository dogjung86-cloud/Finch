'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FONT_SIZES, fixLineBreaks } from '../../../src/lib/articleText';

export default function HistoryDetailClient({ item }) {
  const router = useRouter();
  const [fontSizeIdx, setFontSizeIdx] = useState(1);

  const cycleFontSize = () => {
    setFontSizeIdx((prev) => (prev + 1) % FONT_SIZES.length);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url });
      } catch { /* 사용자 취소 */ }
    } else {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다.');
    }
  };

  const handleBack = () => {
    router.push('/history');
  };

  const content = item.content || '';
  const thumbnailInContent = item.thumbnail && content.includes(item.thumbnail);

  return (
    <div className="article-page">
      {/* 데스크톱 사이드 툴바 */}
      <div className="article-toolbar">
        <button className="article-toolbar__btn" onClick={cycleFontSize} title="글자 크기">
          <span className="article-toolbar__icon">가</span>
          <span className="article-toolbar__label">{FONT_SIZES[fontSizeIdx]}px</span>
        </button>
        <button className="article-toolbar__btn" onClick={handleShare} title="공유하기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span className="article-toolbar__label">공유</span>
        </button>
      </div>

      <div className="article-page__container">
        <button className="article-page__back" onClick={handleBack}>
          ← 재밌는 과학사 목록
        </button>

        <h1 className="article-page__title">{item.title}</h1>

        {/* 모바일 툴바 */}
        <div className="article-toolbar-mobile">
          <button className="article-toolbar-mobile__btn" onClick={cycleFontSize}>
            가 {FONT_SIZES[fontSizeIdx]}px
          </button>
          <button className="article-toolbar-mobile__btn" onClick={handleShare}>
            공유하기
          </button>
        </div>

        <div className="article-page__meta">
          {item.source && <span className="article-page__author">{item.source}</span>}
          {item.date_original && <span className="article-page__date">{item.date_original}</span>}
        </div>

        {/* 본문에 썸네일이 없으면 본문 앞에 원본 비율로 삽입 */}
        {item.thumbnail && !thumbnailInContent && (
          <div className="article-page__body">
            <p className="ql-align-center">
              <img src={item.thumbnail} alt={item.title} referrerPolicy="no-referrer" />
            </p>
          </div>
        )}

        {content && (
          <div className="article-page__body" data-fontsize={FONT_SIZES[fontSizeIdx]}>
            {content.includes('<') ? (
              <div dangerouslySetInnerHTML={{ __html: fixLineBreaks(content) }} />
            ) : (
              content.split('\n\n').map((para, i) => <p key={i}>{para}</p>)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
