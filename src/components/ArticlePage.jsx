'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// 기사 본문 렌더링 직전 줄바꿈 보정.
// word-break: keep-all 환경에서 발생하는 대표적인 어색한 줄바꿈들을 후처리한다.
// 원본 DB는 건드리지 않고 렌더 시점에만 적용.
const fixLineBreaks = (html) =>
  html
    // 0) DB에 저장된 ZWSP(U+200B) 제거 — 포스팅 스킬이 한글(English) 사이에 박아뒀지만
    //    이게 `천남성과(Araceae)` 같은 덩어리를 쪼개 오히려 가독성을 해침
    .replace(/\u200B/g, '')
    // 1) 한글과 바로 뒤 ~ 사이에 WORD JOINER → `자~`가 `자`와 `~` 사이에서 끊기는 문제 방지
    .replace(/([가-힣])~/g, '$1\u2060~')
    // 2) 짧은 감탄사(~로 끝나는 3글자 이하) 뒤 공백을 nbsp로 → 다음 단어와 같은 줄 유지
    .replace(/(^|[\s>])([^\s<>]{1,3}~)\s/g, '$1$2\u00A0')
    // 3) 숫자%와 바로 붙은 한글 사이에 WORD JOINER → 70%가 처럼 조사가 다음 줄로 떨어지는 문제 방지
    .replace(/(\d+(?:\.\d+)?%)([가-힣])/g, '$1\u2060$2')
    // 4) 한글과 바로 뒤 `(` 사이에 WORD JOINER → `천남성과(Araceae)`처럼 한글(영어) 덩어리가
    //    경계에서 둘로 쪼개지는 문제 방지. keep-all이 한글↔라틴 경계를 끊을 수 있게 두는 것을 강제로 막음.
    .replace(/([가-힣])\(/g, '$1\u2060(')
    // 5) 닫는 `)` 와 바로 뒤 한글 사이에도 WORD JOINER → `(Araceae)식물` 같은 경계 끊김 방지
    .replace(/\)([가-힣])/g, ')\u2060$1');

const FONT_SIZES = [18, 20, 22, 24];

export default function ArticlePage({ article, onBack, user, onLoginRequest }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
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

  // 조회수 증가 (페이지당 1회)
  useEffect(() => {
    if (viewCounted.current || !article?.id) return;
    viewCounted.current = true;
    supabase.rpc('increment_view_count', { article_id: article.id });
  }, [article?.id]);

  // localStorage에서 댓글 로드
  useEffect(() => {
    const stored = localStorage.getItem(`finch_comments_${article.id}`);
    if (stored) {
      try { setComments(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [article.id]);

  // 댓글 저장
  const saveComments = (updated) => {
    setComments(updated);
    localStorage.setItem(`finch_comments_${article.id}`, JSON.stringify(updated));
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      author: user?.name || '익명',
      email: user?.email || '',
      text: newComment.trim(),
      date: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
    };

    saveComments([comment, ...comments]);
    setNewComment('');
  };

  const handleDeleteComment = (commentId) => {
    const updated = comments.filter((c) => c.id !== commentId);
    saveComments(updated);
  };

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
        {/* 뒤로 가기 */}
        <button className="article-page__back" onClick={onBack}>
          ← 목록으로
        </button>

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
          <span className="article-page__date">{article.date || (article.created_at ? new Date(article.created_at).toLocaleDateString('ko-KR') : '')}</span>
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
          /* ── 멤버십 전용: 미리보기 + 잠금 ── */
          <>
            <div className="article-page__body article-page__body--preview">
              {(() => {
                const content = article.fullContent || article.full_content || '';
                if (content.includes('<')) {
                  // HTML 본문의 앞 300자만 표시
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
          /* ── 일반 기사: 전체 본문 ── */
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

            {/* 구분선 */}
            <hr className="article-page__divider" />

        {/* ── 댓글 섹션 ── */}
        <section className="comments-section">
          <h2 className="comments-section__title">
            💬 댓글 <span className="comments-section__count">{comments.length}</span>
          </h2>

          {/* 댓글 입력 */}
          {user ? (
            <form className="comment-form" onSubmit={handleSubmitComment}>
              <div className="comment-form__user">
                <div className="comment-form__avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="comment-form__name">{user.name}</span>
              </div>
              <textarea
                className="comment-form__textarea"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 남겨주세요..."
                rows={3}
              />
              <div className="comment-form__actions">
                <button
                  type="submit"
                  className="comment-form__submit"
                  disabled={!newComment.trim()}
                >
                  댓글 게시
                </button>
              </div>
            </form>
          ) : (
            <div className="comment-login-prompt">
              <p>댓글을 남기려면 로그인이 필요합니다.</p>
              <button
                className="comment-login-prompt__btn"
                onClick={onLoginRequest}
              >
                로그인하기
              </button>
            </div>
          )}

          {/* 댓글 목록 */}
          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="comments-list__empty">아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="comment-item">
                  <div className="comment-item__avatar">
                    {c.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="comment-item__body">
                    <div className="comment-item__header">
                      <span className="comment-item__author">{c.author}</span>
                      <span className="comment-item__date">{c.date}</span>
                      {user && c.email === user.email && (
                        <button
                          className="comment-item__delete"
                          onClick={() => handleDeleteComment(c.id)}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <p className="comment-item__text">{c.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
          </>
        )}
      </div>
    </div>
  );
}
