'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SERIES } from '../lib/series';
import { BOARD_TOPICS } from '../data/games';

// 댓글은 칼럼 기사(article_id)나 일상 글(history_id) 가운데 하나에 달린다 (20261106_comments_history.sql)
const postOf = (c) => (c.history_id
  ? { id: c.history_id, href: `/history/${c.history_id}`, kind: SERIES.history.label }
  : { id: c.article_id, href: `/article/${c.article_id}`, kind: SERIES.column.label });

const uniqueIds = (rows, key) => [...new Set(rows.map((r) => r[key]).filter(Boolean))];
const topicLabel = (slug) => BOARD_TOPICS.find((t) => t.id === slug)?.label || slug;
const newestFirst = (a, b) => new Date(b.created_at) - new Date(a.created_at);

// 숨김 금칙어(20261106_board_hidden_words.sql)에 걸린 글은 쓴 사람과 관리자에게만 보이고, 걸린 부분이 hidden_word 에 남는다.
// '금칙어 댓글' 보기는 칼럼·일상 댓글과 게임 의견·댓글에서 걸린 글을 한곳에 모은다.
const COMMENT_COLUMNS = 'id, article_id, history_id, parent_id, user_name, text, hidden_word, created_at';
const GAME_POST_COLUMNS = 'id, game_slug, author_name, body, hidden_word, created_at';
const GAME_COMMENT_COLUMNS = 'id, post_id, parent_id, author_name, body, hidden_word, created_at';

