'use client';

import { useEffect, useRef, useState } from 'react';
import { ytThumb } from '../../lib/youtube';

// 고화질 썸네일이 없는 영상도 있어서 max → sd → hq 순서로 내려간다.
const ORDER = ['max', 'sd', 'hq'];

export default function YtThumb({ id, quality = 'hq', alt = '', priority = false }) {
  const start = ORDER.indexOf(quality);
  const [idx, setIdx] = useState(start < 0 ? ORDER.length - 1 : start);
  const ref = useRef(null);

  const next = () => setIdx((i) => (i < ORDER.length - 1 ? i + 1 : i));

  // 하이드레이션 전에 이미 실패한 이미지도 잡아낸다
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0 && img.naturalWidth <= 120) next();
    else if (img && img.complete && img.naturalWidth === 0) next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={ytThumb(id, ORDER[idx])}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={next}
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth <= 120) next();
      }}
    />
  );
}
