'use client';

import { useState } from 'react';
import HeroGame from '../../src/components/HeroGame';
import GameCarousel, { GAME_LIST } from '../../src/components/GameCarousel';

export default function PlayLabClient() {
  const [selectedGameId, setSelectedGameId] = useState('cosmic-flight');
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [isGamePlaying] = useState(true);

  const selectedGame = GAME_LIST.find((g) => g.id === selectedGameId);

  const handleSelectGame = (id) => {
    setSelectedGameId(id);
    setTutorialOpen(false);
  };

  return (
    <>
      <HeroGame />

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
    </>
  );
}
