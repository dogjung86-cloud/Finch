'use client';

import Image from 'next/image';

const DIRECT_IMAGE_HOSTS = [
  'supabase.co',
];

// next/image가 안전하게 프록시·최적화할 수 있는 호스트.
// (wikimedia 등 hotlink-rate-limit 호스트는 native <img>로 직접 로드해야 안전)
const KNOWN_HOSTS = [
  'lh3.googleusercontent.com',
  'yt3.ggpht.com',
  'images.unsplash.com',
  'live.staticflickr.com',
];

function matchesHost(hostname, host) {
  return hostname === host || hostname.endsWith('.' + host);
}

function isOptimizable(src) {
  if (!src) return false;
  if (src.startsWith('/')) return true;
  try {
    const u = new URL(src);
    if (DIRECT_IMAGE_HOSTS.some((h) => matchesHost(u.hostname, h))) return false;
    return KNOWN_HOSTS.some((h) => matchesHost(u.hostname, h));
  } catch {
    return false;
  }
}

export default function SmartImage({
  src,
  alt = '',
  fill,
  width,
  height,
  sizes,
  style,
  className,
  priority,
  referrerPolicy,
}) {
  if (!src) return null;

  if (!isOptimizable(src)) {
    const fallbackStyle = fill
      ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
      : style;
    return (
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy={referrerPolicy}
        className={className}
        style={fallbackStyle}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      style={style}
      className={className}
      priority={priority}
      referrerPolicy={referrerPolicy}
    />
  );
}
