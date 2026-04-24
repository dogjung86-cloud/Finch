'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function formatNumber(n) {
  return n.toLocaleString('ko-KR');
}

export default function StatsAdmin() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [articles, setArticles] = useState([]);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);

    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period] || 7;
    const since = new Date(now - days * 86400000).toISOString();

    // 전체 페이지뷰
    const { data: views } = await supabase
      .from('page_views')
      .select('visitor_id, device, page, referrer, created_at')
      .gte('created_at', since);

    // 기사별 조회수
    const { data: arts } = await supabase
      .from('articles')
      .select('id, title, view_count, category')
      .order('view_count', { ascending: false });

    if (views) {
      const uniqueVisitors = new Set(views.map((v) => v.visitor_id)).size;
      const totalPV = views.length;

      // 디바이스 비율
      const mobile = views.filter((v) => v.device === 'mobile').length;
      const desktop = views.filter((v) => v.device === 'desktop').length;

      // 유입 경로 분석
      const referrers = {};
      views.forEach((v) => {
        let source = '직접 방문';
        if (v.referrer) {
          try {
            const host = new URL(v.referrer).hostname;
            if (host.includes('google')) source = 'Google';
            else if (host.includes('naver')) source = 'Naver';
            else if (host.includes('youtube')) source = 'YouTube';
            else if (host.includes('instagram')) source = 'Instagram';
            else if (host.includes('twitter') || host.includes('x.com')) source = 'X (Twitter)';
            else if (host.includes('facebook')) source = 'Facebook';
            else source = host;
          } catch {
            source = '기타';
          }
        }
        referrers[source] = (referrers[source] || 0) + 1;
      });

      const topReferrers = Object.entries(referrers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // 일별 방문자 추이
      const daily = {};
      views.forEach((v) => {
        const day = v.created_at.slice(0, 10);
        if (!daily[day]) daily[day] = new Set();
        daily[day].add(v.visitor_id);
      });
      const dailyStats = Object.entries(daily)
        .map(([date, set]) => ({ date, uv: set.size }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // 인기 페이지 (기사 URL → 제목 변환)
      const titleMap = {};
      if (arts) arts.forEach((a) => { titleMap[`/article/${a.id}`] = a.title; });
      const pages = {};
      views.forEach((v) => {
        const label = titleMap[v.page] || (v.page === '/' ? '홈' : v.page);
        pages[label] = (pages[label] || 0) + 1;
      });
      const topPages = Object.entries(pages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      setStats({
        uniqueVisitors,
        totalPV,
        mobile,
        desktop,
        topReferrers,
        dailyStats,
        topPages,
      });
    }

    setArticles(arts || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">통계를 불러오는 중...</div>
      </div>
    );
  }

  const mobilePercent = stats && stats.totalPV > 0
    ? Math.round((stats.mobile / stats.totalPV) * 100) : 0;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">사이트 통계</h1>
        <div className="stats-period">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              className={`stats-period__btn ${period === p ? 'stats-period__btn--active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === '7d' ? '7일' : p === '30d' ? '30일' : '90일'}
            </button>
          ))}
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="stats-cards">
        <div className="stats-card">
          <span className="stats-card__label">순 방문자 (UV)</span>
          <span className="stats-card__value">{formatNumber(stats?.uniqueVisitors || 0)}</span>
        </div>
        <div className="stats-card">
          <span className="stats-card__label">페이지뷰 (PV)</span>
          <span className="stats-card__value">{formatNumber(stats?.totalPV || 0)}</span>
        </div>
        <div className="stats-card">
          <span className="stats-card__label">모바일 비율</span>
          <span className="stats-card__value">{mobilePercent}%</span>
        </div>
        <div className="stats-card">
          <span className="stats-card__label">총 기사 수</span>
          <span className="stats-card__value">{formatNumber(articles.length)}</span>
        </div>
      </div>

      {/* 일별 방문자 추이 */}
      {stats?.dailyStats?.length > 0 && (
        <div className="stats-section">
          <h3 className="stats-section__title">일별 방문자 추이</h3>
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

      {/* 유입 경로 + 인기 페이지 */}
      <div className="stats-row">
        <div className="stats-section stats-section--half">
          <h3 className="stats-section__title">유입 경로 TOP 5</h3>
          <div className="stats-list">
            {stats?.topReferrers?.map(([source, count], i) => (
              <div key={source} className="stats-list__item">
                <span className="stats-list__rank">{i + 1}</span>
                <span className="stats-list__name">{source}</span>
                <span className="stats-list__count">{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-section stats-section--half">
          <h3 className="stats-section__title">인기 페이지 TOP 5</h3>
          <div className="stats-list">
            {stats?.topPages?.map(([page, count], i) => (
              <div key={page} className="stats-list__item">
                <span className="stats-list__rank">{i + 1}</span>
                <span className="stats-list__name">{page}</span>
                <span className="stats-list__count">{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 기사별 조회수 랭킹 */}
      <div className="stats-section">
        <h3 className="stats-section__title">기사별 조회수</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>제목</th>
                <th>카테고리</th>
                <th>조회수</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a, i) => (
                <tr key={a.id}>
                  <td>{i + 1}</td>
                  <td className="admin-table__title-cell">{a.title}</td>
                  <td>{a.category || '-'}</td>
                  <td>{formatNumber(a.view_count || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
