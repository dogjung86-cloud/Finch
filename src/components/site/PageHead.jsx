import { CHAPTERS } from '../../data/chapters';

// 메뉴 페이지 공통 머리: 메뉴 색 띠에 그림, 큰 제목, 소개 문장
export default function PageHead({ chapter, eyebrow, title, lead, children }) {
  const c = CHAPTERS[chapter];
  return (
    <header className="container page-band-wrap">
      <div className="page-band" style={{ '--c': c.color, '--ink': c.ink }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="page-band__img"
          src={`${c.image}-720.webp`}
          srcSet={`${c.image}-400.webp 400w, ${c.image}-720.webp 720w`}
          sizes="(max-width: 640px) 34vw, 330px"
          width="720"
          height="720"
          alt=""
        />
        <div className="page-band__text">
          <p className="page-band__eyebrow">{eyebrow || c.title}</p>
          <h1 className="page-band__title">{title}</h1>
          {lead && <p className="page-band__lead">{lead}</p>}
          {children}
        </div>
      </div>
    </header>
  );
}
