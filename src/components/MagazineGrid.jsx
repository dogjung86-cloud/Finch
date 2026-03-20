import { useState } from 'react';

/* ── 모든 기사 데이터 ── */
export const ALL_ARTICLES = [
  {
    id: 1,
    title: '제임스 웹 망원경이 포착한 가장 먼 은하의 비밀',
    excerpt: 'NASA의 제임스 웹 우주 망원경이 빅뱅 직후 형성된 것으로 보이는 초기 은하를 발견했습니다.',
    fullContent: `NASA의 제임스 웹 우주 망원경(JWST)이 빅뱅 직후 형성된 것으로 보이는 초기 은하를 발견했습니다.\n\n이번에 포착된 은하는 빅뱅 이후 약 3억 년 만에 형성된 것으로 추정되며, 기존에 알려진 가장 오래된 은하보다 약 1억 년 더 앞선 시기에 존재했습니다.\n\n연구팀은 "이 은하의 존재는 우주 초기에 별과 은하가 기존 이론보다 훨씬 빠르게 형성되었음을 시사한다"고 밝혔습니다.\n\n이번 발견은 현재의 우주론 모델에 중대한 도전을 제기합니다. 기존 이론에 따르면, 빅뱅 이후 수억 년이 지나야 충분한 물질이 모여 은하를 형성할 수 있습니다. 그러나 JWST가 포착한 이 은하는 예상보다 훨씬 일찍 형성되었으며, 놀라울 정도로 성숙한 구조를 보여주고 있습니다.\n\n연구진은 이 은하가 약 100억 개의 별을 포함하고 있으며, 활발한 별 형성 활동을 보이고 있다고 발표했습니다. 이는 우주 초기의 별 형성 속도가 기존 모델이 예측한 것보다 10배 이상 빠를 수 있음을 의미합니다.`,
    author: '이수아',
    date: '2시간 전',
    category: '우주',
    thumbnail: '/images/articles/space_galaxy.png',
  },
  {
    id: 2,
    title: 'CRISPR 유전자 편집, 유전 질환 치료의 새 시대를 열다',
    excerpt: 'CRISPR-Cas9 기반의 유전자 치료가 겸상적혈구병 환자에게 최초로 승인되었습니다.',
    fullContent: `CRISPR-Cas9 기반의 유전자 치료가 겸상적혈구병 환자에게 최초로 승인되며, 유전 질환 치료의 패러다임이 바뀌고 있습니다.\n\nFDA는 'Casgevy'를 겸상적혈구병 치료제로 승인했습니다. 이는 CRISPR 기술을 활용한 최초의 유전자 치료제입니다.\n\n임상 시험에서 치료를 받은 환자의 93%가 최소 12개월간 혈관 폐쇄 발작이 없었습니다.\n\n이 혁신적인 치료법은 환자의 조혈모세포를 채취한 후, CRISPR-Cas9를 이용해 BCL11A 유전자를 편집합니다. 이 유전자가 비활성화되면 태아 헤모글로빈이 다시 생성되어 겸상적혈구의 형성을 방지합니다.\n\n치료 과정은 약 6개월이 소요되며, 환자는 먼저 화학요법을 통해 기존 골수세포를 제거한 후 편집된 세포를 주입받습니다.`,
    author: '김진호',
    date: '7시간 전',
    category: '생명과학',
    thumbnail: '/images/articles/crispr_dna.png',
  },
  {
    id: 3,
    title: '양자 컴퓨터, 1000큐비트 시대 돌입',
    excerpt: '차세대 양자 프로세서가 1000큐비트를 돌파하며 상업적 양자 컴퓨팅 시대가 한 발짝 더 가까워졌습니다.',
    fullContent: `차세대 양자 프로세서가 1000큐비트를 돌파하며 상업적 양자 컴퓨팅 시대가 한 발짝 더 가까워졌습니다.\n\nIBM의 새로운 양자 프로세서 'Condor'는 1,121개의 큐비트를 탑재하여 역대 가장 큰 규모의 양자 칩으로 기록되었습니다.\n\n이 프로세서는 기존의 고전 컴퓨터로는 수천 년이 걸리는 복잡한 계산을 수 분 만에 처리할 수 있는 잠재력을 가지고 있습니다.\n\n양자 컴퓨팅의 상용화는 신약 개발, 기후 모델링, 금융 위험 분석 등 다양한 분야에 혁명적인 변화를 가져올 것으로 기대됩니다.`,
    author: '박정우',
    date: '13시간 전',
    category: '기술',
    thumbnail: '/images/articles/quantum_computer.png',
  },
  {
    id: 4,
    title: '그래핀 기반 해수 담수화 막, 물 위기의 해답?',
    excerpt: '그래핀 산화물 기반의 새로운 담수화 막이 기존 기술보다 효율이 10배 높다는 연구 결과가 발표되었습니다.',
    fullContent: `그래핀 산화물 기반의 새로운 담수화 막이 기존 기술보다 효율이 10배 높다는 연구 결과가 발표되었습니다.\n\n맨체스터 대학교 연구팀이 개발한 이 그래핀 막은 나노미터 수준의 미세한 구멍을 통해 물 분자만 선택적으로 통과시킵니다.\n\n기존 역삼투(RO) 방식에 비해 에너지 소비가 대폭 줄어 경제적이며, 막의 수명도 3배 이상 길어 유지비용 절감이 가능합니다.\n\n현재 전 세계 인구의 약 26%가 안전한 식수에 접근하지 못하고 있으며, 이번 기술은 물 위기 해결의 핵심이 될 것으로 기대됩니다.`,
    author: '최윤진',
    date: '1일 전',
    category: '기술',
    thumbnail: '/images/articles/graphene_water.png',
  },
  {
    id: 5,
    title: 'GPT-5 등장: AI가 과학 연구를 직접 수행하는 시대',
    excerpt: '인공지능이 실험 설계부터 논문 작성까지 독립적으로 수행할 수 있는 수준에 도달했습니다.',
    fullContent: `인공지능이 실험 설계부터 논문 작성까지 독립적으로 수행할 수 있는 수준에 도달했습니다.\n\nOpenAI가 공개한 GPT-5는 과학 논문을 읽고 가설을 세우며, 실험을 설계하고 데이터를 분석하는 것까지 가능합니다.\n\n이미 화학, 재료과학 분야에서 GPT-5가 설계한 실험이 새로운 촉매 물질 발견으로 이어진 사례가 보고되었습니다.\n\n과학계에서는 이를 "과학 연구의 패러다임을 바꿀 혁명"이라 평가하면서도, 연구 윤리와 AI 생성 논문의 신뢰성 문제를 동시에 제기하고 있습니다.`,
    author: '정세훈',
    date: '1일 전',
    category: '기술',
    thumbnail: '/images/articles/ai_research.png',
  },
  {
    id: 6,
    title: '화성 토양에서 발견된 유기물, 생명체 흔적일까',
    excerpt: '퍼서비어런스 로버가 화성 예제로 크레이터에서 복잡한 유기 분자를 검출했습니다.',
    fullContent: `퍼서비어런스 로버가 화성 예제로 크레이터에서 복잡한 유기 분자를 검출했습니다.\n\nNASA의 화성 탐사 로버 퍼서비어런스가 예제로 크레이터 내 고대 삼각주 지역에서 다양한 유기 분자를 발견했습니다.\n\n발견된 유기물에는 방향족 탄화수소와 지방족 탄화수소가 포함되어 있으며, 이는 과거 생명체의 흔적일 가능성이 제기됩니다.\n\n다만 연구팀은 "유기물의 존재가 반드시 생명체를 의미하는 것은 아니며, 비생물학적 과정으로도 형성될 수 있다"고 신중한 입장을 밝혔습니다.`,
    author: '이수아',
    date: '2일 전',
    category: '우주',
    thumbnail: '/images/articles/mars_rover.png',
  },
  {
    id: 7,
    title: '인류의 달 귀환: 아르테미스 3호의 도전과 과제',
    excerpt: 'NASA의 아르테미스 3호가 50년 만의 유인 달 착륙을 준비하고 있습니다.',
    fullContent: `NASA의 아르테미스 3호가 50년 만의 유인 달 착륙을 준비하고 있습니다.\n\n이번 미션에서는 최초로 여성 우주인이 달 표면에 발을 디딜 예정입니다.\n\n달 남극의 영구 그림자 지역에서 물 얼음을 탐사하는 것이 핵심 목표 중 하나입니다.\n\n아르테미스 프로그램은 단순한 달 방문이 아닌, 지속 가능한 달 기지 건설과 화성 탐사를 위한 전초기지 확보를 목표로 합니다.`,
    author: '박정우',
    date: '3일 전',
    category: '우주',
    thumbnail: '/images/articles/space_galaxy.png',
  },
];

