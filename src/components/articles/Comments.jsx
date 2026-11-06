'use client';

import { useState, useEffect, useRef } from 'react';
import SmartImage from '../SmartImage';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ADMIN_EMAIL } from '../../lib/constants';
import { blockedLanguageMessage } from '../../lib/blockedLanguage';

// 칼럼 기사와 일상 글이 함께 쓰는 댓글 창 (YouTube 스타일).
// 표 구조와 권한은 supabase/migrations/20261103_comments_drop_email.sql, 20261106_comments_history.sql,
// 20261106_comments_replies.sql 에 있다.
// 댓글 한 줄은 칼럼 기사(article_id)나 일상 글(history_id) 가운데 하나에 달린다.
// 대댓글은 게임 의견 댓글처럼 한 단계까지이고, 대댓글에 답하면 같은 줄에 이름을 붙여 이어 쓴다.
// 작성자 id, 이름, 사진과 수정 시각은 DB 가 채우므로 화면에서 보내지 않는다.
const TARGET_COLUMN = { column: 'article_id', history: 'history_id' }; // 키는 src/lib/series.js 의 시리즈 id
// hidden_word: 숨김 금칙어에 걸린 부분. 이런 댓글은 DB 가 쓴 사람과 관리자에게만 돌려준다 (20261106_board_hidden_words.sql)
const COMMENT_COLUMNS = 'id, parent_id, user_id, user_name, user_avatar, text, hidden_word, created_at, updated_at';
const COMMENT_MAX_LENGTH = 1000; // 20261103_comments_limits.sql 의 check 와 같게
const COMMENT_TOO_LONG = `댓글은 ${COMMENT_MAX_LENGTH}자까지 쓸 수 있어요.`;
const NEW_COMMENT = 'new'; // 안내 문구를 어디에 보여 줄지 가리키는 값. 수정과 삭제는 댓글 id 를 쓴다
const replyTarget = (topId) => `reply:${topId}`; // 답글 입력칸의 안내 문구 자리

function commentErrorMessage(error) {
  console.error('comments write error:', error);
  if (error.message?.includes('too_many_comments')) {
    return '댓글을 너무 빠르게 올리고 있어요. 10분쯤 뒤에 다시 올려 주세요.';
  }
  if (error.message?.includes('comments_text_length')) return COMMENT_TOO_LONG;
  const blocked = blockedLanguageMessage(error);
  if (blocked) return blocked;
  // 답글을 쓰는 사이에 원래 댓글이 지워졌을 때
  if (error.message?.includes('invalid_parent') || error.code === '23503') {
    return '답하려던 댓글이 지워져서 올리지 못했어요. 새로고침해 주세요.';
  }
  return '저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.';
}

// maxLength 에 닿으면 브라우저가 말없이 입력을 막으므로 글자 수와 함께 알려 준다
function CommentLength({ length }) {
  return (
    <span className="comment-length">
      {length >= COMMENT_MAX_LENGTH && <span className="comment-length__full" role="alert">{COMMENT_TOO_LONG}</span>}
      {length} / {COMMENT_MAX_LENGTH}
    </span>
  );
}

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

const byOldest = (a, b) => new Date(a.created_at) - new Date(b.created_at);

