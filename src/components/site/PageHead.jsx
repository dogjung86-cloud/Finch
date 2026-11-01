// 안쪽 페이지 공통 머리: 작은 영문 라벨 + 큰 제목 + 소개 문장
export default function PageHead({ eyebrow, title, lead, children }) {
  return (
    <header className="page-head container">
      {eyebrow && (
        <p className="eyebrow" data-reveal>
          {eyebrow}
        </p>
      )}
      <h1 className="page-head__title" data-reveal style={{ '--d': '60ms' }}>
        {title}
      </h1>
      {lead && (
        <p className="page-head__lead" data-reveal style={{ '--d': '120ms' }}>
          {lead}
        </p>
      )}
      {children}
    </header>
  );
}
