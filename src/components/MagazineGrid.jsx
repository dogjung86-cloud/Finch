'use client';

import Link from 'next/link';
import SmartImage from './SmartImage';

/* ── 폴백 기사 데이터 (DB가 비어있을 때 사용) ── */
const FALLBACK_ARTICLES = [
  {
    id: 1,
    title: '제임스 웹 망원경이 포착한 가장 먼 은하의 비밀',
    excerpt: 'NASA의 제임스 웹 우주 망원경이 빅뱅 직후 형성된 것으로 보이는 초기 은하를 발견했습니다.',
    author: 'The Finch',
    category: '기획',
    thumbnail: '/images/articles/space_galaxy.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'CRISPR 유전자 편집, 유전 질환 치료의 새 시대를 열다',
    excerpt: 'CRISPR-Cas9 기반의 유전자 치료가 겸상적혈구병 환자에게 최초로 승인되었습니다.',
    author: 'The Finch',
    category: '기획',
    thumbnail: '/images/articles/crispr_dna.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: '양자 컴퓨터, 1000큐비트 시대 돌입',
    excerpt: '차세대 양자 프로세서가 1000큐비트를 돌파하며 상업적 양자 컴퓨팅 시대가 한 발짝 더 가까워졌습니다.',
    author: 'The Finch',
    category: '기획',
    thumbnail: '/images/articles/quantum_computer.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    title: '그래핀 기반 해수 담수화 막, 물 위기의 해답?',
    excerpt: '그래핀 산화물 기반의 새로운 담수화 막이 기존 기술보다 효율이 10배 높다는 연구 결과가 발표되었습니다.',
    author: 'The Finch',
    category: '뉴스',
    thumbnail: '/images/articles/graphene_water.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    title: 'GPT-5 등장: AI가 과학 연구를 직접 수행하는 시대',
    excerpt: '인공지능이 실험 설계부터 논문 작성까지 독립적으로 수행할 수 있는 수준에 도달했습니다.',
    author: 'The Finch',
    category: '뉴스',
    thumbnail: '/images/articles/ai_research.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 6,
    title: '화성 토양에서 발견된 유기물, 생명체 흔적일까',
    excerpt: '퍼서비어런스 로버가 화성 예제로 크레이터에서 복잡한 유기 분자를 검출했습니다.',
    author: 'The Finch',
    category: '뉴스',
    thumbnail: '/images/articles/mars_rover.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 7,
    title: '인류의 달 귀환: 아르테미스 3호의 도전과 과제',
    excerpt: 'NASA의 아르테미스 3호가 50년 만의 유인 달 착륙을 준비하고 있습니다.',
    author: 'The Finch',
    category: '뉴스',
    thumbnail: '/images/articles/space_galaxy.png',
    created_at: new Date().toISOString(),
  },
];

/* ── 날짜 포맷 헬퍼 ── */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return '방금 전';
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function MagazineGrid({ articles: initialArticles, latestHistory }) {
  const articles = initialArticles && initialArticles.length > 0 ? initialArticles : FALLBACK_ARTICLES;

  const heroArticle = articles[0];
  const leftArticles = articles.slice(1, 3);
  const rightArticles = articles.slice(3, 6);

  const scrollToHistorySection = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const el = document.getElementById('history-section');
    if (!el) return;
    const navbarHeight = 60;
    const top = el.getBoundingClientRect().top + window.scrollY - navbarHeight;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <section className="kq-section" id="magazine-section">
      <div className="kq-header">
        <h2 className="kq-header__title">이상하게 빠져드는 과학 이야기</h2>
        <p className="kq-header__sub">자연의 원리가 더 재밌어지는 순간</p>
      </div>

      {/* ── 100년 전 과학 배너 ── */}
      {latestHistory && (
        <div className="vintage-banner">
          <button
            type="button"
            className="vintage-banner__link-overlay"
            onClick={scrollToHistorySection}
            aria-label="쓸데없이 재밌는 과학사 목록으로 이동"
          />
          <span className="vintage-banner__label">쓸데없이 재밌는 과학사</span>
          <span className="vintage-banner__divider">|</span>
          <span className="vintage-banner__title">{latestHistory.title}</span>
          <button type="button" className="vintage-banner__cta" onClick={scrollToHistorySection}>
            더 보기 &rarr;
          </button>
        </div>
      )}

      <div className="atlantic-grid">
        {/* 좌측: 중형 썸네일 기사 2개 */}
        <aside className="atlantic-col-left">
          {leftArticles.map((a) => (
            <Link key={a.id} href={`/article/${a.id}`} className="atlantic-md-card">
              <div className="atlantic-md-card__img">
                {a.thumbnail && (
                  <SmartImage
                    src={a.thumbnail}
                    alt={a.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 280px"
                    style={{ objectFit: 'cover' }}
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
              <h3 className="atlantic-md-card__title">{a.title}</h3>
              <span className="atlantic-md-card__author">{a.author} · {formatDate(a.created_at)}</span>
            </Link>
          ))}
        </aside>

        {/* 중앙: 히어로 기사 */}
        {heroArticle && (
          <Link href={`/article/${heroArticle.id}`} className="atlantic-hero">
            <div className="atlantic-hero__img">
              {heroArticle.thumbnail && (
                <SmartImage
                  src={heroArticle.thumbnail}
                  alt={heroArticle.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  style={{ objectFit: 'cover' }}
                  priority
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            <h1 className="atlantic-hero__title">{heroArticle.title}</h1>
            <p className="atlantic-hero__excerpt">{heroArticle.excerpt}</p>
            <span className="atlantic-hero__author">{heroArticle.author} · {formatDate(heroArticle.created_at)}</span>
          </Link>
        )}

        {/* 우측: 소형 썸네일 기사 3개 */}
        <aside className="atlantic-col-right">
          {rightArticles.map((a) => (
            <Link key={a.id} href={`/article/${a.id}`} className="atlantic-sm-card">
              {a.thumbnail && (
                <div className="atlantic-sm-card__img-wrap">
                  <SmartImage
                    className="atlantic-sm-card__img"
                    src={a.thumbnail}
                    alt={a.title}
                    width={320}
                    height={180}
                    sizes="(max-width: 900px) 100vw, 280px"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="atlantic-sm-card__body">
                <h4 className="atlantic-sm-card__title">{a.title}</h4>
                <span className="atlantic-sm-card__author">{a.author} · {formatDate(a.created_at)}</span>
              </div>
            </Link>
          ))}
        </aside>
      </div>

      <div className="atlantic-all-articles">
        <Link href="/articles" className="atlantic-all-articles__btn">
          분야별로 더 보기
        </Link>
      </div>

      <div className="atlantic-wave-bottom">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,0 L1440,0 L1440,20 C1200,50 960,5 720,30 C480,55 240,10 0,35 Z" fill="#F2F2F2" />
        </svg>
      </div>
    </section>
  );
}
