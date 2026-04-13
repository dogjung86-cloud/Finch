'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import HeroGame from '../src/components/HeroGame';
import GameCarousel, { GAME_LIST } from '../src/components/GameCarousel';
import MagazineGrid from '../src/components/MagazineGrid';

export default function HomePageClient({ articles }) {
  // ── 포인트 / 레벨 ──
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    setPoints(parseInt(localStorage.getItem('scidream_points') || '0', 10));
    setLevel(parseInt(localStorage.getItem('scidream_level') || '1', 10));
  }, []);

  // ── 게임 선택 ──
  const [selectedGameId, setSelectedGameId] = useState('cosmic-flight');
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [isGamePlaying] = useState(true);

  const selectedGame = GAME_LIST.find((g) => g.id === selectedGameId);

  // ── 스크롤 기반 활성 섹션 추적 ──
  const heroRef = useRef(null);
  const gamesRef = useRef(null);
  const magazineRef = useRef(null);

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

  const handleSelectGame = (id) => {
    setSelectedGameId(id);
    setTutorialOpen(false);
  };

  // URL 해시 기반 섹션 스크롤
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const refMap = { home: heroRef, games: gamesRef, magazine: magazineRef };
      const target = refMap[hash];
      if (target?.current) {
        setTimeout(() => {
          const navbarHeight = 60;
          const top = target.current.getBoundingClientRect().top + window.scrollY - navbarHeight;
          window.scrollTo({ top, behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  return (
    <>
      <div ref={magazineRef}>
        <MagazineGrid articles={articles} />
      </div>

      <div ref={heroRef}>
        <HeroGame onScoreChange={handleScoreChange} />
      </div>

      <div ref={gamesRef}>
        <GameCarousel
          selectedGameId={selectedGameId}
          onSelectGame={handleSelectGame}
          isGamePlaying={isGamePlaying}
        />

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
    </>
  );
}