const mutedStyle = { color: 'var(--text-muted)', fontSize: 13, marginRight: 6 };
const hiddenStyle = { color: '#d93025', fontSize: 12, fontWeight: 700, marginRight: 6 };

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function CommentsAdmin() {
  const [comments, setComments] = useState([]);
  const [gameItems, setGameItems] = useState([]); // 금칙어에 걸린 게임 의견과 댓글
  const [titleMap, setTitleMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [view, setView] = useState('all'); // 'all': 칼럼·일상 댓글 전체, 'hidden': 금칙어에 걸린 글만
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadComments();
  }, [period]);

  const loadComments = async () => {
    setLoading(true);

    const since = period === 'all'
      ? null
      : new Date(Date.now() - (period === '7d' ? 7 : 30) * 86400000).toISOString();
    const inPeriod = (q) => (since ? q.gte('created_at', since) : q);

    const [{ data, error }, gamePosts, gameComments] = await Promise.all([
      inPeriod(supabase.from('comments').select(COMMENT_COLUMNS)).order('created_at', { ascending: false }),
      inPeriod(supabase.from('game_posts').select(GAME_POST_COLUMNS).not('hidden_word', 'is', null))
        .order('created_at', { ascending: false }),
      inPeriod(supabase.from('game_post_comments').select(GAME_COMMENT_COLUMNS).not('hidden_word', 'is', null))
        .order('created_at', { ascending: false }),
    ]);
    if (error) {
      console.error('comments load error:', error);
      setComments([]);
      setGameItems([]);
      setLoading(false);
      return;
    }
    if (gamePosts.error) console.error('game_posts load error:', gamePosts.error);
    if (gameComments.error) console.error('game_post_comments load error:', gameComments.error);

    const rows = data || [];
    const articleIds = uniqueIds(rows, 'article_id');
    const historyIds = uniqueIds(rows, 'history_id');
    const [arts, hist] = await Promise.all([
      articleIds.length > 0 ? supabase.from('articles').select('id, title').in('id', articleIds) : { data: [] },
      historyIds.length > 0 ? supabase.from('history_science').select('id, title').in('id', historyIds) : { data: [] },
    ]);
    const map = {};
    [...(arts.data || []), ...(hist.data || [])].forEach((p) => { map[p.id] = p.title; });
    setTitleMap(map);

    setComments(rows);
    setGameItems([
      ...(gamePosts.data || []).map((p) => ({
        key: `game_posts:${p.id}`,
        table: 'game_posts',
        id: p.id,
        created_at: p.created_at,
        kind: '게임 의견',
        title: topicLabel(p.game_slug),
        href: '/games#board',
        author: p.author_name,
        text: p.body,
        word: p.hidden_word,
      })),
      ...(gameComments.data || []).map((c) => ({
        key: `game_post_comments:${c.id}`,
        table: 'game_post_comments',
        id: c.id,
        created_at: c.created_at,
        kind: '게임 댓글',
        title: '게임 의견 게시판',
        href: '/games#board',
        author: c.author_name,
        text: c.body,
        word: c.hidden_word,
        isReply: Boolean(c.parent_id),
      })),
    ]);
    setLoading(false);
  };

  const handleDelete = async (row) => {
    // 맨 위 댓글을 지우면 DB 가 그 답글도 함께 지운다 (20261106_comments_replies.sql). 게임 의견을 지우면 그 댓글도 지워진다
    const replyCount = row.table === 'comments' ? comments.filter((c) => c.parent_id === row.id).length : 0;
    const notice = replyCount > 0 ? `\n답글 ${replyCount}개도 함께 지워집니다.` : '';
    const what = row.table === 'game_posts' ? '의견' : '댓글';
    if (!confirm(`이 ${what}을 삭제하시겠습니까?${notice}`)) return;
    const { error } = await supabase.from(row.table).delete().eq('id', row.id);
    if (error) {
      alert('삭제 실패: ' + error.message);
      return;
    }
    if (row.table === 'comments') {
      setComments((prev) => prev.filter((c) => c.id !== row.id && c.parent_id !== row.id));
    } else if (row.table === 'game_posts') {
      loadComments();
    } else {
      setGameItems((prev) => prev.filter((g) => g.key !== row.key));
    }
  };

  const commentRows = comments.map((c) => {
    const post = postOf(c);
    return {
      key: `comments:${c.id}`,
      table: 'comments',
      id: c.id,
      created_at: c.created_at,
      kind: post.kind,
      title: titleMap[post.id] || `#${post.id}`,
      href: post.href,
      author: c.user_name,
      text: c.text,
      word: c.hidden_word,
      isReply: Boolean(c.parent_id),
    };
  });
  const hiddenRows = [...commentRows.filter((r) => r.word), ...gameItems].sort(newestFirst);
  const rows = view === 'hidden' ? hiddenRows : commentRows;

  const filtered = query.trim()
    ? rows.filter((r) => {
        const q = query.trim().toLowerCase();
        return (
          (r.text || '').toLowerCase().includes(q) ||
          (r.author || '').toLowerCase().includes(q)
        );
      })
    : rows;

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">댓글을 불러오는 중...</div>
      </div>
    );
  }

  const isHiddenView = view === 'hidden';

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">댓글 관리</h1>
        <div className="stats-period">
          {['7d', '30d', 'all'].map((p) => (
            <button
              key={p}
              className={`stats-period__btn ${period === p ? 'stats-period__btn--active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === '7d' ? '7일' : p === '30d' ? '30일' : '전체'}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-period" style={{ marginBottom: 16 }}>
        <button
          className={`stats-period__btn ${!isHiddenView ? 'stats-period__btn--active' : ''}`}
          onClick={() => setView('all')}
        >
          전체 댓글 {commentRows.length}
        </button>
        <button
          className={`stats-period__btn ${isHiddenView ? 'stats-period__btn--active' : ''}`}
          onClick={() => setView('hidden')}
        >
          금칙어 댓글 {hiddenRows.length}
        </button>
      </div>

      <div className="stats-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <h3 className="stats-section__title" style={{ margin: 0 }}>
            {isHiddenView ? '금칙어 댓글' : '댓글'} {filtered.length}개{query.trim() && ` (전체 ${rows.length}개 중)`}
          </h3>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="본문·작성자 검색"
            className="admin-form__input"
            style={{ maxWidth: 280, marginLeft: 'auto' }}
          />
        </div>
        {isHiddenView && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 12px' }}>
            칼럼·일상 댓글과 게임 의견·댓글 가운데 숨김 금칙어나 외부 링크에 걸린 글입니다. 쓴 사람과 관리자에게만 보입니다.
          </p>
        )}

        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '24px 0' }}>
            {rows.length > 0
              ? '검색 결과가 없습니다.'
              : isHiddenView
                ? '해당 기간에 금칙어에 걸린 글이 없습니다.'
                : '해당 기간의 댓글이 없습니다.'}
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>작성시각</th>
                  <th>글</th>
                  <th>작성자</th>
                  {isHiddenView && <th style={{ whiteSpace: 'nowrap' }}>걸린 말</th>}
                  <th>내용</th>
                  <th style={{ width: 80 }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.key}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{formatDate(r.created_at)}</td>
                    <td>
                      <span style={mutedStyle}>{r.kind}</span>
                      <a
                        href={r.href}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
                      >
                        {r.title}
                      </a>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.author || '—'}</td>
                    {isHiddenView && (
                      <td style={{ color: '#d93025', fontWeight: 600, wordBreak: 'break-all', maxWidth: 180 }}>{r.word}</td>
                    )}
                    <td style={{ whiteSpace: 'pre-wrap', maxWidth: 460 }}>
                      {!isHiddenView && r.word && <span style={hiddenStyle}>(금칙어 포함된 댓글)</span>}
                      {r.isReply && <span style={mutedStyle}>↳ 답글</span>}
                      {r.text}
                    </td>
                    <td>
                      <button
                        className="admin-btn admin-btn--small admin-btn--danger"
                        onClick={() => handleDelete(r)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
