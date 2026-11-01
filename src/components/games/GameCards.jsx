import Link from 'next/link';
import { accessLabel } from '../../data/games';
import { IconArrowRight } from '../site/Icons';

// 대표 게임 카드
export function GameFeature({ game, headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  const href = `/games/${game.slug}`;
  return (
    <article className="gcard">
      <Link href={href} className="gcard__media" aria-label={`${game.title} 플레이하기`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={game.cover.srcSmall}
          srcSet={`${game.cover.srcSmall} 900w, ${game.cover.src} 1600w`}
          sizes="(max-width: 860px) 100vw, 640px"
          width={game.cover.width}
          height={game.cover.height}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </Link>
      <div className="gcard__body">
        <p className="gcard__meta">
          <span className="gcard__price">{accessLabel(game.access)}</span>
          {game.genre} · {game.platforms.join(' · ')}
        </p>
        <H className="gcard__title">{game.title}</H>
        <p className="gcard__summary">{game.summary}</p>
        <Link className="btn" href={href}>
          플레이하기 <IconArrowRight />
        </Link>
      </div>
    </article>
  );
}

// 개발 중인 게임 자리
export function GameLabCard({ game }) {
  return (
    <article className="glab">
      <p className="glab__title">{game.title}</p>
      <p className="glab__note">{game.note}</p>
    </article>
  );
}
