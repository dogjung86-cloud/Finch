export default function Footer({ onNavigate }) {
  const handleClick = (page) => {
    if (onNavigate) {
      onNavigate(page);
      window.scrollTo(0, 0);
    }
  };

  return (
    <footer className="footer">
      <div className="footer__inner">
        {/* 상단: 링크 */}
        <div className="footer__top">
          <div className="footer__brand">
            <span className="footer__logo">🐦</span>
            <span className="footer__brand-name">Finch</span>
          </div>
          <ul className="footer__links">
            <li><a className="footer__link" onClick={() => handleClick('terms')}>이용약관</a></li>
            <li><a className="footer__link footer__link--bold" onClick={() => handleClick('privacy')}>개인정보처리방침</a></li>
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
