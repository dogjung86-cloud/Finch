'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import LoginModal from './LoginModal';
import DeleteAccountModal from './DeleteAccountModal';
import { useAuth } from '../providers/AuthProvider';

export default function LayoutShell({ children }) {
  const pathname = usePathname();
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
