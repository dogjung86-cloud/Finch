import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DeleteAccountModal({ user, onClose, onDeleted }) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canDelete = confirmText === '탈퇴';

  const handleDelete = async () => {
    if (!canDelete || loading) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('delete-user');

      if (fnError) {
        setError(fnError.message || '계정 삭제에 실패했습니다.');
        setLoading(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      onDeleted();
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-modal__close" onClick={onClose}>✕</button>

        <div className="delete-modal__header">
          <span className="delete-modal__icon">⚠️</span>
          <h2 className="delete-modal__title">회원 탈퇴</h2>
          <p className="delete-modal__desc">
            탈퇴하면 계정과 모든 데이터가 영구적으로 삭제되며
            <br />복구할 수 없습니다.
          </p>
        </div>

        <div className="delete-modal__info">
          <span className="delete-modal__email">{user?.email}</span>
          <ul className="delete-modal__list">
            <li>게임 저장 데이터 삭제</li>
            <li>활동 기록 삭제</li>
            <li>계정 영구 삭제</li>
          </ul>
        </div>

        <div className="delete-modal__confirm">
          <label className="delete-modal__label">
            확인을 위해 <strong>"탈퇴"</strong>를 입력해 주세요
          </label>
          <input
            className="delete-modal__input"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="탈퇴"
            disabled={loading}
          />
        </div>

        {error && <p className="delete-modal__error">{error}</p>}

        <div className="delete-modal__actions">
          <button className="delete-modal__btn delete-modal__btn--cancel" onClick={onClose} disabled={loading}>
            취소
          </button>
          <button
            className="delete-modal__btn delete-modal__btn--danger"
            onClick={handleDelete}
            disabled={!canDelete || loading}
          >
            {loading ? '처리 중...' : '회원 탈퇴'}
          </button>
        </div>
      </div>
    </div>
  );
}
