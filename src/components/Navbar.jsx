import { useState, useEffect } from 'react';

const MENU_ITEMS = [
  { id: 'home', label: '홈' },
  { id: 'games', label: 'Play Lab' },
  { id: 'magazine', label: 'The Finch' },
  { id: 'about', label: 'About' },
];

export default function Navbar({ activeSection, onSectionChange, user, onLoginClick, onSignupClick, onLogout, onAdminClick, isAdmin }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          <div className="navbar__user-area">
            {isAdmin && (
              <button className="navbar__admin-btn" onClick={onAdminClick} title="기사 관리">
                ✏️
              </button>
            )}
            {user.avatar ? (
              <img className="navbar__user-avatar-img" src={user.avatar} alt={user.name} />
            ) : (
              <div className="navbar__user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="navbar__user-name">{user.name}</span>
            <button className="navbar__logout-btn" onClick={onLogout}>로그아웃</button>
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
