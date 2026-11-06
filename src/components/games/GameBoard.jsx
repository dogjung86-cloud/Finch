'use client';

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { BOARD_TOPICS } from '../../data/games';
import { useAuth } from '../../providers/AuthProvider';
import BoardComments, { fetchComments } from './BoardComments';
import { BoardItem, MAX_LENGTH, pinnedFirst, writeErrorMessage } from './boardParts';

// Games 탭 의견 게시판. 표 구조와 권한은 supabase/migrations/20261102_game_posts.sql 에 있다.
// 작성자 id 와 이름은 DB 가 로그인 토큰에서 채우므로 화면에서 보내지 않는다.

const PAGE_SIZE = 20;
// hidden_word: 숨김 금칙어에 걸린 부분. 이런 의견은 DB 가 쓴 사람과 관리자에게만 돌려준다 (20261106_board_hidden_words.sql)
const COLUMNS = 'id, game_slug, user_id, author_name, body, hidden_word, pinned_at, created_at, updated_at';
const ALL_TOPICS = 'all';
const TOPIC_LABELS = Object.fromEntries(BOARD_TOPICS.map((t) => [t.id, t.label]));

// Supabase 가 없는 로컬 개발 환경과 미리보기 사본에서 화면을 확인하기 위한 샘플. 배포에서는 쓰지 않는다.
const isPreview = process.env.NODE_ENV === 'development' && !isSupabaseConfigured;
const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();
const SAMPLE_POSTS = isPreview
  ? [
      {
        id: 'sample-1',
        game_slug: 'fly-darwin',
        author_name: '샘플 작성자 1',
        body: '보스전이 생각보다 어려운데 재밌어요. 분노 모드에 들어가면 손에 땀이 납니다.',
        pinned_at: hoursAgo(1),
        created_at: hoursAgo(30),
        updated_at: null,
      },
      {
        id: 'sample-2',
        game_slug: 'fly-darwin',
        author_name: '샘플 작성자 2',
        body: '핀치새까지 진화하는 데 한참 걸렸어요.\n모바일에서 드래그 감도를 조절할 수 있으면 좋겠습니다.',
        pinned_at: null,
        created_at: hoursAgo(26),
        updated_at: hoursAgo(20),
      },
      {
        id: 'sample-3',
        game_slug: 'etc',
        author_name: '샘플 작성자 3',
        body: '다음 게임은 공룡 시대가 배경이면 좋겠어요!',
        pinned_at: null,
        created_at: hoursAgo(80),
        updated_at: null,
      },
    ]
  : [];
const SAMPLE_COMMENTS = isPreview
  ? [
      {
        id: 'sample-c1',
        post_id: 'sample-1',
        parent_id: null,
        author_name: '샘플 작성자 2',
        body: '분노 모드에서는 화면 가장자리로 피하면 조금 쉬워져요.',
        pinned_at: hoursAgo(2),
        created_at: hoursAgo(20),
        updated_at: null,
      },
      {
        id: 'sample-c2',
        post_id: 'sample-1',
        parent_id: 'sample-c1',
        author_name: '샘플 작성자 1',
        body: '오, 해 볼게요. 고마워요!',
        pinned_at: null,
        created_at: hoursAgo(18),
        updated_at: null,
      },
      {
        id: 'sample-c3',
        post_id: 'sample-1',
        parent_id: null,
        author_name: '샘플 작성자 3',
        body: '저도 여기서 한참 막혔어요.',
        pinned_at: null,
        created_at: hoursAgo(10),
        updated_at: null,
      },
      {
        id: 'sample-c4',
        post_id: 'sample-2',
        parent_id: null,
        author_name: '샘플 작성자 3',
        body: '드래그 감도 조절은 저도 필요해요.',
        pinned_at: null,
        created_at: hoursAgo(12),
        updated_at: null,
      },
    ]
  : [];

