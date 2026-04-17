import './globals.css';
import AuthProvider from '../src/providers/AuthProvider';
import LayoutShell from '../src/components/LayoutShell';

export const metadata = {
  title: 'Finch – Science Games & Magazine',
  description: 'Finch – 캐주얼 과학 Play Lab과 프리미엄 사이언스 Knowledge Quest가 만나는 곳',
  openGraph: {
    title: 'Finch – Science Games & Magazine',
    description: '과학을 즐기고, 과학을 읽다',
    siteName: 'Finch',
    type: 'website',
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
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,600&family=Inter:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700;900&family=Noto+Serif+KR:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* 다크모드 깜빡임 방지 (head에서 <body>가 그려지기 전 테마 결정) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('finch_theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
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
