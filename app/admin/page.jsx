'use client';

import './admin.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPage from '../../src/components/AdminPage';
import HistoryAdmin from '../../src/components/HistoryAdmin';
import StatsAdmin from '../../src/components/StatsAdmin';
import CommentsAdmin from '../../src/components/CommentsAdmin';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasDrafts } from '../../src/lib/adminEditor';

export default function Admin() {
  const router = useRouter();
  const [tab, setTab] = useState('articles');
  const { user, isAdmin, setShowLoginModal } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [draftsWaiting, setDraftsWaiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAuthChecked(true), 400);
    return () => clearTimeout(t);
  }, []);

  // 로그인이 풀려 폼이 사라진 뒤에 확인한다. 폼은 사라지면서 쓰던 글을 임시 저장본으로 남긴다.
  useEffect(() => {
    if (user) return;
    setDraftsWaiting(hasDrafts());
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [user]);

  const handleBack = () => {
    router.push('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!authChecked && !user) {
    return (
      <div className="admin-page" style={{ padding: '120px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>인증 확인 중…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-page" style={{ padding: '120px 24px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 12 }}>로그인이 필요합니다</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>관리자 페이지는 로그인 후 이용할 수 있습니다.</p>
        {draftsWaiting && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            쓰던 글은 이 브라우저에 임시 저장되어 있습니다. 다시 로그인하면 이어 쓸 수 있습니다.
          </p>
        )}
        <button
          className="navbar__login-btn"
          onClick={() => setShowLoginModal(true)}
        >
          로그인
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-page" style={{ padding: '120px 24px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 12 }}>접근 권한이 없습니다</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>이 페이지는 관리자만 이용할 수 있습니다.</p>
        <button
          className="navbar__login-btn"
          onClick={handleBack}
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-tabs">
        <button
          className={`admin-tabs__btn ${tab === 'articles' ? 'admin-tabs__btn--active' : ''}`}
          onClick={() => setTab('articles')}
        >
          기사 관리
        </button>
        <button
          className={`admin-tabs__btn ${tab === 'history' ? 'admin-tabs__btn--active' : ''}`}
          onClick={() => setTab('history')}
        >
          100년 전 과학
        </button>
        <button
          className={`admin-tabs__btn ${tab === 'stats' ? 'admin-tabs__btn--active' : ''}`}
          onClick={() => setTab('stats')}
        >
          통계
        </button>
        <button
          className={`admin-tabs__btn ${tab === 'comments' ? 'admin-tabs__btn--active' : ''}`}
          onClick={() => setTab('comments')}
        >
          댓글
        </button>
      </div>

      {/* 탭을 옮겨도 쓰던 글이 그대로 있도록 글쓰기 두 탭은 계속 띄워 둔다 */}
      <AdminPage onBack={handleBack} active={tab === 'articles'} />
      <HistoryAdmin onBack={handleBack} active={tab === 'history'} />
      {tab === 'stats' && <StatsAdmin />}
      {tab === 'comments' && <CommentsAdmin />}
    </div>
  );
}
