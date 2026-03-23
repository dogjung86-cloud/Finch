export default function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-page__container">
        <div className="about-page__hero">
          <span className="about-page__label">ABOUT US</span>
          <h1 className="about-page__title">Finch</h1>
          <p className="about-page__subtitle">
            과학을 즐기고, 과학을 읽다
          </p>
        </div>

        <div className="about-page__content">
          <section className="about-section">
            <h2 className="about-section__title">우리의 미션</h2>
            <p className="about-section__text">
              Finch는 과학을 누구나 쉽고 재미있게 접할 수 있도록 만드는 플랫폼입니다.
              캐주얼 과학 게임과 프리미엄 사이언스 매거진이 만나는 곳,
              그것이 바로 Finch입니다.
            </p>
          </section>

          <div className="about-features">
            <div className="about-feature-card">
              <span className="about-feature-card__icon">🎮</span>
              <h3 className="about-feature-card__title">Play Lab</h3>
              <p className="about-feature-card__desc">
                과학 원리를 기반으로 한 캐주얼 게임으로 과학적 사고를 키워보세요.
                게임을 하면서 포인트를 모으고 레벨업하세요.
              </p>
            </div>
            <div className="about-feature-card">
              <span className="about-feature-card__icon">📰</span>
              <h3 className="about-feature-card__title">The Finch</h3>
              <p className="about-feature-card__desc">
                깊이 있는 과학 기사와 최신 뉴스를 엄선하여 제공합니다.
                우주, 생명과학, 기술 등 다양한 분야를 아우릅니다.
              </p>
            </div>
            <div className="about-feature-card">
              <span className="about-feature-card__icon">🧪</span>
              <h3 className="about-feature-card__title">커뮤니티</h3>
              <p className="about-feature-card__desc">
                과학을 사랑하는 사람들과 의견을 나누세요. 기사에 대한 토론과
                댓글을 통해 더 넓은 시야를 경험하세요.
              </p>
            </div>
          </div>

          <section className="about-section">
            <h2 className="about-section__title">연락처</h2>
            <p className="about-section__text">
              문의 사항이 있으시면 언제든지 <strong>hello@finch.science</strong>로 연락해 주세요.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
