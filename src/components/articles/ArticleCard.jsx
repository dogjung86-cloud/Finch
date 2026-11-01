import Link from 'next/link';
import { SERIES } from '../../lib/series';
import { formatDate } from '../../lib/format';

// 아티클 카드. 썸네일은 Vercel 이미지 최적화를 거치지 않고 원본을 바로 쓴다
// (Supabase · 외부 이미지 최적화 사용량 절약 정책과 같은 방식).
export default function ArticleCard({ item, variant = 'grid', priority = false }) {
  const series = SERIES[item.series] || SERIES.column;
  const date = item.dateLabel || formatDate(item.date);
  return (
    <Link href={item.href} className={`acard acard--${variant}`}>
      <span className="acard__thumb">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            referrerPolicy="no-referrer"
            style={{ objectPosition: item.thumbPos || '50% 50%' }}
          />
        ) : (
          <span className="acard__placeholder" aria-hidden="true">
            과학드림
          </span>
        )}
      </span>
      <span className="acard__body">
        <span className="acard__kicker">
          {series.label}
          {item.category ? ` · ${item.category}` : ''}
        </span>
        <span className="acard__title">{item.title}</span>
        {variant !== 'compact' && item.excerpt && <span className="acard__excerpt">{item.excerpt}</span>}
        <span className="acard__meta">
          {date}
          {item.author ? ` · ${item.author}` : ''}
        </span>
      </span>
    </Link>
  );
}
