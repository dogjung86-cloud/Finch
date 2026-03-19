const POPULAR = [
  { id: 1, title: '제임스 웹 망원경이 포착한 가장 먼 은하의 비밀', category: '우주', views: '12.4K', date: '03.17' },
  { id: 3, title: '양자 컴퓨터, 1000큐비트 시대 돌입', category: '물리', views: '9.8K', date: '03.15' },
  { id: 5, title: 'GPT-5 등장: AI가 과학 연구를 직접 수행하는 시대', category: '기술', views: '8.2K', date: '03.13' },
  { id: 8, title: '핵융합 발전, 상용화까지 10년?', category: '물리', views: '7.5K', date: '03.10' },
  { id: 10, title: '뇌-컴퓨터 인터페이스: Neuralink의 첫 인체 시험 결과', category: '기술', views: '6.9K', date: '03.08' },
];

export default function PopularArticles() {
  return (
    <aside className="sidebar">
      <div className="widget">
        <h3 className="widget__title">
          <span className="widget__title-icon">🔥</span>
          인기 기사
        </h3>

        <ol className="popular-list">
          {POPULAR.map((article, i) => (
            <li key={article.id} className="popular-item">
              <span className={`popular-item__rank popular-item__rank--${i + 1}`}>
                {i + 1}
              </span>
              <div className="popular-item__info">
                <div className="popular-item__title">{article.title}</div>
                <div className="popular-item__meta">
                  <span className="popular-item__cat">{article.category}</span>
                  <span className="popular-item__views">👁 {article.views}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
