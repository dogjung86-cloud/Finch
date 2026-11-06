import PageHead from '../../src/components/site/PageHead';
import SectionHead from '../../src/components/site/SectionHead';
import VideoCollection from '../../src/components/works/VideoCollection';
import BookCard from '../../src/components/works/BookCard';
import { IconYouTube, IconArrowUpRight } from '../../src/components/site/Icons';
import { getLatestVideos } from '../../src/lib/youtube';
import { APPEARANCES, APPEARANCE_GROUPS, BOOKS, FEATURED_VIDEOS } from '../../src/data/works';
import { CHANNEL, OG_IMAGE, SITE } from '../../src/data/site';

export const revalidate = 3600;

export const metadata = {
  title: 'Works',
  description: '과학드림 유튜브 영상, 김정훈이 쓴 책, 방송과 다른 채널 출연 영상을 한곳에 모았습니다.',
  alternates: { canonical: '/works' },
  openGraph: {
    title: 'Works | 과학드림',
    description: '과학드림의 영상, 책, 출연작 모음',
    url: `${SITE.url}/works`,
    type: 'website',
    images: [OG_IMAGE],
  },
};

// 출연 영상은 기관마다 한 줄만 먼저 보여 주고 나머지는 더보기로 펼친다
const APPEARANCE_PREVIEW = 3;

function AppearanceGroup({ org, program, desc, playlist, videos }) {
  return (
    <div className="org-group">
      <header className="org-head" data-reveal>
        <div>
          <h3 className="org-head__name">{org}</h3>
          {program && (
            <p className="org-head__program">
              {program} <span>· {videos.length}편</span>
            </p>
          )}
          {desc && <p className="org-head__desc">{desc}</p>}
        </div>
        {playlist && (
          <a className="text-link" href={`https://www.youtube.com/playlist?list=${playlist}`} target="_blank" rel="noopener noreferrer">
            유튜브 재생목록 <IconArrowUpRight />
          </a>
        )}
      </header>
      <VideoCollection videos={videos} limit={APPEARANCE_PREVIEW} />
    </div>
  );
}

export default async function WorksPage() {
  const latest = await getLatestVideos(9);
  const appearances = APPEARANCES.map((a) => ({ ...a, kicker: a.channel }));

  return (
    <>
      <PageHead chapter="works" title="영상 · 책 · 출연" lead="유튜브에 올린 영상과 직접 쓴 책, 그리고 다른 채널과 방송에 출연한 영상을 모았습니다.">
        <nav className="works-nav" aria-label="Works 바로가기" data-reveal style={{ '--d': '180ms' }}>
          <a href="#youtube">유튜브</a>
          <a href="#books">책</a>
          <a href="#appearances">출연</a>
        </nav>
      </PageHead>

      {/* ── 유튜브 ── */}
      <section id="youtube" className="section works-section" aria-labelledby="works-yt-title">
        <div className="container">
          <div className="channel-row" data-reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="channel-row__logo" src="/images/brand/sciencedream-logo-128.webp" alt="" width="64" height="70" />
            <div className="channel-row__info">
              <p className="channel-row__name">과학드림</p>
              <p className="channel-row__meta">
                {CHANNEL.handle}
                {CHANNEL.subscribers ? ` · 구독자 ${CHANNEL.subscribers}` : ''}
                {CHANNEL.videoCount ? ` · 영상 ${CHANNEL.videoCount}` : ''}
              </p>
            </div>
            <div className="channel-row__actions">
              <a className="btn" href={CHANNEL.subscribeUrl} target="_blank" rel="noopener noreferrer">
                <IconYouTube /> 구독하기
              </a>
              <a className="btn btn--outline" href={CHANNEL.membershipUrl} target="_blank" rel="noopener noreferrer">
                멤버십 <IconArrowUpRight />
              </a>
            </div>
          </div>

          {latest.length > 0 && (
            <>
              <SectionHead
                eyebrow="YouTube"
                id="works-yt-title"
                title="최신 영상"
                more={{ href: CHANNEL.url, label: '채널에서 전체 보기', external: true }}
              />
              <VideoCollection videos={latest} limit={6} />
            </>
          )}

          {FEATURED_VIDEOS.length > 0 && (
            <div className="works-sub">
              <SectionHead eyebrow="Popular" id={latest.length ? undefined : 'works-yt-title'} title="많이 본 영상" />
              <VideoCollection videos={FEATURED_VIDEOS} limit={3} />
            </div>
          )}
        </div>
      </section>

      {/* ── 책 ── */}
      <section id="books" className="section works-section" aria-labelledby="works-books-title">
        <div className="container">
          <SectionHead eyebrow="Books" id="works-books-title" title="쓴 책" />
          {BOOKS.length > 0 ? (
            <div className="book-list">
              {BOOKS.map((book) => (
                <div key={book.slug} data-reveal>
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">책 소개를 준비하고 있어요.</p>
          )}
        </div>
      </section>

      {/* ── 출연 ── */}
      <section id="appearances" className="section works-section" aria-labelledby="works-app-title">
        <div className="container">
          <SectionHead eyebrow="Appearances" id="works-app-title" title="출연한 영상" desc="방송과 여러 기관 채널에 출연한 영상을 기관별로 모았습니다." />
          {APPEARANCE_GROUPS.map((g) => (
            <AppearanceGroup key={g.slug} {...g} />
          ))}
          {appearances.length > 0 && <AppearanceGroup org="그 밖의 출연" videos={appearances} />}
        </div>
      </section>
    </>
  );
}
