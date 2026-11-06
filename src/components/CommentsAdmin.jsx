'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SERIES } from '../lib/series';

// 댓글은 칼럼 기사(article_id)나 일상 글(history_id) 가운데 하나에 달린다 (20261106_comments_history.sql)
const postOf = (c) => (c.history_id
  ? { id: c.history_id, href: `/history/${c.history_id}`, label: SERIES.history.label }
  : { id: c.article_id, href: `/article/${c.article_id}`, label: null });

const uniqueIds = (rows, key) => [...new Set(rows.map((r) => r[key]).filter(Boolean))];

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
  const [titleMap, setTitleMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadComments();
  }, [period]);

  const loadComments = async () => {
    setLoading(true);

    let q = supabase
      .from('comments')
      .select('id, article_id, history_id, user_name, text, created_at')
      .order('created_at', { ascending: false });

    if (period !== 'all') {
      const days = period === '7d' ? 7 : 30;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      q = q.gte('created_at', since);
    }

    const { data, error } = await q;
    if (error) {
      console.error('comments load error:', error);
      setComments([]);
      setLoading(false);
      return;
    }

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
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const filtered = query.trim()
    ? comments.filter((c) => {
        const q = query.trim().toLowerCase();
        return (
          (c.text || '').toLowerCase().includes(q) ||
          (c.user_name || '').toLowerCase().includes(q)
        );
      })
    : comments;

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">댓글을 불러오는 중...</div>
      </div>
    );
  }

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

      <div className="stats-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <h3 className="stats-section__title" style={{ margin: 0 }}>
            댓글 {filtered.length}개{query.trim() && ` (전체 ${comments.length}개 중)`}
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

        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '24px 0' }}>
            {comments.length === 0 ? '해당 기간의 댓글이 없습니다.' : '검색 결과가 없습니다.'}
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>작성시각</th>
                  <th>글</th>
                  <th>작성자</th>
                  <th>내용</th>
                  <th style={{ width: 80 }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const post = postOf(c);
                  return (
                    <tr key={c.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{formatDate(c.created_at)}</td>
                      <td>
                        {post.label && (
                          <span style={{ color: 'var(--text-muted)', fontSize: 13, marginRight: 6 }}>{post.label}</span>
                        )}
                        <a
                          href={post.href}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
                        >
                          {titleMap[post.id] || `#${post.id}`}
                        </a>
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.user_name || '—'}</td>
                      <td style={{ whiteSpace: 'pre-wrap', maxWidth: 460 }}>{c.text}</td>
                      <td>
                        <button
                          className="admin-btn admin-btn--small admin-btn--danger"
                          onClick={() => handleDelete(c.id)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
