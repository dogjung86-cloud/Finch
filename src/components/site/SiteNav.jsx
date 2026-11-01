'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NAV, CHANNEL } from '../../data/site';
import { IconUser, IconYouTube } from './Icons';

export function isNavActive(href, pathname) {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  if (href === '/articles') {
    return pathname.startsWith('/articles') || pathname.startsWith('/article/') || pathname.startsWith('/history');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Avatar({ user, size = 30 }) {
  if (user.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className="nav-avatar" src={user.avatar} alt="" width={size} height={size} referrerPolicy="no-referrer" />
    );
  }
  return <span className="nav-avatar">{(user.name || '?').charAt(0).toUpperCase()}</span>;
}

export default function SiteNav({ user, isAdmin, onLoginClick, onLogout, onDeleteAccount }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  // 모바일 메뉴가 열리면 배경 스크롤 잠금 + ESC 로 닫기
  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!accountOpen) return undefined;
    const onDown = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setAccountOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  return (
    <header className={`site-nav${menuOpen ? ' is-open' : ''}`}>
      <a href="#main" className="skip-link">
        본문 바로가기
      </a>
      <div className="site-nav__inner">
        <Link href="/" className="site-nav__brand" aria-label="과학드림 홈">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="site-nav__logo" src="/images/brand/sciencedream-logo-128.webp" alt="" width="32" height="35" />
          <span className="site-nav__word">과학드림</span>
        </Link>

        <nav className="site-nav__links" aria-label="주요 메뉴">
          {NAV.map((item) => {
            const active = isNavActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`site-nav__link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="site-nav__actions">
          {user ? (
            <div className="account" ref={accountRef}>
              <button
                type="button"
                className="icon-btn icon-btn--avatar"
                onClick={() => setAccountOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-label={`${user.name} 계정 메뉴`}
              >
                <Avatar user={user} />
              </button>
              {accountOpen && (
                <div className="account__menu" role="menu">
                  <p className="account__who">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </p>
                  {isAdmin && (
                    <button type="button" role="menuitem" onClick={() => router.push('/admin')}>
                      관리자 페이지
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountOpen(false);
                      onLogout();
                    }}
                  >
                    로그아웃
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="is-danger"
                    onClick={() => {
                      setAccountOpen(false);
                      onDeleteAccount();
                    }}
                  >
                    회원 탈퇴
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button type="button" className="icon-btn site-nav__login" onClick={onLoginClick} aria-label="로그인" title="로그인">
              <IconUser />
            </button>
          )}

          <button
            type="button"
            className="site-nav__burger"
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!menuOpen}>
        <nav aria-label="모바일 메뉴">
          <ol className="mobile-menu__list">
            {NAV.map((item, i) => {
              const active = isNavActive(item.href, pathname);
              return (
                <li key={item.href} style={{ '--i': i }}>
                  <Link
                    href={item.href}
                    className={`mobile-menu__link${active ? ' is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="mobile-menu__label">{item.label}</span>
                    <span className="mobile-menu__ko">{item.ko}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="mobile-menu__foot">
          <a className="btn btn--outline btn--sm" href={CHANNEL.url} target="_blank" rel="noopener noreferrer">
            <IconYouTube /> 유튜브 채널
          </a>
          {user ? (
            <>
              {isAdmin && (
                <Link className="btn btn--outline btn--sm" href="/admin">
                  관리자
                </Link>
              )}
              <button type="button" className="btn btn--outline btn--sm" onClick={onLogout}>
                로그아웃
              </button>
              <button type="button" className="btn btn--outline btn--sm is-danger" onClick={onDeleteAccount}>
                회원 탈퇴
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--outline btn--sm" onClick={onLoginClick}>
              <IconUser /> 로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
