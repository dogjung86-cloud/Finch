'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SmartImage from './SmartImage';
import { usePathname, useRouter } from 'next/navigation';

const MENU_ITEMS = [
  { id: 'home', label: '홈', href: '/' },
  { id: 'magazine', label: 'The Finch', href: '/#magazine' },
  { id: 'games', label: 'Play Lab', href: '/#games' },
  { id: 'about', label: 'About', href: '/about' },
];

export default function Navbar({ user, onLoginClick, onLogout, isAdmin, onDeleteAccount }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') || 'light');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('finch_theme', next); } catch {}
  };

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

  const handleMenuClick = (item) => {
    if (item.id === 'home' || item.id === 'games' || item.id === 'magazine') {
      if (pathname === '/') {
        // 홈 페이지에서는 스크롤
        const sectionId = item.id === 'home' ? 'hero-game' : item.id === 'games' ? 'game-carousel' : 'magazine-section';
        const el = document.getElementById(sectionId);
        if (el) {
          const navbarHeight = 60;
          const top = el.getBoundingClientRect().top + window.scrollY - navbarHeight;
          window.scrollTo({ top, behavior: 'smooth' });
        }
        return;
      }
    }
    router.push(item.href);
  };

  const getActiveSection = () => {
    if (pathname === '/about') return 'about';
    if (pathname === '/admin') return 'admin';
    if (pathname === '/') return 'home';
    return '';
  };

  const activeSection = getActiveSection();

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <Link href="/" className="navbar__logo">
        <SmartImage
          className="navbar__logo-icon-img"
          src="/images/favicon/favicon-32x32.png"
          alt="Finch"
          width={28}
          height={28}
          priority
        />
        <span className="navbar__logo-text">Finch</span>
      </Link>

      {/* 데스크톱 메뉴 */}
      <ul className="navbar__menu">
        {MENU_ITEMS.map((item) => (
          <li
            key={item.id}
            className={`navbar__menu-item ${activeSection === item.id ? 'navbar__menu-item--active' : ''}`}
            onClick={() => handleMenuClick(item)}
          >
            {item.label}
          </li>
        ))}
      </ul>

      {/* 모바일 햄버거 */}
      <button className="navbar__hamburger" onClick={() => setMobileNavOpen(!mobileNavOpen)} aria-label="메뉴">
        <span className={`navbar__hamburger-line ${mobileNavOpen ? 'navbar__hamburger-line--open' : ''}`} />
      </button>

      {/* 모바일 메뉴 패널 */}
      {mobileNavOpen && (
        <div className="navbar__mobile-menu">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`navbar__mobile-item ${activeSection === item.id ? 'navbar__mobile-item--active' : ''}`}
              onClick={() => { setMobileNavOpen(false); handleMenuClick(item); }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="navbar__right">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        {user ? (
          <div className="navbar__user-area" ref={dropdownRef}>
            <div className="navbar__user-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {user.avatar ? (
                <SmartImage className="navbar__user-avatar-img" src={user.avatar} alt={user.name} width={30} height={30} />
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
                  <button className="navbar__dropdown-item" onClick={() => { setMenuOpen(false); router.push('/admin'); }}>
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
