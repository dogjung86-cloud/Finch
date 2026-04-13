'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

const ADMIN_EMAIL = 'sciencegive@gmail.com';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  // 초기 세션 확인 + 세션 변경 감지
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url,
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url,
        });
        setShowLoginModal(false);
        // 앱에서 열린 경우 딥링크로 토큰 전달
        const params = new URLSearchParams(window.location.search);
        if (params.get('app') === 'flydarwin' && _event === 'SIGNED_IN') {
          const deepLink = 'com.flydarwin.app://auth?access_token=' + session.access_token + '&refresh_token=' + session.refresh_token;
          window.location.href = deepLink;
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 게임 iframe에서 로그아웃 메시지 수신
  useEffect(() => {
    function handleMessage(e) {
      if (e.data && e.data.type === 'flydarwin-logout') {
        supabase.auth.signOut();
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // URL에 ?login=true가 있으면 로그인 모달 표시
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'true') {
      setShowLoginModal(true);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const handleAccountDeleted = useCallback(() => {
    ['scidream_points', 'scidream_level',
     'finch_flydarwin_likes', 'finch_flydarwin_dislikes', 'finch_flydarwin_vote',
     'totalCoins', 'flyDarwinShop', 'flyDarwinRankings', 'DAILY_STORAGE_KEY',
    ].forEach((key) => localStorage.removeItem(key));
    supabase.auth.signOut();
    setUser(null);
    setShowDeleteModal(false);
  }, []);

  const value = {
    user,
    isAdmin,
    showLoginModal,
    setShowLoginModal,
    showDeleteModal,
    setShowDeleteModal,
    handleLogout,
    handleAccountDeleted,
    handleDeleteAccount: () => {
      if (!user) {
        setShowLoginModal(true);
        return;
      }
      setShowDeleteModal(true);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
