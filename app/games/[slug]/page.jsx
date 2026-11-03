import Link from 'next/link';
import { notFound } from 'next/navigation';
import GamePlayer from '../../../src/components/games/GamePlayer';
import { accessLabel, getGame, LIVE_GAMES } from '../../../src/data/games';
import { SITE } from '../../../src/data/site';
import { IconArrowLeft } from '../../../src/components/site/Icons';

export const dynamicParams = false;

export function generateStaticParams() {
  return LIVE_GAMES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) return { title: '게임을 찾을 수 없습니다' };
  return {
    title: `${game.title} 플레이`,
    description: game.summary,
    alternates: { canonical: `/games/${game.slug}` },
    openGraph: {
      title: `${game.title} | 과학드림 Games`,
      description: game.summary,
      url: `${SITE.url}/games/${game.slug}`,
      type: 'website',
      images: [{ url: game.cover.src, width: game.cover.width, height: game.cover.height, alt: game.title }],
    },
  };
}

export default async function GameDetailPage({ params }) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game || game.status !== 'live') notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.title,
    description: game.summary,
    url: `${SITE.url}/games/${game.slug}`,
    image: `${SITE.url}${game.cover.src}`,
    genre: game.genre,
    gamePlatform: ['Web browser'],
    author: { '@type': 'Person', name: '김정훈 (과학드림)' },
    offers: { '@type': 'Offer', price: game.access?.price || 0, priceCurrency: 'KRW' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="container game-detail">
        <Link href="/games" className="back-link">
          <IconArrowLeft width={16} height={16} /> Games
        </Link>
        <header className="game-detail__head">
          <h1 className="game-detail__title">{game.title}</h1>
          <p className="game-detail__meta">
            <span className="gcard__price">{accessLabel(game.access)}</span>
            {game.genre} · {game.platforms.join(' · ')}
          </p>
        </header>

        <GamePlayer game={game} />
        <p className="game-detail__tip">
          {game.usesLogin || game.cloudSave ? '로그인하면 게임 진행 상황이 저장돼요.' : '기록은 이 브라우저에 저장돼요.'}{' '}
          <Link href="/games#board">게임 의견 남기기</Link>
        </p>

        {game.guide?.length > 0 && (
          <section className="game-guide" aria-labelledby="game-guide-title">
            <h2 className="game-guide__title" id="game-guide-title">
              게임 가이드
            </h2>
            <div className="game-guide__grid">
              {game.guide.map((g) => (
                <article key={g.title} className="guide" data-reveal>
                  <h3 className="guide__title">{g.title}</h3>
                  <ul>
                    {g.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
