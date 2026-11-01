'use client';

import { useEffect, useRef, useState } from 'react';

// 홈 첫 화면 배경 영상. 소리 없이 반복 재생하고, 일시정지 버튼을 단다.
// '동작 줄이기' 설정을 켠 사용자에게는 정지 화면(포스터)만 보여 준다.
export default function HeroMedia({ media }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      v.pause();
      setPlaying(false);
      return;
    }
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => setPlaying(false));
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  if (!media?.video) return null;

  return (
    <>
      <div className="hero__media" aria-hidden="true">
        <video
          ref={videoRef}
          className="hero__bg"
          src={media.video}
          poster={media.poster}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
        />
        <div className="hero__shade" />
      </div>
      <button
        type="button"
        className="hero__toggle"
        onClick={toggle}
        aria-label={playing ? '배경 영상 일시정지' : '배경 영상 재생'}
        title={playing ? '일시정지' : '재생'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path fill="currentColor" d="M8 5.5v13l10.5-6.5z" />
          </svg>
        )}
      </button>
    </>
  );
}
