import { useState } from 'react';

export default function LoginModal({ onClose, onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }

    if (mode === 'signup') {
      // 회원가입: localStorage에 저장
      const users = JSON.parse(localStorage.getItem('finch_users') || '[]');
      if (users.find((u) => u.email === email)) {
        setError('이미 등록된 이메일입니다.');
        return;
      }
      const newUser = { email, password, name: name.trim() };
      users.push(newUser);
      localStorage.setItem('finch_users', JSON.stringify(users));
      localStorage.setItem('finch_current_user', JSON.stringify(newUser));
      onLogin(newUser);
    } else {
      // 로그인: localStorage에서 확인
      const users = JSON.parse(localStorage.getItem('finch_users') || '[]');
      const found = users.find((u) => u.email === email && u.password === password);
      if (!found) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        return;
      }
      localStorage.setItem('finch_current_user', JSON.stringify(found));
      onLogin(found);
    }
  };

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-modal__close" onClick={onClose}>✕</button>

        <div className="login-modal__header">
          <span className="login-modal__logo">🐦</span>
          <h2 className="login-modal__title">
            {mode === 'login' ? 'Finch 로그인' : 'Finch 회원가입'}
          </h2>
          <p className="login-modal__subtitle">
            {mode === 'login'
              ? '과학의 세계에 오신 것을 환영합니다'
              : '무료로 가입하고 커뮤니티에 참여하세요'}
          </p>
        </div>

        {/* 탭 */}
        <div className="login-tabs">
          <button
            className={`login-tabs__btn ${mode === 'login' ? 'login-tabs__btn--active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            로그인
          </button>
          <button
            className={`login-tabs__btn ${mode === 'signup' ? 'login-tabs__btn--active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            회원가입
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="login-form__group">
              <label className="login-form__label">이름</label>
              <input
                type="text"
                className="login-form__input"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="login-form__group">
            <label className="login-form__label">이메일</label>
            <input
              type="email"
              className="login-form__input"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="login-form__group">
            <label className="login-form__label">비밀번호</label>
            <input
              type="password"
              className="login-form__input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="login-form__error">{error}</p>}

          <button type="submit" className="login-form__submit">
            {mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>

        <p className="login-modal__footer">
          {mode === 'login' ? (
            <>계정이 없으신가요? <span onClick={() => { setMode('signup'); setError(''); }}>회원가입</span></>
          ) : (
            <>이미 계정이 있으신가요? <span onClick={() => { setMode('login'); setError(''); }}>로그인</span></>
          )}
        </p>
      </div>
    </div>
  );
}
