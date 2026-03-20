import { useState } from 'react';

/* ── 기획 기사 (가운데 큰 썸네일) ── */
const FEATURED = [
  {
    id: 1,
    title: '제임스 웹 망원경이 포착한 가장 먼 은하의 비밀',
    excerpt: 'NASA의 제임스 웹 우주 망원경이 빅뱅 직후 형성된 것으로 보이는 초기 은하를 발견했습니다.',
    fullContent: `NASA의 제임스 웹 우주 망원경(JWST)이 빅뱅 직후 형성된 것으로 보이는 초기 은하를 발견했습니다.\n\n이번에 포착된 은하는 빅뱅 이후 약 3억 년 만에 형성된 것으로 추정되며, 기존에 알려진 가장 오래된 은하보다 약 1억 년 더 앞선 시기에 존재했습니다.\n\n연구팀은 "이 은하의 존재는 우주 초기에 별과 은하가 기존 이론보다 훨씬 빠르게 형성되었음을 시사한다"고 밝혔습니다.`,
    author: '이수아',
    date: '2시간 전',
    thumbnail: '/images/articles/space_galaxy.png',
  },
  {
    id: 2,
    title: 'CRISPR 유전자 편집, 유전 질환 치료의 새 시대를 열다',
    excerpt: 'CRISPR-Cas9 기반의 유전자 치료가 겸상적혈구병 환자에게 최초로 승인되었습니다.',
    fullContent: `CRISPR-Cas9 기반의 유전자 치료가 겸상적혈구병 환자에게 최초로 승인되며, 유전 질환 치료의 패러다임이 바뀌고 있습니다.\n\nFDA는 'Casgevy'를 겸상적혈구병 치료제로 승인했습니다. 이는 CRISPR 기술을 활용한 최초의 유전자 치료제입니다.\n\n임상 시험에서 치료를 받은 환자의 93%가 최소 12개월간 혈관 폐쇄 발작이 없었습니다.`,
    author: '김진호',
    date: '7시간 전',
    thumbnail: '/images/articles/crispr_dna.png',
  },
  // 추가 기획 기사 (전체 보기용)
  {
    id: 7,
    title: '인류의 달 귀환: 아르테미스 3호의 도전과 과제',
    excerpt: 'NASA의 아르테미스 3호가 50년 만의 유인 달 착륙을 준비하고 있습니다.',
    fullContent: `NASA의 아르테미스 3호가 50년 만의 유인 달 착륙을 준비하고 있습니다.\n\n이번 미션에서는 최초로 여성 우주인이 달 표면에 발을 디딜 예정입니다.\n\n달 남극의 영구 그림자 지역에서 물 얼음을 탐사하는 것이 핵심 목표 중 하나입니다.`,
    author: '박정우',
    date: '3일 전',
    thumbnail: '/images/articles/space_galaxy.png',
  },
];

/* ── 뉴스 기사 (좌우 작은 썸네일) ── */
const NEWS = [
  {
    id: 3,
    title: '양자 컴퓨터, 1000큐비트 시대 돌입',
    author: '박정우',
    date: '13시간 전',
    thumbnail: '/images/articles/quantum_computer.png',
  },
  {
    id: 4,
    title: '그래핀 기반 해수 담수화 막, 물 위기의 해답?',
    author: '최윤진',
    date: '1일 전',
    thumbnail: '/images/articles/graphene_water.png',
  },
  {
    id: 5,
    title: 'GPT-5 등장: AI가 과학 연구를 직접 수행하는 시대',
    author: '정세훈',
    date: '1일 전',
    thumbnail: '/images/articles/ai_research.png',
  },
  {
    id: 6,
    title: '화성 토양에서 발견된 유기물, 생명체 흔적일까',
    author: '이수아',
    date: '2일 전',
    thumbnail: '/images/articles/mars_rover.png',
  },
  // 추가 뉴스 (전체 보기용)
  {
    id: 8,
    title: '남극 빙하 붕괴 속도, 예측보다 2배 빨라',
    author: '최윤진',
    date: '3일 전',
    thumbnail: '/images/articles/graphene_water.png',
  },
  {
    id: 9,
    title: '새로운 항생제 후보 물질, 심해 미생물에서 발견',
    author: '김진호',
    date: '4일 전',
    thumbnail: '/images/articles/crispr_dna.png',
  },
];

