'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        {/* 상단: 링크 */}
        <div className="footer__top">
          <div className="footer__brand">
            <img className="footer__logo" src="/images/favicon/favicon-32x32.png" alt="Finch" style={{width:'20px',height:'20px'}} />
            <span className="footer__brand-name">Finch</span>
          </div>
          <ul className="footer__links">
            <li><Link className="footer__link" href="/terms">이용약관</Link></li>
            <li><Link className="footer__link footer__link--bold" href="/privacy">개인정보처리방침</Link></li>
            <li><a className="footer__link" href="mailto:sciencegive@gmail.com">문의하기</a></li>
          </ul>
        </div>

        <div className="footer__divider" />

        {/* 하단: 사업자 정보 */}
        <div className="footer__bottom">
          <div className="footer__business">
            <p>과학드림 | 대표: 김정훈</p>
            <p>사업자등록번호: 105-26-94462</p>
            <p>주소: 경기도 시흥시 능곡번영길 30, 7층 710-4</p>
            <p>이메일: sciencegive@gmail.com</p>
          </div>
          <p className="footer__copyright">
            © {new Date().getFullYear()} Finch. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
