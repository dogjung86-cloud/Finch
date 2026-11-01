import Link from 'next/link';
import { NAV, CHANNEL, BUSINESS, SITE, SOCIALS } from '../../data/site';
import { IconArrowUpRight } from './Icons';

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container site-footer__top">
        <div className="site-footer__brand">
          <p className="site-footer__word">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/brand/sciencedream-logo-128.webp" alt="" width="30" height="33" />
            과학드림
          </p>
          <p className="site-footer__line">과학은 세상을 보는 창</p>
          <Link href="/collaborate" className="btn btn--sm">
            협업 문의하기
          </Link>
        </div>

        <nav className="site-footer__col" aria-label="사이트 메뉴">
          <h2 className="site-footer__head">Menu</h2>
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer__col">
          <h2 className="site-footer__head">Channel</h2>
          <ul>
            {SOCIALS.map((s) => (
              <li key={s.id}>
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label} <IconArrowUpRight width={13} height={13} />
                </a>
              </li>
            ))}
            <li>
              <a href={CHANNEL.membershipUrl} target="_blank" rel="noopener noreferrer">
                채널 멤버십 <IconArrowUpRight width={13} height={13} />
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container site-footer__legal">
        <ul className="site-footer__policies">
          <li>
            <Link href="/terms">이용약관</Link>
          </li>
          <li>
            <Link href="/privacy">
              <strong>개인정보처리방침</strong>
            </Link>
          </li>
        </ul>
        <p className="site-footer__biz">
          <span>상호 {BUSINESS.name}</span>
          <span>대표 {BUSINESS.ceo}</span>
          <span>사업자등록번호 {BUSINESS.regNo}</span>
          <span>주소 {BUSINESS.address}</span>
          <span>이메일 {BUSINESS.email}</span>
        </p>
        {/* 새해가 되면 미리 만들어 둔 페이지의 연도와 잠시 달라질 수 있다 */}
        <p suppressHydrationWarning>
          © {year} {SITE.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
