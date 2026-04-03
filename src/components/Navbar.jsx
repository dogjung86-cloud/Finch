import { useState, useEffect, useRef } from 'react';

const MENU_ITEMS = [
  { id: 'home', label: '홈' },
  { id: 'games', label: 'Play Lab' },
  { id: 'magazine', label: 'The Finch' },
  { id: 'about', label: 'About' },
];

export default function Navbar({ activeSection, onSectionChange, user, onLoginClick, onSignupClick, onLogout, onAdminClick, isAdmin, onDeleteAccount }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__logo" onClick={() => onSectionChange('home')}>
        <span className="navbar__logo-icon">🐦</span>
        <span className="navbar__logo-text">Finch</span>
      </div>

      <ul className="navbar__menu">
        {MENU_ITEMS.map((item) => (
          <li
            key={item.id}
            className={`navbar__menu-item ${activeSection === item.id ? 'navbar__menu-item--active' : ''}`}
            onClick={() => onSectionChange(item.id)}
          >
            {item.label}
          </li>
        ))}
      </ul>

      <div className="navbar__right">
        {user ? (
          <div className="navbar__user-area" ref={dropdownRef}>
            <div className="navbar__user-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {user.avatar ? (
                <img className="navbar__user-avatar-img" src={user.avatar} alt={user.name} />
              ) : (
                <div className="navbar__user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="navbar__user-name">{user.name}</span>
              <svg className={`navbar__chevron ${menuOpen ? 'navbar__chevron--open' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {menuOpen && (
              <div className="navbar__dropdown">
                {isAdmin && (
                  <button className="navbar__dropdown-item" onClick={() => { setMenuOpen(false); onAdminClick(); }}>
                    ✏️ 기사 관리
                  </button>
                )}
                <button className="navbar__dropdown-item" onClick={() => { setMenuOpen(false); onLogout(); }}>
                  로그아웃
                </button>
                <div className="navbar__dropdown-divider" />
                <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={() => { setMenuOpen(false); onDeleteAccount(); }}>
                  회원 탈퇴
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="navbar__login-btn" onClick={onLoginClick}>
            로그인
          </button>
        )}
      </div>
    </nav>
  );
}
