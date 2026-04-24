import { NextResponse } from 'next/server';

// 과거 Porter 쇼핑몰 사이트의 URL 패턴
// Google 색인에서 영구 제거되도록 410 Gone 응답
const LEGACY_PATH_PATTERNS = [
  /^\/category(\/|$)/,
  /^\/product(\/|$)/,
  /^\/board(\/|$)/,
  /^\/order(\/|$)/,
  /^\/member(\/|$)/,
  /^\/myshop(\/|$)/,
  /^\/main(\/|$)/,
  /^\/shopinfo(\/|$)/,
  /^\/goods(\/|$)/,
  /^\/exec(\/|$)/,
  /\.html$/,
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/codex-uploader') || pathname.startsWith('/codex-upload-')) {
    return NextResponse.next();
  }

  if (LEGACY_PATH_PATTERNS.some((re) => re.test(pathname))) {
    return new NextResponse(
      '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>410 Gone</title></head><body><h1>410 Gone</h1><p>이 페이지는 영구적으로 삭제되었습니다.</p></body></html>',
      {
        status: 410,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/|api/|images/|favicon|sitemap.xml|robots.txt|og-image|app-auth|codex-uploader|codex-upload-).*)',
};
