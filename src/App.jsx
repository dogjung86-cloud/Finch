import { useState, useCallback, useEffect, useRef } from 'react';

// 컴포넌트
import Navbar from './components/Navbar';
import HeroGame from './components/HeroGame';
import GameCarousel, { GAME_LIST } from './components/GameCarousel';
import MagazineGrid from './components/MagazineGrid';
import Footer from './components/Footer';

export default function App() {
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
  }, []);

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

  // 네비게이션 → 스무스 스크롤
  const handleSectionChange = (section) => {
    const refMap = { home: heroRef, games: gamesRef, magazine: magazineRef };
    const target = refMap[section];
    if (target?.current) {
      const navbarHeight = 60;
      const top = target.current.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // 게임 선택 시 튜토리얼 패널 닫기
  const handleSelectGame = (id) => {
    setSelectedGameId(id);
    setTutorialOpen(false);
  };

  return (
    <>
      <Navbar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        points={points}
        level={level}
      />

      <div ref={heroRef}>
        <HeroGame
          onScoreChange={handleScoreChange}
          selectedGameId={selectedGameId}
          tutorial={selectedGame?.tutorial}
        />
      </div>

      <div ref={gamesRef}>
        <GameCarousel
          selectedGameId={selectedGameId}
          onSelectGame={handleSelectGame}
        />

        {/* ── 튜토리얼 상세 패널 (B안: 접을 수 있는 패널) ── */}
        {selectedGame && (
          <div className="tutorial-panel-wrap">
            <button
              className={`tutorial-toggle ${tutorialOpen ? 'tutorial-toggle--open' : ''}`}
              onClick={() => setTutorialOpen(!tutorialOpen)}
            >
              <span className="tutorial-toggle__icon">📖</span>
              <span>{selectedGame.title} 상세 가이드</span>
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

      {/* ── SVG 웨이브 전환 (게임 → 매거진) ── */}
      <div className="wave-transition">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,80 1440,60 L1440,120 L0,120 Z" fill="#e8f0e8" />
          <path d="M0,80 C240,40 480,100 720,80 C960,60 1200,90 1440,80 L1440,120 L0,120 Z" fill="#dfe8df" opacity="0.6" />
        </svg>
      </div>

      <div ref={magazineRef}>
        <MagazineGrid />
      </div>

      <Footer />
    </>
  );
}