export default function MagazineGrid() {
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('main'); // 'main' | 'featured' | 'news'
  const toggle = (id) => setExpandedId(expandedId === id ? null : id);

  // 메인 뷰: 기획 2개(가운데), 뉴스 좌2 우2
  const featuredMain = FEATURED.slice(0, 2);
  const newsLeft = NEWS.slice(0, 2);
  const newsRight = NEWS.slice(2, 4);

  return (
    <section className="kq-section" id="magazine-section">
      {/* 헤더 */}
      <div className="kq-header">
        <h2 className="kq-header__title">Brain Pick</h2>
        <p className="kq-header__sub">과학은 세상을 보는 창</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="kq-tabs">
        <button
          className={`kq-tabs__btn ${activeTab === 'main' ? 'kq-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('main')}
        >
          메인
        </button>
        <button
          className={`kq-tabs__btn ${activeTab === 'featured' ? 'kq-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('featured')}
        >
          기획 모음
        </button>
        <button
          className={`kq-tabs__btn ${activeTab === 'news' ? 'kq-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('news')}
        >
          뉴스 모음
        </button>
      </div>

      {/* ── 메인 뷰: 3-컬럼 (좌 뉴스 | 중앙 기획 | 우 뉴스) ── */}
      {activeTab === 'main' && (
        <div className="kq-mosaic">
          {/* 왼쪽: 뉴스 */}
          <div className="kq-mosaic__side">
            {newsLeft.map((a) => (
              <article key={a.id} className="kq-card kq-card--small">
                <div className="kq-card__img">
                  <img src={a.thumbnail} alt={a.title} />
                  <span className="kq-card__tag kq-card__tag--news">뉴스</span>
                </div>
                <h4 className="kq-card__title">{a.title}</h4>
                <span className="kq-card__meta">{a.author} · {a.date}</span>
              </article>
            ))}
          </div>

          {/* 가운데: 기획 */}
          <div className="kq-mosaic__center">
            {featuredMain.map((a) => (
              <article key={a.id} className="kq-card kq-card--large">
                <div className="kq-card__img kq-card__img--hero">
                  <img src={a.thumbnail} alt={a.title} />
                  <span className="kq-card__tag kq-card__tag--feature">기획</span>
                </div>
                <h3 className="kq-card__title kq-card__title--lg">{a.title}</h3>
                <p className="kq-card__excerpt">{a.excerpt}</p>
                <span className="kq-card__meta">{a.author} · {a.date}</span>
                <button className="kq-card__readmore" onClick={() => toggle(a.id)}>
                  {expandedId === a.id ? '접기 ▲' : '계속 읽기 ▼'}
                </button>
                <div className={`kq-card__expand ${expandedId === a.id ? 'kq-card__expand--open' : ''}`}>
                  {a.fullContent.split('\n\n').map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {/* 오른쪽: 뉴스 */}
          <div className="kq-mosaic__side">
            {newsRight.map((a) => (
              <article key={a.id} className="kq-card kq-card--small">
                <div className="kq-card__img">
                  <img src={a.thumbnail} alt={a.title} />
                  <span className="kq-card__tag kq-card__tag--news">뉴스</span>
                </div>
                <h4 className="kq-card__title">{a.title}</h4>
                <span className="kq-card__meta">{a.author} · {a.date}</span>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ── 기획 모음 목록 ── */}
      {activeTab === 'featured' && (
        <div className="kq-list">
          {FEATURED.map((a) => (
            <article key={a.id} className="kq-list__item">
              <div className="kq-list__img">
                <img src={a.thumbnail} alt={a.title} />
                <span className="kq-card__tag kq-card__tag--feature">기획</span>
              </div>
              <div className="kq-list__body">
                <h3 className="kq-list__title">{a.title}</h3>
                <p className="kq-list__excerpt">{a.excerpt}</p>
                <span className="kq-card__meta">{a.author} · {a.date}</span>
                <button className="kq-card__readmore" onClick={() => toggle(a.id)}>
                  {expandedId === a.id ? '접기 ▲' : '계속 읽기 ▼'}
                </button>
                <div className={`kq-card__expand ${expandedId === a.id ? 'kq-card__expand--open' : ''}`}>
                  {a.fullContent.split('\n\n').map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ── 뉴스 모음 목록 ── */}
      {activeTab === 'news' && (
        <div className="kq-news-grid">
          {NEWS.map((a) => (
            <article key={a.id} className="kq-card kq-card--small">
              <div className="kq-card__img">
                <img src={a.thumbnail} alt={a.title} />
                <span className="kq-card__tag kq-card__tag--news">뉴스</span>
              </div>
              <h4 className="kq-card__title">{a.title}</h4>
              <span className="kq-card__meta">{a.author} · {a.date}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
