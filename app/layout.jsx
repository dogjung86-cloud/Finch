import './globals.css';
import AuthProvider from '../src/providers/AuthProvider';
import LayoutShell from '../src/components/LayoutShell';

export const metadata = {
  metadataBase: new URL('https://www.finch.co.kr'),
  title: '핀치 - 쉽고 재밌는 과학 플랫폼',
  description: '쉽고 재밌는 과학 플랫폼 - 과학 이야기와 과학 게임이 만나는 곳',
  keywords: [
    '과학',
    '과학 매거진',
    '과학 기사',
    '과학 게임',
    '사이언스',
    '100년 전 과학',
    '물리',
    '화학',
    '생물',
    '천문',
    'Finch',
    '핀치',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '핀치 - 쉽고 재밌는 과학 플랫폼',
    description: '쉽고 재밌는 과학 플랫폼 - 과학 이야기와 과학 게임이 만나는 곳',
    url: 'https://www.finch.co.kr',
    siteName: 'Finch',
    type: 'website',
    locale: 'ko_KR',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '핀치 - 쉽고 재밌는 과학 플랫폼',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '핀치 - 쉽고 재밌는 과학 플랫폼',
    description: '쉽고 재밌는 과학 플랫폼 - 과학 이야기와 과학 게임이 만나는 곳',
    images: ['/og-image.jpg'],
  },
  verification: {
    // Google Search Console: DNS TXT 방식으로 확인 완료 (메타태그 불필요)
    other: {
      'naver-site-verification': '36d8fa46c44b3c514db652b2f7cd7b28cc85f07b',
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/favicon/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/images/favicon/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="/images/favicon/favicon-16x16.png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/images/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" href="/images/favicon/favicon-192x192.png" sizes="192x192" />
        <link rel="icon" type="image/png" href="/images/favicon/favicon-512x512.png" sizes="512x512" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,600&family=Inter:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700;900&family=Noto+Serif+KR:wght@400;500;600;700&family=Gowun+Batang:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* 다크모드 깜빡임 방지 (head에서 <body>가 그려지기 전 테마 결정) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('finch_theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        <AuthProvider>
          <LayoutShell>
            {children}
          </LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