// series: 'column' 이면 칼럼 기사, 'history' 면 일상 글. postId: 그 글의 id
export default function Comments({ series, postId, user, onLoginRequest }) {
  const targetColumn = TARGET_COLUMN[series];
  const isAdmin = Boolean(user) && user.email === ADMIN_EMAIL;
  const [comments, setComments] = useState([]); // 맨 위 댓글과 대댓글을 함께, 새 글부터
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [replyTo, setReplyTo] = useState(null); // 답글을 다는 맨 위 댓글의 id
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [commentError, setCommentError] = useState(null); // { target, message }
  const editRef = useRef(null);
  const newCommentRef = useRef(null);
  const replyRef = useRef(null);

  // Supabase에서 댓글 로드
  const loadComments = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('comments')
      .select(COMMENT_COLUMNS)
      .eq(targetColumn, postId)
      .order('created_at', { ascending: false });
    if (error) console.error('comments load error:', error);
    if (!error && data) setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    if (postId && targetColumn) loadComments();
  }, [postId, targetColumn]);

  // 댓글 작성
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    setCommentError(null);

    const { error } = await supabase.from('comments').insert([{
      [targetColumn]: postId,
      text: newComment.trim(),
    }]);

    if (error) {
      setCommentError({ target: NEW_COMMENT, message: commentErrorMessage(error) });
    } else {
      setNewComment('');
      setInputFocused(false);
      await loadComments();
    }
    setSubmitting(false);
  };

  // 답글: 맨 위 댓글에 달고, 대댓글에 답할 때는 그 사람 이름을 붙여 같은 줄에 이어 쓴다
  const handleStartReply = (topId, mention) => {
    if (!user) {
      onLoginRequest();
      return;
    }
    setCommentError(null);
    setReplyTo(topId);
    setReplyText(mention);
    setTimeout(() => {
      const box = replyRef.current;
      if (!box) return;
      box.focus();
      box.setSelectionRange(box.value.length, box.value.length);
    }, 50);
  };

  const handleCancelReply = () => {
    setCommentError(null);
    setReplyTo(null);
    setReplyText('');
  };

  const handleSubmitReply = async (topId) => {
    if (!replyText.trim() || replySubmitting) return;
    setReplySubmitting(true);
    setCommentError(null);

    const { error } = await supabase.from('comments').insert([{
      [targetColumn]: postId,
      parent_id: topId,
      text: replyText.trim(),
    }]);

    if (error) {
      setCommentError({ target: replyTarget(topId), message: commentErrorMessage(error) });
    } else {
      setReplyTo(null);
      setReplyText('');
      await loadComments();
    }
    setReplySubmitting(false);
  };

  // 댓글 수정
  const handleStartEdit = (comment) => {
    setCommentError(null);
    setEditingId(comment.id);
    setEditText(comment.text);
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const handleCancelEdit = () => {
    setCommentError(null);
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) return;
    setCommentError(null);
    // 권한이 없으면 오류 없이 0건만 바뀌므로, 바뀐 행을 돌려받아 확인한다
    const { data, error } = await supabase
      .from('comments')
      .update({ text: editText.trim() })
      .eq('id', commentId)
      .select('id');

    if (error || data.length === 0) {
      setCommentError({ target: commentId, message: commentErrorMessage(error || { message: 'not_updated' }) });
      return;
    }
    setEditingId(null);
    setEditText('');
    await loadComments();
  };

  // 댓글 삭제. 맨 위 댓글을 지우면 DB 가 그 대댓글도 함께 지운다
  const handleDeleteComment = async (commentId, replyCount = 0) => {
    if (replyCount > 0 && !window.confirm(`이 댓글을 삭제할까요?\n답글 ${replyCount}개도 함께 지워집니다.`)) return;
    setCommentError(null);
    // 권한이 없으면 오류 없이 0건만 지워지므로, 지워진 행을 돌려받아 확인한다
    const { data, error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .select('id');
    if (error || data.length === 0) {
      console.error('comments delete error:', error || 'not_deleted');
      setCommentError({ target: commentId, message: '삭제하지 못했어요. 잠시 뒤에 다시 시도해 주세요.' });
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId));
    if (replyTo === commentId) handleCancelReply();
  };

  // 입력 취소
  const handleCancelNew = () => {
    setCommentError(null);
    setNewComment('');
    setInputFocused(false);
    newCommentRef.current?.blur();
  };

  // 댓글 한 줄. topId 는 이 댓글이 속한 맨 위 댓글의 id (맨 위 댓글이면 자기 id)
  const renderComment = (c, { topId, replyCount = 0 }) => {
    const isReply = Boolean(c.parent_id);
    const avatarSize = isReply ? 28 : 40;
    const canEdit = user && c.user_id === user.id;
    const canDelete = user && (c.user_id === user.id || isAdmin);
    return (
      <div key={c.id} className={`comment-item${isReply ? ' comment-item--reply' : ''}`}>
        <div className="comment-item__avatar">
          {c.user_avatar ? (
            <SmartImage src={c.user_avatar} alt={c.user_name} width={avatarSize} height={avatarSize} />
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
            {/* 쓴 사람에게는 표시하지 않는다. 관리자에게만 걸린 말과 함께 알린다 */}
            {isAdmin && c.hidden_word && (
              <span className="comment-item__hidden" title={`걸린 말: ${c.hidden_word}`}>(금칙어 포함된 댓글)</span>
            )}
          </div>

          {editingId === c.id ? (
            /* 수정 모드 */
            <div className="comment-edit">
              <textarea
                ref={editRef}
                className="comment-edit__textarea"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                maxLength={COMMENT_MAX_LENGTH}
                rows={2}
              />
              <div className="comment-edit__underline" />
              <div className="comment-edit__actions">
                <CommentLength length={editText.length} />
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
              <div className="comment-item__actions">
                <button onClick={() => handleStartReply(topId, isReply ? `@${c.user_name} ` : '')}>답글</button>
                {canEdit && (
                  <button onClick={() => handleStartEdit(c)}>수정</button>
                )}
                {canDelete && (
                  <button onClick={() => handleDeleteComment(c.id, replyCount)}>삭제</button>
                )}
              </div>
            </>
          )}

          {commentError?.target === c.id && (
            <p className="comment-error" role="alert">
              {commentError.message}
            </p>
          )}
        </div>
      </div>
    );
  };

  const tops = comments.filter((c) => !c.parent_id);

  return (
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
              maxLength={COMMENT_MAX_LENGTH}
              placeholder="댓글 추가..."
              rows={1}
            />
            <div className="comment-input__underline" />
            {commentError?.target === NEW_COMMENT && (
              <p className="comment-error" role="alert">
                {commentError.message}
              </p>
            )}
            {inputFocused && (
              <div className="comment-input__actions">
                <CommentLength length={newComment.length} />
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

      {/* 댓글 목록: 맨 위 댓글은 새 글부터, 그 아래 대댓글은 오래된 글부터 */}
      <div className="comments-list">
        {loading ? (
          <p className="comments-list__loading">댓글을 불러오는 중...</p>
        ) : tops.length === 0 ? (
          <p className="comments-list__empty">아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
        ) : (
          tops.map((top) => {
            const replies = comments.filter((c) => c.parent_id === top.id).sort(byOldest);
            const replying = replyTo === top.id;
            return (
              <div key={top.id} className="comment-thread">
                {renderComment(top, { topId: top.id, replyCount: replies.length })}
                {(replies.length > 0 || replying) && (
                  <div className="comment-replies">
                    {replies.map((reply) => renderComment(reply, { topId: top.id }))}
                    {replying && (
                      <div className="comment-reply-form">
                        <textarea
                          ref={replyRef}
                          className="comment-edit__textarea"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          maxLength={COMMENT_MAX_LENGTH}
                          placeholder="답글 추가..."
                          aria-label="답글 쓰기"
                          rows={1}
                        />
                        <div className="comment-edit__underline" />
                        {commentError?.target === replyTarget(top.id) && (
                          <p className="comment-error" role="alert">
                            {commentError.message}
                          </p>
                        )}
                        <div className="comment-edit__actions">
                          <CommentLength length={replyText.length} />
                          <button className="comment-edit__cancel" onClick={handleCancelReply}>
                            취소
                          </button>
                          <button
                            className="comment-edit__save"
                            disabled={!replyText.trim() || replySubmitting}
                            onClick={() => handleSubmitReply(top.id)}
                          >
                            {replySubmitting ? '게시 중...' : '답글'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
