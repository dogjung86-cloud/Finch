import Link from 'next/link';
import HeroMedia from '../src/components/home/HeroMedia';
import SectionHead from '../src/components/site/SectionHead';
import VideoCollection from '../src/components/works/VideoCollection';
import BookCard from '../src/components/works/BookCard';
import ArticleCard from '../src/components/articles/ArticleCard';
import { GameFeature } from '../src/components/games/GameCards';
import { IconArrowRight } from '../src/components/site/Icons';
import { getLatestVideos } from '../src/lib/youtube';
import { getCuratedColumns, getHistoryItems } from '../src/lib/content';
import { BOOKS, FEATURED_VIDEOS } from '../src/data/works';
import { LIVE_GAMES } from '../src/data/games';
import { HOME_COPY, INTRO } from '../src/data/profile';
import { CHANNEL, HERO_HAS_MEDIA, HERO_MEDIA } from '../src/data/site';

// 기사 목록이 바뀌면 1분 안에 반영 (영상 RSS 자체는 1시간 캐시)
export const revalidate = 60;

// 문구 끝의 강조 낱말(예: '창')만 주황색으로 감싼다
function withAccent(line, accent) {
  if (!accent || !line.endsWith(accent)) return line;
  return (
    <>
      {line.slice(0, -accent.length)}
      <em className="hero__accent">{accent}</em>
    </>
  );
}

export default async function HomePage() {
  const [latest, columns, history] = await Promise.all([
    getLatestVideos(6),
    getCuratedColumns(2),
    getHistoryItems(1),
  ]);
  const videos = latest.length ? latest : FEATURED_VIDEOS.slice(0, 6);
  const articles = [...columns, ...history];
  const game = LIVE_GAMES[0];

  const stats = [
    { value: CHANNEL.subscribers, label: '구독자' },
    { value: CHANNEL.totalViews, label: '누적 조회수' },
    { value: `${BOOKS.length}권`, label: '쓴 책' },
    { value: `${LIVE_GAMES.length}개`, label: '만든 게임' },
  ].filter((s) => s.value);

  // 인물 정보(검색엔진용, 사진 포함)는 About Me 페이지에 둔다
  return (
    <>
      {/* ── 첫 화면: 배경 영상이 없으면 흰 바탕에 문구만 크게 ── */}
      <section className={`hero ${HERO_HAS_MEDIA ? 'hero--media' : 'hero--plain'}`} aria-labelledby="hero-title">
        {HERO_HAS_MEDIA && <HeroMedia media={HERO_MEDIA} />}
        <div className="container hero__content">
          <p className="hero__eyebrow">{HOME_COPY.eyebrow}</p>
          <h1 className="hero__title" id="hero-title">
            {HOME_COPY.titleLines.map((line) => (
              <span key={line}>{withAccent(line, HOME_COPY.accent)}</span>
            ))}
          </h1>
          <div className="hero__foot">
            <p className="hero__lead">{HOME_COPY.lead}</p>
            <div className="hero__actions">
              <Link href="/works" className={`btn btn--lg${HERO_HAS_MEDIA ? ' btn--light' : ''}`}>
                최신 영상 보기
              </Link>
              <Link href="/collaborate" className={`btn btn--lg ${HERO_HAS_MEDIA ? 'btn--ghost-light' : 'btn--outline'}`}>
                협업 문의
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 인사: 본인 사진은 About Me 페이지에서만 보여 준다 ── */}
      <section className="section intro" aria-labelledby="intro-title">
        <div className="container intro__grid">
          <div className="intro__head" data-reveal>
            <p className="eyebrow">Hello!</p>
            <h2 className="intro__title" id="intro-title">
              {INTRO.titleLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
          </div>
          <div className="intro__text" data-reveal style={{ '--d': '100ms' }}>
            {INTRO.paragraphs.map((p) => (
              <p key={p.slice(0, 12)} className="intro__p">
                {p}
              </p>
            ))}
            <dl className="stats">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
            <Link href="/about" className="text-link">
              더 알아보기 <IconArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 영상 ── */}
      <section className="section section--soft home-videos" aria-labelledby="home-videos-title">
        <div className="container">
          <SectionHead
            eyebrow="YouTube"
            id="home-videos-title"
            title={latest.length ? '최신 영상' : '대표 영상'}
            more={{ href: '/works#youtube', label: '영상 더 보기' }}
          />
          <VideoCollection videos={videos} />
        </div>
      </section>

      {/* ── 책 ── */}
      {BOOKS.length > 0 && (
        <section className="section" aria-labelledby="home-books-title">
          <div className="container">
            <SectionHead eyebrow="Books" id="home-books-title" title="쓴 책" more={{ href: '/works#books', label: '책 소개 보기' }} />
            <div className="book-row">
              {BOOKS.map((book, i) => (
                <div key={book.slug} data-reveal style={{ '--d': `${i * 80}ms` }}>
                  <BookCard book={book} variant="compact" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 게임 ── */}
      {game && (
        <section className="section section--soft" aria-labelledby="home-games-title">
          <div className="container">
            <SectionHead eyebrow="Games" id="home-games-title" title="게임으로 만나는 과학" more={{ href: '/games', label: '게임 전체 보기' }} />
            <div data-reveal>
              <GameFeature game={game} />
            </div>
          </div>
        </section>
      )}

      {/* ── 칼럼 ── */}
      {articles.length > 0 && (
        <section className="section" aria-labelledby="home-articles-title">
          <div className="container">
            <SectionHead eyebrow="Article" id="home-articles-title" title="과학 칼럼" more={{ href: '/articles', label: '칼럼 전체 보기' }} />
            <div className="article-grid">
              {articles.map((item, i) => (
                <div key={item.key} data-reveal style={{ '--d': `${i * 80}ms` }}>
                  <ArticleCard item={item} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 협업 ── */}
      <section className="section" aria-labelledby="home-collab-title">
        <div className="container">
          <div className="cta-box" data-reveal>
            <p className="eyebrow">Collaborate</p>
            <h2 className="cta-box__title" id="home-collab-title">
              함께 만들고 싶은 이야기가 있나요?
            </h2>
            <p className="cta-box__text">강연, 방송 출연, 콘텐츠 협업, 자문, 출판 제안을 기다립니다.</p>
            <Link href="/collaborate" className="btn btn--lg">
              협업 문의하기 <IconArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
