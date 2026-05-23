/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'yt3.ggpht.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'live.staticflickr.com' },
    ],
    // Vercel Image Optimization 변환 한도(5K/mo) · 캐시 쓰기(100K/mo) 절약 설정
    // - minimumCacheTTL: 기본 60초 → 30일. 같은 변환이 한 달간 캐시 유지되어 cache writes 폭감
    // - deviceSizes: 기본 8개 → 5개. 828/2048/3840 제거 (4K 디스플레이만 미세 영향)
    // - imageSizes: 기본 8개 → 4개. 작은 아이콘 사이즈 정리
    // - formats: AVIF 제거 → WebP만. 포맷별로 별도 변환되므로 호출 절반
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    formats: ['image/webp'],
  },
};

export default nextConfig;
