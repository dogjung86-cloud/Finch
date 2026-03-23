import { useState, useEffect } from 'react';

export default function ArticlePage({ article, onBack, user, onLoginRequest }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

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
      <div className="article-page__container">
        {/* 뒤로 가기 */}
        <button className="article-page__back" onClick={onBack}>
          ← 목록으로
        </button>

        {/* 카테고리 */}
        <span className="article-page__category">{article.category}</span>

        {/* 제목 */}
        <h1 className="article-page__title">{article.title}</h1>

        {/* 메타 정보 */}
        <div className="article-page__meta">
          <span className="article-page__author">{article.author}</span>
          <span className="article-page__date">{article.date || (article.created_at ? new Date(article.created_at).toLocaleDateString('ko-KR') : '')}</span>
        </div>

        {/* 히어로 이미지 */}
        <div className="article-page__hero-img">
          <img src={article.thumbnail} alt={article.title} />
        </div>

        {/* 본문 */}
        <div className="article-page__body">
          {(() => {
            const content = article.fullContent || article.full_content || '';
            // HTML 태그가 포함되어 있으면 HTML로 렌더링 (리치 에디터)
            if (content.includes('<')) {
              return <div dangerouslySetInnerHTML={{ __html: content }} />;
            }
            // 평문이면 줄바꿈으로 나눠서 렌더링
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
      </div>
    </div>
  );
}
