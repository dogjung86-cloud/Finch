import './styles/tokens.css';
import './styles/components.css';
import './styles/chrome.css';
import './styles/home.css';
import './styles/about.css';
import './styles/works.css';
import './styles/games.css';
import './styles/articles.css';
import './styles/collaborate.css';
import './styles/article.css';
import AuthProvider from '../src/providers/AuthProvider';
import LayoutShell from '../src/components/LayoutShell';
import { SITE } from '../src/data/site';

const TITLE = '과학드림 | 과학은 세상을 보는 창';

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: TITLE,
    template: '%s | 과학드림',
  },
  description: SITE.description,
  keywords: [
    '과학드림',
    '김정훈',
    '과학 유튜버',
    '과학 유튜브',
    '진화',
    '고생물',
    '과학 강연',
    '과학 책',
    '과학 게임',
    'Fly Darwin',
    '과학 칼럼',
    'Science Dream',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: TITLE,
    description: SITE.description,
    url: SITE.url,
    siteName: '과학드림',
    type: 'website',
    locale: 'ko_KR',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: '과학드림' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: SITE.description,
    images: ['/og-image.jpg'],
  },
  verification: {
    // Google Search Console: DNS TXT 방식으로 확인 완료 (메타태그 불필요)
    other: {
      'naver-site-verification': '36d8fa46c44b3c514db652b2f7cd7b28cc85f07b',
    },
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#ffffff' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" data-scroll-behavior="smooth" suppressHydrationWarning>
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
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
