'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminPage from '../../src/components/AdminPage';
import HistoryAdmin from '../../src/components/HistoryAdmin';

export default function Admin() {
  const router = useRouter();
  const [tab, setTab] = useState('articles');

  const handleBack = () => {
    router.push('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      </div>

      {tab === 'articles' ? (
        <AdminPage onBack={handleBack} />
      ) : (
        <HistoryAdmin onBack={handleBack} />
      )}
    </div>
  );
}
