import Link from 'next/link';
import SectionHead from '../../src/components/site/SectionHead';
import { IconArrowRight, IconYouTube } from '../../src/components/site/Icons';
import { ABOUT, BIO } from '../../src/data/profile';
import { CHANNEL, SITE, SOCIALS } from '../../src/data/site';
import { BOOKS } from '../../src/data/works';

export const metadata = {
  title: 'About Me',
  description: '유튜브 과학드림을 만드는 김정훈을 소개합니다. 영상, 책, 강연, 게임으로 과학의 재미를 전합니다.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Me | 과학드림',
    description: '유튜브 과학드림을 만드는 김정훈을 소개합니다.',
    url: `${SITE.url}/about`,
    type: 'profile',
  },
};

// 검색엔진용 인물 정보. 본인 사진은 이 페이지에서만 쓰므로 여기에 둔다
const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: '김정훈',
  alternateName: '과학드림',
  url: `${SITE.url}/about`,
  image: `${SITE.url}/images/me/lecture-portrait-1120.jpg`,
  jobTitle: '과학 유튜버',
  sameAs: SOCIALS.map((s) => s.href),
};

function BioRow({ title, children }) {
  return (
    <div className="bio-row" data-reveal>
      <h3 className="bio-row__title">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function YearList({ items }) {
  return (
    <ul className="bio-list">
      {items.map((item) => (
        <li key={`${item.year}-${item.text}`}>
          <span className="bio-list__year">{item.year}</span>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AboutPage() {
  const { photo, postscript } = ABOUT;
  const books = BOOKS.map((b) => ({ year: String(b.year), text: `『${b.title}』 ${b.publisher}` }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      <section className="about-hero">
        <div className="container about-hero__grid">
          <figure className="about-hero__photo" data-reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              srcSet={photo.srcSet}
              sizes="(max-width: 860px) 90vw, 460px"
              width={photo.width}
              height={photo.height}
              alt={photo.alt}
            />
            <figcaption>{photo.caption}</figcaption>
          </figure>
          <div className="about-hero__text" data-reveal style={{ '--d': '100ms' }}>
            <p className="eyebrow">About Me</p>
            <h1 className="about-hero__title">{ABOUT.title}</h1>
            {ABOUT.paragraphs.map((p) => (
              <p key={p.slice(0, 12)} className="about-hero__p">
                {p}
              </p>
            ))}
            <p className="about-hero__ps">
              {postscript[0]}
              <a href="#bio">{postscript[1]}</a>
              {postscript[2]}
            </p>
            <div className="about-hero__actions">
              <a className="btn" href={CHANNEL.subscribeUrl} target="_blank" rel="noopener noreferrer">
                <IconYouTube /> 채널 구독하기
              </a>
              <Link className="btn btn--outline" href="/collaborate">
                협업 문의
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="bio" className="section about-bio" aria-labelledby="about-bio-title">
        <div className="container container--narrow">
          <SectionHead
            eyebrow="Bio"
            id="about-bio-title"
            title="약력"
            desc="강연 소개나 방송 자막, 보도자료에 필요하시면 그대로 가져다 쓰셔도 됩니다."
          />
          <BioRow title="경력">
            <YearList items={BIO.career} />
          </BioRow>
          <BioRow title="저서">
            <YearList items={books} />
          </BioRow>
          <BioRow title="수상">
            <YearList items={BIO.awards} />
          </BioRow>
          <BioRow title="방송 · 기고">
            <ul className="bio-list bio-list--plain">
              {BIO.media.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <Link className="text-link bio-row__link" href="/works#appearances">
              출연 영상 모아 보기 <IconArrowRight />
            </Link>
          </BioRow>
          <BioRow title="강연">
            <p className="bio-row__lead">{BIO.lectureLead}</p>
            <details className="bio-more">
              <summary>강연 이력 전체 보기</summary>
              <ul className="bio-list">
                {BIO.lectures.map((l) => (
                  <li key={l.year}>
                    <span className="bio-list__year">{l.year}</span>
                    <span>{l.items.join(' · ')}</span>
                  </li>
                ))}
              </ul>
            </details>
          </BioRow>
        </div>
      </section>
    </>
  );
}
