'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { adminErrorMessage } from '../lib/adminEditor';
import { summarizeViews } from '../lib/pageStats';
import { SERIES } from '../lib/series';

const PERIODS = [
  { id: '7d', days: 7, label: '7일' },
  { id: '30d', days: 30, label: '30일' },
  { id: '90d', days: 90, label: '90일' },
];

function formatNumber(n) {
  return n.toLocaleString('ko-KR');
}

// 서버가 한 번에 1000줄까지만 돌려주므로 빈 응답이 올 때까지 이어서 받는다
async function fetchViews(since) {
  const rows = [];
  for (;;) {
    const { data, error } = await supabase
      .from('page_views')
      .select('visitor_id, device, page, referrer, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .range(rows.length, rows.length + 999);
    if (error) throw error;
    if (!data.length) return rows;
    rows.push(...data);
  }
}

async function fetchRows(table, columns) {
  const { data, error } = await supabase.from(table).select(columns);
  if (error) throw error;
  return data;
}

async function fetchStats(days) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const [views, articles, history] = await Promise.all([
    fetchViews(since),
    fetchRows('articles', 'id, title, view_count, category, is_published'),
    fetchRows('history_science', 'id, title, is_published'),
  ]);

  const titles = {};
  articles.forEach((a) => { titles[`/article/${a.id}`] = a.title; });
  history.forEach((h) => { titles[`/history/${h.id}`] = h.title; });
  const summary = summarizeViews(views, titles);

  const publishedArticles = articles.filter((a) => a.is_published);
  const publishedHistory = history.filter((h) => h.is_published);

  // 이 기간에 많이 읽은 글부터. 일상 기록은 누적 조회수를 세지 않는다.
  const posts = [
    ...publishedArticles.map((a) => ({
      href: `/article/${a.id}`,
      title: a.title,
      kind: a.category && a.category !== '미분류'
        ? `${SERIES.column.adminLabel} · ${a.category}`
        : SERIES.column.adminLabel,
      total: a.view_count || 0,
    })),
    ...publishedHistory.map((h) => ({
      href: `/history/${h.id}`,
      title: h.title,
      kind: SERIES.history.adminLabel,
      total: null,
    })),
  ]
    .map((post) => ({ ...post, recent: summary.visitsByPage[post.href] || 0 }))
    .sort((a, b) => b.recent - a.recent || (b.total || 0) - (a.total || 0));

  return {
    ...summary,
    posts,
    articleCount: publishedArticles.length,
    historyCount: publishedHistory.length,
  };
}

export default function StatsAdmin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    // 기간을 빠르게 바꿨을 때 늦게 도착한 옛 결과가 덮어쓰지 않게 한다
    let stale = false;
    setLoading(true);
    fetchStats(PERIODS.find((p) => p.id === period).days)
      .then((next) => {
        if (stale) return;
        setStats(next);
        setError('');
      })
      .catch((err) => {
        if (stale) return;
        console.error('stats load error:', err);
        setStats(null);
        setError(`통계를 불러오지 못했습니다. ${adminErrorMessage(err)}`);
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [period]);

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">사이트 통계</h1>
        <div className="stats-period">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              className={`stats-period__btn ${period === p.id ? 'stats-period__btn--active' : ''}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="admin-error" role="alert">{error}</div>}
      {loading && <div className="admin-loading">통계를 불러오는 중...</div>}

      {!loading && stats && (
        <>
          {/* 주요 지표 카드 */}
          <div className="stats-cards">
            <div className="stats-card">
              <span className="stats-card__label">순 방문자 (UV)</span>
              <span className="stats-card__value">{formatNumber(stats.uniqueVisitors)}</span>
            </div>
            <div className="stats-card">
              <span className="stats-card__label">페이지뷰 (PV)</span>
              <span className="stats-card__value">{formatNumber(stats.totalPV)}</span>
            </div>
            <div className="stats-card">
              <span className="stats-card__label">모바일 비율</span>
              <span className="stats-card__value">{stats.mobilePercent}%</span>
            </div>
            <div className="stats-card">
              <span className="stats-card__label">공개한 글</span>
              <span className="stats-card__value">{formatNumber(stats.articleCount + stats.historyCount)}</span>
              <span className="stats-card__note">
                {SERIES.column.adminLabel} {formatNumber(stats.articleCount)} · {SERIES.history.adminLabel} {formatNumber(stats.historyCount)}
              </span>
            </div>
          </div>

          {/* 일별 방문자 추이 */}
          {stats.dailyStats.length > 0 && (
            <div className="stats-section">
              <h3 className="stats-section__title">일별 방문자 추이 (한국 시간)</h3>
              <div className="stats-chart">
                {stats.dailyStats.map((d) => {
                  const max = Math.max(...stats.dailyStats.map((s) => s.uv), 1);
                  const height = Math.max((d.uv / max) * 120, 4);
                  return (
                    <div key={d.date} className="stats-chart__bar-wrap">
                      <span className="stats-chart__bar-value">{d.uv}</span>
                      <div className="stats-chart__bar" style={{ height }} />
                      <span className="stats-chart__bar-label">{d.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 메뉴별 방문 */}
          <div className="stats-section">
            <h3 className="stats-section__title">메뉴별 방문</h3>
            <div className="stats-menu">
              <div className="stats-menu__row stats-menu__row--head">
                <span>메뉴</span>
                <span aria-hidden="true" />
                <span className="stats-menu__num">방문 수</span>
                <span className="stats-menu__num">방문자</span>
              </div>
              {stats.menus.map((menu) => (
                <div key={menu.label} className="stats-menu__row">
                  <span className="stats-menu__name">{menu.label}</span>
                  <span className="stats-menu__track" aria-hidden="true">
                    <span className="stats-menu__bar" style={{ width: `${menu.percent}%` }} />
                  </span>
                  <span className="stats-menu__num">{formatNumber(menu.views)}</span>
                  <span className="stats-menu__num">{formatNumber(menu.visitors)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 유입 경로 + 인기 페이지 */}
          <div className="stats-row">
            <div className="stats-section stats-section--half">
              <h3 className="stats-section__title">유입 경로 TOP 5</h3>
              <div className="stats-list">
                {stats.topReferrers.map(([source, count], i) => (
                  <div key={source} className="stats-list__item">
                    <span className="stats-list__rank">{i + 1}</span>
                    <span className="stats-list__name">{source}</span>
                    <span className="stats-list__count">{formatNumber(count)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-section stats-section--half">
              <h3 className="stats-section__title">인기 페이지 TOP 10</h3>
              <div className="stats-list">
                {stats.topPages.map(([page, count], i) => (
                  <div key={page} className="stats-list__item">
                    <span className="stats-list__rank">{i + 1}</span>
                    <span className="stats-list__name" title={page}>{page}</span>
                    <span className="stats-list__count">{formatNumber(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 글별 조회수 */}
          <div className="stats-section">
            <h3 className="stats-section__title">글별 조회수</h3>
            {stats.posts.length === 0 ? (
              <div className="admin-empty"><p>공개한 글이 없습니다.</p></div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>제목</th>
                      <th>구분</th>
                      <th>이 기간 방문</th>
                      <th>누적 조회수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.posts.map((post, i) => (
                      <tr key={post.href}>
                        <td>{i + 1}</td>
                        <td className="admin-table__title-cell">{post.title}</td>
                        <td>{post.kind}</td>
                        <td>{formatNumber(post.recent)}</td>
                        <td>{post.total === null ? '-' : formatNumber(post.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
