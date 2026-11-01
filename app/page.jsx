import Link from 'next/link';
import SectionHead from '../src/components/site/SectionHead';
import VideoCollection from '../src/components/works/VideoCollection';
import { IconArrowRight, IconArrowUpRight, IconYouTube } from '../src/components/site/Icons';
import { getLatestVideos } from '../src/lib/youtube';
import { FEATURED_VIDEOS } from '../src/data/works';
import { CHAPTERS, CHAPTER_ORDER } from '../src/data/chapters';
import { HOME_COPY } from '../src/data/profile';
import { CHANNEL } from '../src/data/site';

// 영상 RSS 는 1시간 캐시
export const revalidate = 3600;

const LATEST_COUNT = 4;

// 홈은 문장 하나, 메뉴별 그림 카드, 최신 영상만 둔다.
// 인물 정보(검색엔진용, 사진 포함)는 About Me 페이지에 둔다.
export default async function HomePage() {
  const latest = await getLatestVideos(LATEST_COUNT);
  const videos = latest.length ? latest : FEATURED_VIDEOS.slice(0, LATEST_COUNT);

  return (
    <>
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="container">
          <h1 className="home-hero__title" id="hero-title">
            {HOME_COPY.title} <em>{HOME_COPY.accent}</em>
          </h1>
          <div className="home-hero__foot">
            <p className="home-hero__who">{HOME_COPY.who}</p>
            <ul className="home-hero__links">
              <li>
                <a className="btn" href={CHANNEL.url} target="_blank" rel="noopener noreferrer">
                  <IconYouTube /> 유튜브 채널
                </a>
              </li>
              <li>
                <a className="btn btn--outline" href={CHANNEL.membershipUrl} target="_blank" rel="noopener noreferrer">
                  채널 멤버십 <IconArrowUpRight />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <nav className="chapter-row" aria-label="메뉴">
        {CHAPTER_ORDER.map((key, i) => {
          const c = CHAPTERS[key];
          return (
            <Link
              key={key}
              href={c.href}
              className="chapter-card"
              data-reveal
              style={{ '--c': c.color, '--ink': c.ink, '--d': `${i * 60}ms` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${c.image}-720.webp`}
                srcSet={`${c.image}-400.webp 400w, ${c.image}-720.webp 720w`}
                sizes="(max-width: 640px) 38vw, (max-width: 1024px) 34vw, 20vw"
                width="720"
                height="720"
                alt=""
              />
              <span className="chapter-card__body">
                <strong>{c.title}</strong>
                <span>{c.label}</span>
                <em>
                  보기 <IconArrowRight />
                </em>
              </span>
            </Link>
          );
        })}
      </nav>

      <section className="section home-recent" aria-labelledby="home-recent-title">
        <div className="container">
          <SectionHead
            id="home-recent-title"
            title={latest.length ? '최신 영상' : '대표 영상'}
            more={{ href: '/works#youtube', label: '영상 더 보기' }}
          />
          <VideoCollection videos={videos} />
        </div>
      </section>
    </>
  );
}