export default function MagazineGrid({ onArticleClick }) {
  // 레이아웃 배분: 좌측 2개, 중앙 1개(히어로), 우측 4개
  const heroArticle = ALL_ARTICLES[0];
  const sideLeftArticles = ALL_ARTICLES.slice(1, 3);
  const trendingArticles = ALL_ARTICLES.slice(3, 7);

  return (
    <section className="kq-section" id="magazine-section">
      {/* 헤더 */}
      <div className="kq-header">
        <h2 className="kq-header__title">Brain Pick</h2>
        <p className="kq-header__sub">과학은 세상을 보는 창</p>
      </div>

      {/* ── Atlantic 스타일 3-칼럼 ── */}
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
              <span className="atlantic-side-article__author">{a.author} · {a.date}</span>
            </article>
          ))}
        </aside>

        {/* 중앙: 히어로 기사 1개 */}
        <section className="atlantic-center" onClick={() => onArticleClick?.(heroArticle)}>
          <div className="atlantic-hero-img">
            <img src={heroArticle.thumbnail} alt={heroArticle.title} />
          </div>
          <p className="atlantic-hero-caption">Finch Science Lab</p>
          <h1 className="atlantic-hero-title">{heroArticle.title}</h1>
          <p className="atlantic-hero-excerpt">{heroArticle.excerpt}</p>
          <p className="atlantic-hero-author">{heroArticle.author}</p>
        </section>

        {/* 우측: 트렌딩 기사 4개 + 뉴스레터 */}
        <aside className="atlantic-side-right">
          {trendingArticles.map((a) => (
            <div
              key={a.id}
              className="atlantic-trending-item"
              onClick={() => onArticleClick?.(a)}
            >
              <div className="atlantic-trending-body">
                <h4 className="atlantic-trending-title">{a.title}</h4>
                <span className="atlantic-trending-author">{a.author} · {a.date}</span>
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
    </section>
  );
}
