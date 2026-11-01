'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import SiteNav from './site/SiteNav';
import SiteFooter from './site/SiteFooter';
import RevealController from './site/RevealController';
import LoginModal from './LoginModal';
import DeleteAccountModal from './DeleteAccountModal';
import { useAuth } from '../providers/AuthProvider';

// 간단한 방문자 ID (localStorage 기반)
function getVisitorId() {
  let id = localStorage.getItem('finch_visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('finch_visitor_id', id);
  }
  return id;
}

function getDevice() {
  return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const lastPath = useRef('');

  // 페이지 방문 기록 (배포 환경에서만. 로컬 개발 방문은 통계에 섞이지 않게)
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    if (!isSupabaseConfigured || process.env.NODE_ENV !== 'production') return;

    supabase
      .from('page_views')
      .insert([
        {
          page: pathname,
          visitor_id: getVisitorId(),
          device: getDevice(),
          referrer: document.referrer || null,
        },
      ])
      .then(({ error }) => {
        if (error) console.error('page_views insert error:', error);
      });
  }, [pathname]);

  const {
    user,
    isAdmin,
    showLoginModal,
    setShowLoginModal,
    showDeleteModal,
    setShowDeleteModal,
    handleLogout,
    handleAccountDeleted,
    handleDeleteAccount,
  } = useAuth();

  // 약관 · 개인정보 페이지는 앱 웹뷰에서도 열리므로 상단 메뉴를 숨긴다 (기존 동작 유지)
  const bare = pathname === '/terms' || pathname === '/privacy';

  return (
    <>
      {!bare && (
        <SiteNav
          user={user}
          isAdmin={isAdmin}
          onLoginClick={() => setShowLoginModal(true)}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      <main id="main" className={`site-main${bare ? ' site-main--bare' : ''}`} tabIndex={-1}>
        {children}
      </main>

      <SiteFooter />

      <RevealController />

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      {showDeleteModal && (
        <DeleteAccountModal
          user={user}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={handleAccountDeleted}
        />
      )}
    </>
  );
}