async function fetchPosts(topic, offset) {
  if (!isSupabaseConfigured) {
    const rows = SAMPLE_POSTS.filter((p) => topic === ALL_TOPICS || p.game_slug === topic);
    return { rows, total: rows.length, failed: false };
  }
  let query = supabase
    .from('game_posts')
    .select(COLUMNS, { count: 'exact' })
    .order('pinned_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (topic !== ALL_TOPICS) query = query.eq('game_slug', topic);
  const { data, count, error } = await query;
  if (error) {
    console.error('game_posts load error:', error);
    return { rows: [], total: 0, failed: true };
  }
  return { rows: data, total: count ?? data.length, failed: false };
}

// 목록의 댓글 수를 바로 보여 주고 고정 댓글을 펼쳐 두려고 의견과 댓글을 함께 받는다
async function fetchPage(topic, offset) {
  const page = await fetchPosts(topic, offset);
  if (!isSupabaseConfigured) return { ...page, comments: SAMPLE_COMMENTS, commentsFailed: false };
  const { rows, failed } = await fetchComments(page.rows.map((p) => p.id));
  return { ...page, comments: rows, commentsFailed: failed };
}

function Composer({ userName, topic, onPosted, hidden }) {
  const [draft, setDraft] = useState('');
  const [draftTopic, setDraftTopic] = useState(BOARD_TOPICS[0].id);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // 특정 주제 탭을 보고 있으면 그 주제로 쓰는 것으로 맞춰 둔다
  useEffect(() => {
    if (topic !== ALL_TOPICS) setDraftTopic(topic);
  }, [topic]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    const { data, error: insertError } = await supabase
      .from('game_posts')
      .insert([{ game_slug: draftTopic, body }])
      .select(COLUMNS)
      .single();
    setSending(false);
    if (insertError) {
      setError(writeErrorMessage(insertError));
      return;
    }
    setDraft('');
    onPosted(data);
  };

  return (
    <form className="board-form" onSubmit={handleSubmit} hidden={hidden} data-board-composer aria-label="의견 쓰기">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={MAX_LENGTH}
        rows={4}
        placeholder="게임을 해 보고 느낀 점을 적어 주세요."
        aria-label="의견 내용"
      />
      {error && (
        <p className="board-error" role="alert">
          {error}
        </p>
      )}
      <div className="board-form__foot">
        <select value={draftTopic} onChange={(e) => setDraftTopic(e.target.value)} aria-label="어떤 게임에 대한 의견인가요">
          {BOARD_TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="board-form__note">
          <b>{userName}</b> 이름으로 올라갑니다.
        </p>
        <span className="board-form__count">
          {draft.length} / {MAX_LENGTH}
        </span>
        <button type="submit" className="btn btn--sm" disabled={!draft.trim() || sending}>
          {sending ? '올리는 중...' : '올리기'}
        </button>
      </div>
    </form>
  );
}

export default function GameBoard() {
  const { user, isAdmin, setShowLoginModal } = useAuth();
  const [topic, setTopic] = useState(ALL_TOPICS);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentsFailed, setCommentsFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let stale = false;
    setLoading(true);
    fetchPage(topic, 0).then((page) => {
      if (stale) return;
      setPosts(page.rows);
      setTotal(page.total);
      setComments(page.comments);
      setCommentsFailed(page.commentsFailed);
      setFailed(page.failed);
      setLoading(false);
    });
    return () => {
      stale = true;
    };
  }, [topic]);

  const handleMore = async () => {
    setLoadingMore(true);
    const page = await fetchPage(topic, posts.length);
    setLoadingMore(false);
    if (page.failed) return;
    // 그사이 새 글이 올라오면 같은 글이 다시 올 수 있어 걸러 낸다
    setPosts((prev) => [...prev, ...page.rows.filter((r) => !prev.some((p) => p.id === r.id))]);
    setComments((prev) => [...prev, ...page.comments.filter((r) => !prev.some((c) => c.id === r.id))]);
    setCommentsFailed((prev) => prev || page.commentsFailed);
    setTotal(page.total);
  };

  const handlePosted = (post) => {
    if (topic !== ALL_TOPICS && topic !== post.game_slug) {
      // 다른 주제 탭을 보고 있었으면 방금 쓴 글이 보이는 탭으로 옮긴다
      setTopic(post.game_slug);
      return;
    }
    setPosts((prev) => [post, ...prev]);
    setTotal((n) => n + 1);
  };

  const handleUpdated = (post) => {
    setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
  };

  const handleDeleted = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setComments((prev) => prev.filter((c) => c.post_id !== id));
    setTotal((n) => Math.max(0, n - 1));
  };

  const handleCommentAdded = (comment) => {
    setComments((prev) => [...prev, comment]);
  };

  const handleCommentUpdated = (comment) => {
    setComments((prev) => prev.map((c) => (c.id === comment.id ? comment : c)));
  };

  // 댓글을 지우면 그 대댓글도 DB 에서 함께 지워진다
  const handleCommentDeleted = (id) => {
    setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
  };

  const isMine = (post) => Boolean(user) && user.id === post.user_id;

  const handleLogin = () => {
    // 로그인을 마치면 게시판으로 돌아오도록 주소에 표시해 둔다 (LoginModal 이 이 주소를 기억한다)
    window.history.replaceState(window.history.state, '', '#board');
    setShowLoginModal(true);
  };

  return (
    <div className="board">
      {user ? (
        <Composer userName={user.name} topic={topic} onPosted={handlePosted} />
      ) : (
        <>
          <div className="board-login">
            <p>글을 남기려면 로그인해 주세요. 글은 구글 계정 이름으로 올라가요.</p>
            <button type="button" className="btn btn--sm" onClick={handleLogin}>
              로그인하기
            </button>
          </div>
          {isPreview && <Composer userName="미리보기" topic={topic} onPosted={handlePosted} hidden />}
        </>
      )}

      <div className="tabs board-tabs" role="group" aria-label="주제">
        {[{ id: ALL_TOPICS, label: '전체' }, ...BOARD_TOPICS].map((t) => (
          <button
            key={t.id}
            type="button"
            className="tab"
            data-topic={t.id}
            aria-pressed={topic === t.id}
            onClick={() => setTopic(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="board-status">의견을 불러오는 중...</p>
      ) : failed ? (
        <p className="board-status" role="alert">
          의견을 불러오지 못했어요. 잠시 뒤에 다시 들어와 주세요.
        </p>
      ) : posts.length === 0 ? (
        <p className="empty board-empty">아직 올라온 의견이 없어요. 첫 의견을 남겨 주세요.</p>
      ) : (
        <>
          {commentsFailed && (
            <p className="board-error board-error--list" role="alert">
              댓글을 불러오지 못했어요. 잠시 뒤에 다시 들어와 주세요.
            </p>
          )}
          <ul className="board-list">
            {pinnedFirst(posts).map((post) => {
              const postComments = comments.filter((c) => c.post_id === post.id);
              return (
                <li key={post.id} className="board-post" data-topic={post.game_slug}>
                  <BoardItem
                    item={post}
                    table="game_posts"
                    columns={COLUMNS}
                    pinFunction="set_game_post_pinned"
                    label="의견"
                    deleteNotice={postComments.length > 0 ? `댓글 ${postComments.length}개도 함께 지워집니다.` : ''}
                    canEdit={isMine(post)}
                    canDelete={isMine(post) || isAdmin}
                    canPin={isAdmin}
                    meta={TOPIC_LABELS[post.game_slug] && <span className="board-post__topic">{TOPIC_LABELS[post.game_slug]}</span>}
                    bodyClassName="board-post__body"
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                  />
                  {!commentsFailed && (
                    <BoardComments
                      postId={post.id}
                      comments={postComments}
                      user={user}
                      isAdmin={isAdmin}
                      onLogin={handleLogin}
                      onAdded={handleCommentAdded}
                      onUpdated={handleCommentUpdated}
                      onDeleted={handleCommentDeleted}
                    />
                  )}
                </li>
              );
            })}
          </ul>
          {posts.length < total && (
            <div className="board-more">
              <button type="button" className="btn btn--outline" onClick={handleMore} disabled={loadingMore}>
                {loadingMore ? '불러오는 중...' : '더 보기'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
