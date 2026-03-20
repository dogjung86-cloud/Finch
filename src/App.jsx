import { useState, useCallback, useEffect, useRef } from 'react';

// 컴포넌트
import Navbar from './components/Navbar';
import HeroGame from './components/HeroGame';
import GameCarousel, { GAME_LIST } from './components/GameCarousel';
import MagazineGrid from './components/MagazineGrid';
import Footer from './components/Footer';
import ArticlePage from './components/ArticlePage';
import AboutPage from './components/AboutPage';
import LoginModal from './components/LoginModal';

export default function App() {
  // ── 페이지 라우팅 ──
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedArticle, setSelectedArticle] = useState(null);

  // ── 인증 ──
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('finch_current_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ── 포인트 / 레벨 ──
  const [points, setPoints] = useState(() =>
    parseInt(localStorage.getItem('scidream_points') || '0', 10)
  );
  const [level, setLevel] = useState(() =>
    parseInt(localStorage.getItem('scidream_level') || '1', 10)
  );

  // ── 게임 선택 ──
  const [selectedGameId, setSelectedGameId] = useState('cosmic-flight');
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const selectedGame = GAME_LIST.find((g) => g.id === selectedGameId);

  // ── 스크롤 기반 활성 섹션 추적 ──
  const [activeSection, setActiveSection] = useState('home');
  const heroRef = useRef(null);
  const gamesRef = useRef(null);
  const magazineRef = useRef(null);

  useEffect(() => {
    if (currentPage !== 'home') return;

    const sections = [
      { id: 'home', ref: heroRef },
      { id: 'games', ref: gamesRef },
      { id: 'magazine', ref: magazineRef },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = sections.find((s) => s.ref.current === entry.target);
            if (section) setActiveSection(section.id);
          }
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );

    sections.forEach(({ ref }) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, [currentPage]);

  // 포인트 → localStorage & 레벨
  useEffect(() => {
    localStorage.setItem('scidream_points', String(points));
    const newLevel = Math.floor(points / 500) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      localStorage.setItem('scidream_level', String(newLevel));
    }
  }, [points, level]);

  const handleScoreChange = useCallback((score) => {
    setPoints((prev) => prev + Math.floor(score / 10));
  }, []);

  // 네비게이션
  const handleSectionChange = (section) => {
    if (section === 'about') {
      setCurrentPage('about');
      setActiveSection('about');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 다른 페이지에서 홈으로
    if (currentPage !== 'home') {
      setCurrentPage('home');
      setSelectedArticle(null);
      setActiveSection(section);
      // 약간의 지연 후 스크롤 (렌더링 대기)
      setTimeout(() => {
        const refMap = { home: heroRef, games: gamesRef, magazine: magazineRef };
        const target = refMap[section];
        if (target?.current) {
          const navbarHeight = 60;
          const top = target.current.getBoundingClientRect().top + window.scrollY - navbarHeight;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    const refMap = { home: heroRef, games: gamesRef, magazine: magazineRef };
    const target = refMap[section];
    if (target?.current) {
      const navbarHeight = 60;
      const top = target.current.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // 게임 선택
  const handleSelectGame = (id) => {
    setSelectedGameId(id);
    setTutorialOpen(false);
  };

  // 기사 클릭
  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setCurrentPage('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 기사 → 홈 돌아가기
  const handleBackFromArticle = () => {
    setCurrentPage('home');
    setSelectedArticle(null);
    setTimeout(() => {
      if (magazineRef.current) {
        const navbarHeight = 60;
        const top = magazineRef.current.getBoundingClientRect().top + window.scrollY - navbarHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 100);
  };

  // 로그인/로그아웃
  const handleLogin = (userData) => {
    setUser(userData);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('finch_current_user');
  };

  // ── 기사 상세 페이지 ──
  if (currentPage === 'article' && selectedArticle) {
    return (
      <>
        <Navbar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          points={points}
          level={level}
          user={user}
          onLoginClick={() => setShowLoginModal(true)}
          onLogout={handleLogout}
        />
        <ArticlePage
          article={selectedArticle}
          onBack={handleBackFromArticle}
          user={user}
          onLoginRequest={() => setShowLoginModal(true)}
        />
        <Footer />
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onLogin={handleLogin}
          />
        )}
      </>
    );
  }

  // ── About 페이지 ──
  if (currentPage === 'about') {
    return (
      <>
        <Navbar
          activeSection="about"
          onSectionChange={handleSectionChange}
          points={points}
          level={level}
          user={user}
          onLoginClick={() => setShowLoginModal(true)}
          onLogout={handleLogout}
        />
        <AboutPage />
        <Footer />
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onLogin={handleLogin}
          />
        )}
      </>
    );
  }

  // ── 홈 페이지 ──
  return (
    <>
      <Navbar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        points={points}
        level={level}
        user={user}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      <div ref={heroRef}>
        <HeroGame
          onScoreChange={handleScoreChange}
        />
      </div>

      <div ref={gamesRef}>
        <GameCarousel
          selectedGameId={selectedGameId}
          onSelectGame={handleSelectGame}
        />

        {/* ── 튜토리얼 상세 패널 ── */}
        {selectedGame && (
          <div className="tutorial-panel-wrap">
            <button
              className={`tutorial-toggle ${tutorialOpen ? 'tutorial-toggle--open' : ''}`}
              onClick={() => setTutorialOpen(!tutorialOpen)}
            >
              <span className="tutorial-toggle__icon">📖</span>
              <span>Fly Darwin 상세 가이드</span>
              <span className={`tutorial-toggle__arrow ${tutorialOpen ? 'tutorial-toggle__arrow--open' : ''}`}>▼</span>
            </button>

            {tutorialOpen && (
              <div className="tutorial-detail">
                <div className="tutorial-detail__content">
                  {selectedGame.tutorialDetail?.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) return <h2 key={i} className="tutorial-detail__h2">{line.replace('## ', '')}</h2>;
                    if (line.startsWith('### ')) return <h3 key={i} className="tutorial-detail__h3">{line.replace('### ', '')}</h3>;
                    if (line.startsWith('- ')) return <li key={i} className="tutorial-detail__li">{line.replace('- ', '')}</li>;
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} className="tutorial-detail__p">{line}</p>;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 물결 전환 ── */}
      <div className="wave-transition">
        <svg viewBox="0 0 1440 140" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,40 C360,100 720,0 1080,40 C1260,60 1380,55 1440,40 L1440,100 C1380,115 1260,120 1080,100 C720,60 360,160 0,100 Z" fill="#F2F2F2" />
          <path d="M0,60 C240,20 480,80 720,60 C960,40 1200,70 1440,60 L1440,110 C1200,120 960,90 720,110 C480,130 240,70 0,110 Z" fill="#E8E8E8" opacity="0.45" />
        </svg>
      </div>

      <div ref={magazineRef}>
        <MagazineGrid onArticleClick={handleArticleClick} />
      </div>

      <Footer />

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
        />
      )}
    </>
  );
}
