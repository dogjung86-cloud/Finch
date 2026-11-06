'use client';

import { useId, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BoardItem, BodyForm, pinnedFirst } from './boardParts';

// 의견에 다는 댓글과 대댓글. 표 구조와 권한은 supabase/migrations/20261104_game_post_comments.sql 에 있다.
// 대댓글은 한 단계까지이고, 대댓글에 답하면 같은 줄에 이름을 붙여 이어 쓴다.
// 작성자 id 와 이름은 DB 가 로그인 토큰에서 채우므로 화면에서 보내지 않는다.

const COLUMNS = 'id, post_id, parent_id, user_id, author_name, body, hidden_word, pinned_at, created_at, updated_at';

export async function fetchComments(postIds) {
  if (postIds.length === 0) return { rows: [], failed: false };
  const { data, error } = await supabase
    .from('game_post_comments')
    .select(COLUMNS)
    .in('post_id', postIds)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('game_post_comments load error:', error);
    return { rows: [], failed: true };
  }
  return { rows: data, failed: false };
}

function Comment({ comment, canEdit, canDelete, canPin, replyCount = 0, onReply, onUpdated, onDeleted }) {
  return (
    <div className="board-comment">
      <BoardItem
        item={comment}
        table="game_post_comments"
        columns={COLUMNS}
        pinFunction="set_game_post_comment_pinned"
        label="댓글"
        deleteNotice={replyCount > 0 ? `답글 ${replyCount}개도 함께 지워집니다.` : ''}
        canEdit={canEdit}
        canDelete={canDelete}
        canPin={canPin}
        bodyClassName="board-comment__body"
        onUpdated={onUpdated}
        onDeleted={onDeleted}
      >
        <button type="button" className="board-comment__reply" onClick={onReply}>
          답글
        </button>
      </BoardItem>
    </div>
  );
}

export default function BoardComments({ postId, comments, user, isAdmin, onLogin, onAdded, onUpdated, onDeleted }) {
  // 고정 댓글이 있는 의견은 처음부터 펼쳐 둔다
  const [open, setOpen] = useState(() => comments.some((c) => c.pinned_at));
  const [replyTo, setReplyTo] = useState(null); // { parentId, mention }
  const bodyId = useId();

  const add = async (body, parentId) => {
    const { data, error } = await supabase
      .from('game_post_comments')
      .insert([{ post_id: postId, parent_id: parentId, body }])
      .select(COLUMNS)
      .single();
    if (error) return error;
    onAdded(data);
    return null;
  };

  const startReply = (parentId, mention) => {
    if (user) setReplyTo({ parentId, mention });
    else onLogin();
  };

  const isMine = (c) => Boolean(user) && user.id === c.user_id;
  const tops = pinnedFirst(comments.filter((c) => !c.parent_id));

  return (
    <div className="board-thread">
      <button
        type="button"
        className="board-thread__toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
      >
        {comments.length > 0 ? `댓글 ${comments.length}` : '댓글 달기'}
      </button>

      <div className="board-thread__body" id={bodyId} hidden={!open}>
        {tops.length > 0 && (
          <ul className="board-comments">
            {tops.map((top) => {
              const replies = comments.filter((c) => c.parent_id === top.id);
              const replying = replyTo?.parentId === top.id;
              return (
                <li key={top.id}>
                  <Comment
                    comment={top}
                    canEdit={isMine(top)}
                    canDelete={isMine(top) || isAdmin}
                    canPin={isAdmin}
                    replyCount={replies.length}
                    onReply={() => startReply(top.id, '')}
                    onUpdated={onUpdated}
                    onDeleted={onDeleted}
                  />
                  {(replies.length > 0 || replying) && (
                    <ul className="board-replies">
                      {replies.map((reply) => (
                        <li key={reply.id}>
                          <Comment
                            comment={reply}
                            canEdit={isMine(reply)}
                            canDelete={isMine(reply) || isAdmin}
                            onReply={() => startReply(top.id, `@${reply.author_name} `)}
                            onUpdated={onUpdated}
                            onDeleted={onDeleted}
                          />
                        </li>
                      ))}
                      {replying && (
                        <li>
                          <BodyForm
                            key={replyTo.mention}
                            initial={replyTo.mention}
                            label="답글 쓰기"
                            placeholder="답글을 적어 주세요."
                            submitLabel="올리기"
                            busyLabel="올리는 중..."
                            autoFocus
                            onSave={async (body) => {
                              const failure = await add(body, top.id);
                              if (!failure) setReplyTo(null);
                              return failure;
                            }}
                            onCancel={() => setReplyTo(null)}
                          />
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {user ? (
          <BodyForm
            label="댓글 쓰기"
            placeholder="댓글을 적어 주세요."
            submitLabel="올리기"
            busyLabel="올리는 중..."
            onSave={(body) => add(body, null)}
          />
        ) : (
          <p className="board-thread__login">
            댓글은 로그인하면 쓸 수 있어요.{' '}
            <button type="button" onClick={onLogin}>
              로그인하기
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
