import { useState, useMemo } from 'react';

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'space', label: '우주' },
  { id: 'bio', label: '생물' },
  { id: 'physics', label: '물리' },
  { id: 'chem', label: '화학' },
  { id: 'tech', label: '기술' },
];

const DUMMY_ARTICLES = [
  {
    id: 1,
    title: '제임스 웹 망원경이 포착한 가장 먼 은하의 비밀',
    excerpt: 'NASA의 제임스 웹 우주 망원경이 빅뱅 직후 형성된 것으로 보이는 초기 은하를 발견했습니다. 이 발견은 우주 초기 구조 형성에 대한 기존 이론을 근본적으로 뒤흔들 수 있습니다.',
    category: 'space',
    author: '이수아',
    date: '2시간 전',
    featured: true,
  },
  {
    id: 2,
    title: 'CRISPR 유전자 편집, 유전 질환 치료의 새 시대를 열다',
    excerpt: 'CRISPR-Cas9 기반의 유전자 치료가 겸상적혈구병 환자에게 최초로 승인되며, 유전 질환 치료의 패러다임이 바뀌고 있습니다.',
    category: 'bio',
    author: '김진호',
    date: '7시간 전',
  },
  {
    id: 3,
    title: '양자 컴퓨터, 1000큐비트 시대 돌입',
    excerpt: 'IBM과 Google이 양자 오류 정정 기술에서 획기적인 발전을 이루었습니다.',
    category: 'physics',
    author: '박정우',
    date: '13시간 전',
  },
  {
    id: 4,
    title: '그래핀 기반 해수 담수화 막, 물 위기의 해답?',
    excerpt: '새로운 그래핀 산화물 멤브레인이 기존 역삼투압 방식보다 3배 높은 효율을 보여줍니다.',
    category: 'chem',
    author: '최윤진',
    date: '1일 전',
  },
  {
    id: 5,
    title: 'GPT-5 등장: AI가 과학 연구를 직접 수행하는 시대',
    excerpt: 'OpenAI의 새로운 모델은 논문을 읽고, 가설을 세우며, 실험을 설계하는 능력을 보여주었습니다.',
    category: 'tech',
    author: '정세훈',
    date: '1일 전',
  },
  {
    id: 6,
    title: '화성 토양에서 발견된 유기물, 생명체 흔적일까',
    excerpt: '퍼시비어런스 로버가 채취한 화성 토양 샘플에서 예상치 못한 유기 화합물이 검출되었습니다.',
    category: 'space',
    author: '이수아',
    date: '2일 전',
  },
];

/* 카테고리 별 그라디언트 */
const catGradients = {
  space: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  bio:   'linear-gradient(135deg, #134e5e, #71b280)',
  physics: 'linear-gradient(135deg, #2c003e, #512b58, #7b4397)',
  chem:  'linear-gradient(135deg, #3a1c71, #d76d77, #ffaf7b)',
  tech:  'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
};
const catIcons = {
  space: '🪐', bio: '🧬', physics: '⚛️', chem: '🧪', tech: '🤖',
};

export default function MagazineGrid() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return DUMMY_ARTICLES;
    return DUMMY_ARTICLES.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  const hero = filtered[0];
  const leftArticles = filtered.slice(1, 4);
  const rightCards = filtered.slice(4);

  return (
    <section className="rs-magazine" id="magazine-section">
      {/* 카테고리 필터 */}
      <div className="rs-magazine__header">
        <h2 className="rs-magazine__title">매거진</h2>
        <div className="rs-magazine__filters">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`rs-filter ${activeCategory === cat.id ? 'rs-filter--active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Rolling Stone 3-Column Layout ─── */}
      <div className="rs-grid">
        {/* ▌ LEFT — 텍스트 리스트 + 소형 썸네일 */}
        <div className="rs-left">
          {leftArticles.map((article, i) => (
            <article className="rs-text-item" key={article.id}>
              {i === 0 && (
                <div
                  className="rs-text-item__thumb"
                  style={{ background: catGradients[article.category] }}
                >
                  <span className="rs-text-item__thumb-icon">{catIcons[article.category]}</span>
                </div>
              )}
              <div className="rs-text-item__body">
                <h3 className="rs-text-item__title">{article.title}</h3>
                <p className="rs-text-item__excerpt">{article.excerpt}</p>
                <p className="rs-text-item__meta">
                  By <strong>{article.author}</strong> · {article.date}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* ▌ CENTER — 대형 피처 기사 */}
        {hero && (
          <article className="rs-hero">
            <div
              className="rs-hero__img"
              style={{ background: catGradients[hero.category] }}
            >
              <span className="rs-hero__icon">{catIcons[hero.category]}</span>
            </div>
            <div className="rs-hero__overlay">
              <span className="rs-hero__cat">
                {CATEGORIES.find((c) => c.id === hero.category)?.label}
              </span>
              <h2 className="rs-hero__title">{hero.title}</h2>
              <p className="rs-hero__excerpt">{hero.excerpt}</p>
              <p className="rs-hero__meta">By {hero.author} – {hero.date}</p>
            </div>
          </article>
        )}

        {/* ▌ RIGHT — 소형 이미지 카드 스택 */}
        <div className="rs-right">
          {rightCards.map((article) => (
            <article className="rs-card" key={article.id}>
              <div
                className="rs-card__img"
                style={{ background: catGradients[article.category] }}
              >
                <span className="rs-card__img-icon">{catIcons[article.category]}</span>
              </div>
              <div className="rs-card__body">
                <span className="rs-card__cat">
                  {CATEGORIES.find((c) => c.id === article.category)?.label}
                </span>
                <h3 className="rs-card__title">{article.title}</h3>
                <p className="rs-card__meta">By {article.author}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
