import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/* ── 폴백 기사 데이터 (DB가 비어있을 때 사용) ── */
const FALLBACK_ARTICLES = [
  {
    id: 1,
    title: '제임스 웹 망원경이 포착한 가장 먼 은하의 비밀',
    excerpt: 'NASA의 제임스 웹 우주 망원경이 빅뱅 직후 형성된 것으로 보이는 초기 은하를 발견했습니다.',
    full_content: 'NASA의 제임스 웹 우주 망원경(JWST)이 빅뱅 직후 형성된 것으로 보이는 초기 은하를 발견했습니다.\n\n이번에 포착된 은하는 빅뱅 이후 약 3억 년 만에 형성된 것으로 추정되며, 기존에 알려진 가장 오래된 은하보다 약 1억 년 더 앞선 시기에 존재했습니다.\n\n연구팀은 "이 은하의 존재는 우주 초기에 별과 은하가 기존 이론보다 훨씬 빠르게 형성되었음을 시사한다"고 밝혔습니다.\n\n이번 발견은 현재의 우주론 모델에 중대한 도전을 제기합니다.',
    author: 'The Finch',
    category: '기획',
    thumbnail: '/images/articles/space_galaxy.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'CRISPR 유전자 편집, 유전 질환 치료의 새 시대를 열다',
    excerpt: 'CRISPR-Cas9 기반의 유전자 치료가 겸상적혈구병 환자에게 최초로 승인되었습니다.',
    full_content: 'CRISPR-Cas9 기반의 유전자 치료가 겸상적혈구병 환자에게 최초로 승인되며, 유전 질환 치료의 패러다임이 바뀌고 있습니다.\n\nFDA는 Casgevy를 겸상적혈구병 치료제로 승인했습니다. 이는 CRISPR 기술을 활용한 최초의 유전자 치료제입니다.',
    author: 'The Finch',
    category: '기획',
    thumbnail: '/images/articles/crispr_dna.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: '양자 컴퓨터, 1000큐비트 시대 돌입',
    excerpt: '차세대 양자 프로세서가 1000큐비트를 돌파하며 상업적 양자 컴퓨팅 시대가 한 발짝 더 가까워졌습니다.',
    full_content: '차세대 양자 프로세서가 1000큐비트를 돌파하며 상업적 양자 컴퓨팅 시대가 한 발짝 더 가까워졌습니다.\n\nIBM의 새로운 양자 프로세서 Condor는 1,121개의 큐비트를 탑재하여 역대 가장 큰 규모의 양자 칩으로 기록되었습니다.',
    author: 'The Finch',
    category: '기획',
    thumbnail: '/images/articles/quantum_computer.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    title: '그래핀 기반 해수 담수화 막, 물 위기의 해답?',
    excerpt: '그래핀 산화물 기반의 새로운 담수화 막이 기존 기술보다 효율이 10배 높다는 연구 결과가 발표되었습니다.',
    full_content: '그래핀 산화물 기반의 새로운 담수화 막이 기존 기술보다 효율이 10배 높다는 연구 결과가 발표되었습니다.\n\n맨체스터 대학교 연구팀이 개발한 이 그래핀 막은 나노미터 수준의 미세한 구멍을 통해 물 분자만 선택적으로 통과시킵니다.',
    author: 'The Finch',
    category: '뉴스',
    thumbnail: '/images/articles/graphene_water.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    title: 'GPT-5 등장: AI가 과학 연구를 직접 수행하는 시대',
    excerpt: '인공지능이 실험 설계부터 논문 작성까지 독립적으로 수행할 수 있는 수준에 도달했습니다.',
    full_content: '인공지능이 실험 설계부터 논문 작성까지 독립적으로 수행할 수 있는 수준에 도달했습니다.\n\nOpenAI가 공개한 GPT-5는 과학 논문을 읽고 가설을 세우며, 실험을 설계하고 데이터를 분석하는 것까지 가능합니다.',
    author: 'The Finch',
    category: '뉴스',
    thumbnail: '/images/articles/ai_research.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 6,
    title: '화성 토양에서 발견된 유기물, 생명체 흔적일까',
    excerpt: '퍼서비어런스 로버가 화성 예제로 크레이터에서 복잡한 유기 분자를 검출했습니다.',
    full_content: '퍼서비어런스 로버가 화성 예제로 크레이터에서 복잡한 유기 분자를 검출했습니다.\n\nNASA의 화성 탐사 로버 퍼서비어런스가 예제로 크레이터 내 고대 삼각주 지역에서 다양한 유기 분자를 발견했습니다.',
    author: 'The Finch',
    category: '뉴스',
    thumbnail: '/images/articles/mars_rover.png',
    created_at: new Date().toISOString(),
  },
  {
    id: 7,
    title: '인류의 달 귀환: 아르테미스 3호의 도전과 과제',
    excerpt: 'NASA의 아르테미스 3호가 50년 만의 유인 달 착륙을 준비하고 있습니다.',
    full_content: 'NASA의 아르테미스 3호가 50년 만의 유인 달 착륙을 준비하고 있습니다.\n\n이번 미션에서는 최초로 여성 우주인이 달 표면에 발을 디딜 예정입니다.\n\n달 남극의 영구 그림자 지역에서 물 얼음을 탐사하는 것이 핵심 목표 중 하나입니다.',
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

export default function MagazineGrid({ onArticleClick }) {
  const [activeTab, setActiveTab] = useState('main');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Supabase에서 기사 로드 ──
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('is_published', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setArticles(data);
        }
      } catch {
        // 네트워크 에러 → 폴백 사용
        setArticles(FALLBACK_ARTICLES);
      }
      setLoading(false);
    };

    fetchArticles();
  }, []);

  // 기획 기사(가운데+왼쪽), 뉴스 기사(오른쪽)
  const featureArticles = articles.filter((a) => a.category === '기획');
  const newsArticles = articles.filter((a) => a.category === '뉴스');

  const heroArticle = featureArticles[0] || articles[0];
  const sideLeftArticles = featureArticles.slice(1, 3);
  const trendingArticles = newsArticles.slice(0, 4);

  // 탭 필터링
  const filteredArticles = articles.filter((a) => a.category === activeTab);

  if (loading || articles.length === 0) {
    return (
      <section className="kq-section" id="magazine-section">
        <div className="kq-header">
          <h2 className="kq-header__title">The Finch</h2>
          <p className="kq-header__sub">과학은 세상을 보는 창</p>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          기사를 불러오는 중...
        </div>
      </section>
    );
  }

  return (
    <section className="kq-section" id="magazine-section">
      {/* 헤더 */}
      <div className="kq-header">
        <h2 className="kq-header__title">The Finch</h2>
        <p className="kq-header__sub">과학은 세상을 보는 창</p>
      </div>

      {/* ── 탭 네비게이션 ── */}
      <div className="kq-tabs">
        {['main', '기획', '뉴스'].map((tab) => (
          <button
            key={tab}
            className={`kq-tabs__btn ${activeTab === tab ? 'kq-tabs__btn--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'main' ? '메인' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'main' ? (
        /* ── Atlantic 스타일 3-칼럼 ── */
        <div className="atlantic-grid">
          {/* 좌측: 사이드 기사 2개 */}
          <aside className="atlantic-side-left">
            {sideLeftArticles.map((a) => (
              <article
                key={a.id}
                className="atlantic-side-article"
                onClick={() => onArticleClick?.(a)}
              >
                <div className="atlantic-side-article__img">
                  <img src={a.thumbnail} alt={a.title} />
                </div>
                <span className="atlantic-side-article__caption">{a.category}</span>
                <h3 className="atlantic-side-article__title">{a.title}</h3>
                <span className="atlantic-side-article__author">{a.author} · {formatDate(a.created_at)}</span>
              </article>
            ))}
          </aside>

          {/* 중앙: 히어로 기사 1개 */}
          <section className="atlantic-center" onClick={() => onArticleClick?.(heroArticle)}>
            <div className="atlantic-hero-img">
              <img src={heroArticle.thumbnail} alt={heroArticle.title} />
            </div>
            <p className="atlantic-hero-caption">기획</p>
            <h1 className="atlantic-hero-title">{heroArticle.title}</h1>
            <p className="atlantic-hero-excerpt">{heroArticle.excerpt}</p>
            <p className="atlantic-hero-author">{heroArticle.author}</p>
          </section>

          {/* 우측: 뉴스 기사 4개 + 뉴스레터 */}
          <aside className="atlantic-side-right">
            <span className="atlantic-side-article__caption">뉴스</span>
            {trendingArticles.map((a) => (
              <div
                key={a.id}
                className="atlantic-trending-item"
                onClick={() => onArticleClick?.(a)}
              >
                <div className="atlantic-trending-body">
                  <h4 className="atlantic-trending-title">{a.title}</h4>
                  <span className="atlantic-trending-author">{a.author} · {formatDate(a.created_at)}</span>
                </div>
                <img
                  className="atlantic-trending-thumb"
                  src={a.thumbnail}
                  alt={a.title}
                />
              </div>
            ))}

            {/* 뉴스레터 구독 */}
            <div className="atlantic-newsletter">
              <h4 className="atlantic-newsletter__title">
                Finch의 매주 과학 뉴스레터를 받아보세요
              </h4>
              <p className="atlantic-newsletter__desc">
                매주 엄선된 과학 기사와 깊이 있는 분석을 무료로 보내드립니다.
              </p>
              <div className="atlantic-newsletter__form">
                <input
                  type="email"
                  className="atlantic-newsletter__input"
                  placeholder="이메일 주소"
                />
                <button className="atlantic-newsletter__btn">구독</button>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        /* ── 기획 / 뉴스 리스트 뷰 ── */
        <div className="all-articles-wrap">
          <div className="all-articles">
            <div className="all-articles__list">
              {filteredArticles.map((a) => (
                <article
                  key={a.id}
                  className="all-articles__item"
                  onClick={() => onArticleClick?.(a)}
                >
                  <img
                    className="all-articles__thumb"
                    src={a.thumbnail}
                    alt={a.title}
                  />
                  <div className="all-articles__body">
                    <span className="all-articles__category">{a.category}</span>
                    <h4 className="all-articles__title">{a.title}</h4>
                    <p className="all-articles__excerpt">{a.excerpt}</p>
                    <span className="all-articles__meta">{a.author} · {formatDate(a.created_at)}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
