import PageHead from '../../src/components/site/PageHead';
import { GameFeature, GameLabCard } from '../../src/components/games/GameCards';
import { GAMES } from '../../src/data/games';
import { SITE } from '../../src/data/site';

export const metadata = {
  title: 'Games',
  description: '과학드림이 직접 만든 캐주얼 과학 게임. 진화를 주제로 한 3D 비행 게임 Fly Darwin을 바로 플레이해 보세요.',
  alternates: { canonical: '/games' },
  openGraph: {
    title: 'Games | 과학드림',
    description: '과학적 상상력을 더한 캐주얼 게임',
    url: `${SITE.url}/games`,
    type: 'website',
    images: [{ url: '/images/games/fly-darwin-cover-1600.webp', width: 1600, height: 786, alt: 'Fly Darwin' }],
  },
};

export default function GamesPage() {
  const live = GAMES.filter((g) => g.status === 'live');
  const lab = GAMES.filter((g) => g.status === 'lab');

  return (
    <>
      <PageHead
        chapter="games"
        title="게임으로 만나는 과학"
        lead="과학적 상상력을 더한 게임을 만듭니다. 누구나 쉽게 조작하고, 가볍게 플레이할 수 있는 게임들로 채워 나갈게요."
      />

      <section className="section games-page" aria-label="게임 목록">
        <div className="container">
          <ul className="games-list">
            {live.map((game) => (
              <li key={game.slug} data-reveal>
                <GameFeature game={game} headingLevel={2} />
              </li>
            ))}
          </ul>

          {lab.length > 0 && (
            <div className="games-lab">
              <h2 className="games-lab__title">준비 중인 게임</h2>
              <ul className="glab-grid">
                {lab.map((game, i) => (
                  <li key={`${game.title}-${i}`} data-reveal style={{ '--d': `${i * 80}ms` }}>
                    <GameLabCard game={game} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
