'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { timeAgo } from '../../lib/format';
import { blockedLanguageMessage } from '../../lib/blockedLanguage';
import { useAuth } from '../../providers/AuthProvider';

// 의견과 댓글이 함께 쓰는 부품. 표 구조와 권한은 supabase/migrations/20261104_game_post_comments.sql 에 있다.

export const MAX_LENGTH = 1000; // 마이그레이션의 check 와 같게

// 고정한 것을 먼저, 고정끼리는 최근에 고정한 순서로 놓는다. 나머지 순서는 그대로 둔다.
const pinTime = (row) => (row.pinned_at ? new Date(row.pinned_at).getTime() : 0);
export const pinnedFirst = (rows) => [...rows].sort((a, b) => pinTime(b) - pinTime(a));

export function writeErrorMessage(error) {
  console.error('game board write error:', error);
  const message = error.message || '';
  if (message.includes('too_many_posts')) {
    return '글을 너무 빠르게 올리고 있어요. 10분쯤 뒤에 다시 올려 주세요.';
  }
  if (message.includes('too_many_comments')) {
    return '댓글을 너무 빠르게 올리고 있어요. 10분쯤 뒤에 다시 올려 주세요.';
  }
  const blocked = blockedLanguageMessage(error);
  if (blocked) return blocked;
  // 쓰는 사이에 의견이나 댓글이 지워졌을 때
  if (message.includes('invalid_parent') || error.code === '23503') {
    return '답하려던 글이 지워져서 올리지 못했어요. 새로고침해 주세요.';
  }
  return '저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.';
}

// 의견 수정, 댓글 쓰기, 답글 쓰기가 함께 쓰는 입력칸. onSave 는 실패하면 오류를 돌려준다.
export function BodyForm({ initial = '', rows = 2, label, placeholder, submitLabel, busyLabel, autoFocus, onSave, onCancel }) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fieldRef = useRef(null);

  useEffect(() => {
    if (!autoFocus) return;
    fieldRef.current.focus();
    fieldRef.current.setSelectionRange(initial.length, initial.length);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError('');
    const failure = await onSave(body);
    setBusy(false);
    if (failure) {
      setError(writeErrorMessage(failure));
      return;
    }
    setText('');
  };

  return (
    <form className="board-edit" onSubmit={handleSubmit}>
      <textarea
        ref={fieldRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX_LENGTH}
        rows={rows}
        placeholder={placeholder}
        aria-label={label}
      />
      {error && (
        <p className="board-error" role="alert">
          {error}
        </p>
      )}
      <div className="board-edit__foot">
        <span className="board-form__count">
          {text.length} / {MAX_LENGTH}
        </span>
        {onCancel && (
          <button type="button" className="btn btn--sm btn--outline" onClick={onCancel}>
            취소
          </button>
        )}
        <button type="submit" className="btn btn--sm" disabled={!text.trim() || busy}>
          {busy ? busyLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

// 작성자, 시각, 수정, 삭제, 고정, 본문까지 의견과 댓글에 공통인 부분. children 은 수정하는 동안 숨긴다.
export function BoardItem({
  item,
  table,
  columns,
  pinFunction,
  label,
  deleteNotice,
  canEdit,
  canDelete,
  canPin,
  meta,
  bodyClassName,
  onUpdated,
  onDeleted,
  children,
}) {
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const startEdit = () => {
    setError('');
    setEditing(true);
  };

  const handleSave = async (body) => {
    const { data, error: updateError } = await supabase
      .from(table)
      .update({ body })
      .eq('id', item.id)
      .select(columns)
      .single();
    if (updateError) return updateError;
    setEditing(false);
    onUpdated(data);
    return null;
  };

  const handleDelete = async () => {
    const question = `이 ${label}을 삭제할까요?${deleteNotice ? `\n${deleteNotice}` : ''}`;
    if (busy || !window.confirm(question)) return;
    setBusy(true);
    setError('');
    // 권한이 없으면 오류 없이 0건만 지워지므로, 지워진 행을 돌려받아 확인한다
    const { data, error: deleteError } = await supabase.from(table).delete().eq('id', item.id).select('id');
    setBusy(false);
    if (deleteError || data.length === 0) {
      setError(writeErrorMessage(deleteError || { message: 'not_deleted' }));
      return;
    }
    onDeleted(item.id);
  };

  const handlePin = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    const { data, error: pinError } = await supabase.rpc(pinFunction, { target_id: item.id, pinned: !item.pinned_at });
    setBusy(false);
    if (pinError) {
      setError(writeErrorMessage(pinError));
      return;
    }
    onUpdated({ ...item, pinned_at: data });
  };

  return (
    <>
      <div className="board-post__meta">
        {item.pinned_at && <span className="board-pin">고정됨</span>}
        <span className="board-post__author">{item.author_name}</span>
        <time className="board-post__date" dateTime={item.created_at}>
          {timeAgo(item.created_at)}
          {item.updated_at && ' (수정됨)'}
        </time>
        {/* 숨김 금칙어에 걸린 글. 쓴 사람에게는 표시하지 않고 관리자에게만 걸린 말과 함께 알린다 */}
        {isAdmin && item.hidden_word && (
          <span className="board-hidden" title={`걸린 말: ${item.hidden_word}`}>(금칙어 포함된 {label})</span>
        )}
        {meta}
        {!editing && (canEdit || canDelete || canPin) && (
          <span className="board-post__actions">
            {canPin && (
              <button type="button" onClick={handlePin} disabled={busy}>
                {item.pinned_at ? '고정 해제' : '고정'}
              </button>
            )}
            {canEdit && (
              <button type="button" onClick={startEdit}>
                수정
              </button>
            )}
            {canDelete && (
              <button type="button" onClick={handleDelete} disabled={busy}>
                삭제
              </button>
            )}
          </span>
        )}
      </div>

      {editing ? (
        <BodyForm
          initial={item.body}
          rows={3}
          label={`${label} 수정`}
          submitLabel="저장"
          busyLabel="저장 중..."
          autoFocus
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <p className={bodyClassName}>{item.body}</p>
      )}

      {error && (
        <p className="board-error" role="alert">
          {error}
        </p>
      )}

      {!editing && children}
    </>
  );
}
