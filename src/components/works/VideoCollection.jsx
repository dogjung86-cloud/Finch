'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import YtThumb from './YtThumb';
import { IconClose, IconPlay, IconYouTube } from '../site/Icons';
import { ytWatchUrl } from '../../lib/youtube';
import { formatDate, formatViews, timeAgo } from '../../lib/format';

function metaLine(video) {
  const parts = [];
  if (video.published) parts.push(timeAgo(video.published));
  else if (video.date) parts.push(formatDate(video.date));
  if (video.views) parts.push(formatViews(video.views));
  return parts.join(' · ');
}

export function VideoCard({ video, onOpen }) {
  const handleClick = (e) => {
    if (!onOpen || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onOpen(video);
  };
  const meta = metaLine(video);
  return (
    <a href={ytWatchUrl(video.id)} target="_blank" rel="noopener noreferrer" className="vcard" onClick={handleClick}>
      <span className="vcard__thumb">
        <YtThumb id={video.id} quality="max" />
        <span className="vcard__play" aria-hidden="true">
          <IconPlay />
        </span>
      </span>
      <span className="vcard__body">
        {video.kicker && <span className="vcard__kicker">{video.kicker}</span>}
        <span className="vcard__title">{video.title}</span>
        {/* "3시간 전" 같은 글자는 서버에서 만든 시점과 달라질 수 있으므로 어긋나도 경고하지 않는다 */}
        {meta && (
          <span className="vcard__meta" suppressHydrationWarning>
            {meta}
          </span>
        )}
      </span>
    </a>
  );
}

export function VideoModal({ video, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="vmodal" role="dialog" aria-modal="true" aria-label={video.title}>
      <div className="vmodal__backdrop" onClick={onClose} />
      <div className="vmodal__panel">
        <div className="vmodal__frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="vmodal__bar">
          <p className="vmodal__title">{video.title}</p>
          <a className="btn btn--light btn--sm" href={ytWatchUrl(video.id)} target="_blank" rel="noopener noreferrer">
            <IconYouTube /> 유튜브에서 보기
          </a>
          <button ref={closeRef} type="button" className="btn btn--ghost-light btn--sm" onClick={onClose}>
            <IconClose /> 닫기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// 영상 격자. 카드를 누르면 사이트 안에서 바로 재생한다.
// limit 을 주면 그 편수만 먼저 보여 주고 나머지는 더보기 버튼으로 펼친다.
export default function VideoCollection({ videos, limit }) {
  const [active, setActive] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const gridRef = useRef(null);
  const close = useCallback(() => setActive(null), []);

  if (!videos || videos.length === 0) return null;

  const hasMore = Boolean(limit) && videos.length > limit;
  const visible = hasMore && !expanded ? videos.slice(0, limit) : videos;

  const toggle = () => {
    // 긴 목록을 접을 때 화면이 아래로 튀지 않도록 목록 첫 줄로 올려 준다
    if (expanded) gridRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    setExpanded((v) => !v);
  };

  return (
    <>
      <ul ref={gridRef} className="video-grid">
        {visible.map((v, i) => (
          <li key={v.id} data-reveal style={{ '--d': `${(i % 3) * 70}ms` }}>
            <VideoCard video={v} onOpen={setActive} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="video-more">
          {/* data-limit 은 미리보기 사본(scripts/preview-runtime.js)이 읽는다 */}
          <button type="button" className="btn btn--outline" aria-expanded={expanded} data-limit={limit} onClick={toggle}>
            {expanded ? '접기' : `더보기 (${videos.length - limit}편)`}
          </button>
        </div>
      )}
      {active && <VideoModal video={active} onClose={close} />}
    </>
  );
}
