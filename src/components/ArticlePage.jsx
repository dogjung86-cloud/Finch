'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FONT_SIZES, fixLineBreaks } from '../lib/articleText';
import { formatDate } from '../lib/format';
import { SERIES } from '../lib/series';
import ReadProgress from './articles/ReadProgress';
import Comments from './articles/Comments';

export default function ArticlePage({ article, user, onLoginRequest }) {
  const [fontSizeIdx, setFontSizeIdx] = useState(1);
  const viewCounted = useRef(false);

  const cycleFontSize = () => {
    setFontSizeIdx((prev) => (prev + 1) % FONT_SIZES.length);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, url });
      } catch { /* 사용자 취소 */ }
    } else {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다.');
    }
  };

  // 조회수 증가 (페이지당 1회). Supabase 가 없는 로컬 미리보기에서는 세지 않는다
  useEffect(() => {
    if (viewCounted.current || !article?.id || !isSupabaseConfigured) return;
    viewCounted.current = true;
    supabase.rpc('increment_view_count', { article_id: article.id })
      .then(({ error }) => {
        if (error) console.error('increment_view_count error:', error);
      });
  }, [article?.id]);

  return (
    <div className="article-page">
      <ReadProgress />
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
        {/* 뒤로 가기 */}
        <Link className="article-page__back" href="/articles">
          ← 칼럼 목록
        </Link>

        <p className="article-page__kicker">
          {SERIES.column.label}{article.category && article.category !== '미분류' ? ` · ${article.category}` : ''}
        </p>

        {/* 제목 */}
        <h1 className="article-page__title">{article.title}</h1>

        {/* 모바일 툴바 */}
        <div className="article-toolbar-mobile">
          <button className="article-toolbar-mobile__btn" onClick={cycleFontSize}>
            가 {FONT_SIZES[fontSizeIdx]}px
          </button>
          <button className="article-toolbar-mobile__btn" onClick={handleShare}>
            공유하기
          </button>
        </div>

        {/* 메타 정보 */}
        <div className="article-page__meta">
          <span className="article-page__author">{article.author}</span>
          <span className="article-page__date">{article.date || formatDate(article.created_at)}</span>
        </div>

        {/* 본문에 썸네일이 없으면 본문 앞에 원본 비율로 삽입 */}
        {article.thumbnail && !(article.full_content || '').includes(article.thumbnail) && (
          <div className="article-page__body">
            <p className="ql-align-center">
              <img src={article.thumbnail} alt={article.title} referrerPolicy="no-referrer" />
            </p>
          </div>
        )}

        {/* 본문 */}
        {article.is_membership ? (
          <>
            <div className="article-page__body article-page__body--preview">
              {(() => {
                const content = article.fullContent || article.full_content || '';
                if (content.includes('<')) {
                  const truncated = content.substring(0, 300);
                  return <div dangerouslySetInnerHTML={{ __html: fixLineBreaks(truncated) }} />;
                }
                return content.split('\n\n').slice(0, 2).map((para, i) => (
                  <p key={i}>{para}</p>
                ));
              })()}
            </div>
            <div className="membership-lock">
              <div className="membership-lock__icon">🔒</div>
              <h3 className="membership-lock__title">멤버십 전용 콘텐츠</h3>
              <p className="membership-lock__desc">
                이 기사는 과학드림 멤버십 회원만 열람할 수 있습니다.
              </p>
              <a
                href="https://www.youtube.com/@sciencedream/join"
                target="_blank"
                rel="noopener noreferrer"
                className="membership-lock__btn"
              >
                멤버십 가입하기 →
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="article-page__body" data-fontsize={FONT_SIZES[fontSizeIdx]}>
              {(() => {
                const content = article.fullContent || article.full_content || '';
                if (content.includes('<')) {
                  return <div dangerouslySetInnerHTML={{ __html: fixLineBreaks(content) }} />;
                }
                return content.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ));
              })()}
            </div>

            <hr className="article-page__divider" />

            <Comments series="column" postId={article.id} user={user} onLoginRequest={onLoginRequest} />
          </>
        )}
      </div>
    </div>
  );
}
