'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import Navbar from './Navbar';
import Footer from './Footer';
import LoginModal from './LoginModal';
import DeleteAccountModal from './DeleteAccountModal';
import { useAuth } from '../providers/AuthProvider';

// 간단한 visitor ID (localStorage 기반)
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

  // 페이지 방문 추적
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    supabase.from('page_views').insert([{
      page: pathname,
      visitor_id: getVisitorId(),
      device: getDevice(),
      referrer: document.referrer || null,
    }]).then(({ error }) => {
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

  // terms/privacy 페이지에서는 Navbar를 숨김 (기존 동작 유지)
  const hideNavbar = pathname === '/terms' || pathname === '/privacy';

  return (
    <>
      {!hideNavbar && (
        <Navbar
          user={user}
          onLoginClick={() => setShowLoginModal(true)}
          onLogout={handleLogout}
          isAdmin={isAdmin}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {children}

      <Footer />

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
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
