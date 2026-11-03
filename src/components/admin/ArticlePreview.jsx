'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FONT_SIZES, fixLineBreaks } from '../../lib/articleText';
import { normalizeEditorHtml } from '../../lib/adminEditor';

// 저장 전에 공개 화면과 같은 스타일로 글을 보여 준다.
// .admin-page 가 디자인 변수를 덮어쓰므로 그 바깥(body)에 그린다.
// 구조는 ArticlePage, HistoryDetailClient 의 머리와 본문을 따른다.
export default function ArticlePreview({ kicker, title, author, date, thumbnail, html, note, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const body = normalizeEditorHtml(html);

  return createPortal(
    <div className="admin-preview" role="dialog" aria-modal="true" aria-label="미리보기">
      <div className="admin-preview__bar">
        <strong>미리보기</strong>
        <span className="admin-preview__note">{note || '독자에게 이렇게 보입니다. 이 화면에서는 아무것도 저장되지 않습니다.'}</span>
        <button ref={closeRef} type="button" className="admin-preview__close" onClick={onClose}>
          닫기
        </button>
      </div>
      <div className="article-page">
        <div className="article-page__container">
          <p className="article-page__kicker">{kicker}</p>
          <h1 className="article-page__title">{title || '(제목 없음)'}</h1>
          <div className="article-page__meta">
            {author && <span className="article-page__author">{author}</span>}
            {date && <span className="article-page__date">{date}</span>}
          </div>
          {thumbnail && !body.includes(thumbnail) && (
            <div className="article-page__body">
              <p className="ql-align-center">
                <img src={thumbnail} alt={title} referrerPolicy="no-referrer" />
              </p>
            </div>
          )}
          <div className="article-page__body" data-fontsize={FONT_SIZES[1]}>
            <div dangerouslySetInnerHTML={{ __html: fixLineBreaks(body) }} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
