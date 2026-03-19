export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__brand">
        Finch © {new Date().getFullYear()}
      </div>
      <ul className="footer__links">
        <li className="footer__link">이용약관</li>
        <li className="footer__link">개인정보처리방침</li>
        <li className="footer__link">문의하기</li>
      </ul>
    </footer>
  );
}
