'use client';

import { useState, useEffect, useRef } from 'react';
import SmartImage from './SmartImage';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAIL } from '../lib/constants';

// 기사 본문 렌더링 직전 줄바꿈 보정.
const fixLineBreaks = (html) =>
  html
    .replace(/\u200B/g, '')
    .replace(/([가-힣])~/g, '$1\u2060~')
    .replace(/(^|[\s>])([^\s<>]{1,3}~)\s/g, '$1$2\u00A0')
    .replace(/(\d+(?:\.\d+)?%)([가-힣])/g, '$1\u2060$2')
    .replace(/([가-힣])\(/g, '$1\u2060(')
    .replace(/\)([가-힣])/g, ')\u2060$1');

const FONT_SIZES = [18, 20, 22, 24];

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}개월 전`;
  return `${Math.floor(diff / 31536000)}년 전`;
}

export default function ArticlePage({ article, onBack, user, onLoginRequest }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fontSizeIdx, setFontSizeIdx] = useState(1);
  const [inputFocused, setInputFocused] = useState(false);
  const viewCounted = useRef(false);
  const editRef = useRef(null);
  const newCommentRef = useRef(null);

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
    supabase.rpc('increment_view_count', { article_id: article.id })
      .then(({ error }) => {
        if (error) console.error('increment_view_count error:', error);
      });
  }, [article?.id]);

  // Supabase에서 댓글 로드
  const loadComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('article_id', article.id)
      .order('created_at', { ascending: false });
    if (!error && data) setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    if (article?.id) loadComments();
  }, [article?.id]);

  // 댓글 작성
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);

    const { error } = await supabase.from('comments').insert([{
      article_id: article.id,
      user_email: user.email,
      user_name: user.name,
      user_avatar: user.avatar || null,
      text: newComment.trim(),
    }]);

    if (!error) {
      setNewComment('');
      setInputFocused(false);
      await loadComments();
    }
    setSubmitting(false);
  };

  // 댓글 수정
  const handleStartEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) return;
    const { error } = await supabase
      .from('comments')
      .update({ text: editText.trim(), updated_at: new Date().toISOString() })
      .eq('id', commentId);

    if (!error) {
      setEditingId(null);
      setEditText('');
      await loadComments();
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  // 입력 취소
  const handleCancelNew = () => {
    setNewComment('');
    setInputFocused(false);
    newCommentRef.current?.blur();
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

            {/* ── 댓글 섹션 (YouTube 스타일) ── */}
            <section className="comments-section">
              <div className="comments-section__header">
                <span className="comments-section__count">댓글 {comments.length}개</span>
              </div>

              {/* 댓글 입력 */}
              {user ? (
                <div className="comment-input">
                  <div className="comment-input__avatar">
                    {user.avatar ? (
                      <SmartImage src={user.avatar} alt={user.name} width={40} height={40} />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="comment-input__field">
                    <textarea
                      ref={newCommentRef}
                      className="comment-input__textarea"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onFocus={() => setInputFocused(true)}
                      placeholder="댓글 추가..."
                      rows={1}
                    />
                    <div className="comment-input__underline" />
                    {inputFocused && (
                      <div className="comment-input__actions">
                        <button
                          type="button"
                          className="comment-input__cancel"
                          onClick={handleCancelNew}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          className="comment-input__submit"
                          disabled={!newComment.trim() || submitting}
                          onClick={handleSubmitComment}
                        >
                          {submitting ? '게시 중...' : '댓글'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="comment-login-prompt">
                  <p>댓글을 남기려면 로그인이 필요합니다.</p>
                  <button className="comment-login-prompt__btn" onClick={onLoginRequest}>
                    로그인하기
                  </button>
                </div>
              )}

              {/* 댓글 목록 */}
              <div className="comments-list">
                {loading ? (
                  <p className="comments-list__loading">댓글을 불러오는 중...</p>
                ) : comments.length === 0 ? (
                  <p className="comments-list__empty">아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="comment-item">
                      <div className="comment-item__avatar">
                        {c.user_avatar ? (
                          <SmartImage src={c.user_avatar} alt={c.user_name} width={40} height={40} />
                        ) : (
                          c.user_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="comment-item__body">
                        <div className="comment-item__meta">
                          <span className="comment-item__author">{c.user_name}</span>
                          <span className="comment-item__date">
                            {timeAgo(c.created_at)}
                            {c.updated_at !== c.created_at && ' (수정됨)'}
                          </span>
                        </div>

                        {editingId === c.id ? (
                          /* 수정 모드 */
                          <div className="comment-edit">
                            <textarea
                              ref={editRef}
                              className="comment-edit__textarea"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={2}
                            />
                            <div className="comment-edit__underline" />
                            <div className="comment-edit__actions">
                              <button className="comment-edit__cancel" onClick={handleCancelEdit}>
                                취소
                              </button>
                              <button
                                className="comment-edit__save"
                                disabled={!editText.trim()}
                                onClick={() => handleSaveEdit(c.id)}
                              >
                                저장
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* 보기 모드 */
                          <>
                            <p className="comment-item__text">{c.text}</p>
                            {user && (c.user_email === user.email || user.email === ADMIN_EMAIL) && (
                              <div className="comment-item__actions">
                                {c.user_email === user.email && (
                                  <button onClick={() => handleStartEdit(c)}>수정</button>
                                )}
                                <button onClick={() => handleDeleteComment(c.id)}>삭제</button>
                              </div>
                            )}
                          </>
                        )}
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
