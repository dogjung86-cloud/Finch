import { useRef, useState, useCallback, useEffect } from 'react';

// ═══════════════════════════════════════════════
//  게임 목록 데이터
// ═══════════════════════════════════════════════
export const GAME_LIST = [
  {
    id: 'cosmic-flight',
    title: 'Cosmic Flight',
    subtitle: '로켓 비행 어드벤처',
    description: '우주를 탐험하며 장애물을 피하고 별을 모으세요!',
    icon: '🚀',
    accentColor: '#00e5ff',
    bgGradient: ['#0b1628', '#1a2d5a'],
    status: 'playable',
    tutorial: '↑↓ 또는 마우스로 로켓 조종 · 별 수집 · 장애물 회피',
    tutorialDetail: `## 🚀 Cosmic Flight 가이드

### 조작법
- **키보드**: ↑/↓ 화살표 또는 W/S 키로 로켓을 위아래로 이동
- **마우스**: 마우스를 캔버스 위에서 움직이면 로켓이 따라갑니다

### 아이템
- ⭐ **별**: 수집 시 **+20P** 획득
- 💎 **다이아몬드**: 수집 시 **+50P** 획득 (드문 출현)

### 장애물
- 위아래에서 좁아지는 통로를 통과해야 합니다
- 점수가 올라갈수록 통로가 좁아지고 속도가 빨라집니다

### 팁
- 마우스 조작이 더 정밀합니다
- 통로의 중앙을 노리세요
- 별보다 다이아몬드를 우선 수집하세요`,
  },
  {
    id: 'dna-puzzle',
    title: 'DNA Puzzle',
    subtitle: 'DNA 염기서열 퍼즐',
    description: '염기쌍을 올바르게 맞추어 DNA 이중 나선을 완성하세요!',
    icon: '🧬',
    accentColor: '#00e676',
    bgGradient: ['#0b2818', '#1a5a2d'],
    status: 'coming_soon',
    tutorial: '염기쌍 A-T, G-C를 매칭하여 DNA를 완성하세요',
    tutorialDetail: '## 🧬 DNA Puzzle\n\n준비 중인 게임입니다. 곧 만나요!',
  },
  {
    id: 'atom-builder',
    title: 'Atom Builder',
    subtitle: '원자 구조 시뮬레이션',
    description: '양성자, 중성자, 전자를 배치하여 원소를 만들어보세요!',
    icon: '⚛️',
    accentColor: '#8b5cf6',
    bgGradient: ['#1a0b28', '#3d1a5a'],
    status: 'coming_soon',
    tutorial: '양성자·중성자·전자를 드래그하여 원자를 조립하세요',
    tutorialDetail: '## ⚛️ Atom Builder\n\n준비 중인 게임입니다. 곧 만나요!',
  },
  {
    id: 'planet-defense',
    title: 'Planet Defense',
    subtitle: '행성 방어 디펜스 게임',
    description: '소행성으로부터 지구를 지키는 타워 디펜스!',
    icon: '🌍',
    accentColor: '#ff6b35',
    bgGradient: ['#281a0b', '#5a3d1a'],
    status: 'coming_soon',
    tutorial: '타워를 배치하여 소행성을 파괴하세요',
    tutorialDetail: '## 🌍 Planet Defense\n\n준비 중인 게임입니다. 곧 만나요!',
  },
  {
    id: 'neuron-connect',
    title: 'Neuron Connect',
    subtitle: '뉴런 연결 전략 게임',
    description: '뉴런을 연결하여 신경 회로를 완성하세요!',
    icon: '🧠',
    accentColor: '#ff4081',
    bgGradient: ['#280b1a', '#5a1a3d'],
    status: 'coming_soon',
    tutorial: '드래그로 뉴런 사이를 연결하여 회로를 완성하세요',
    tutorialDetail: '## 🧠 Neuron Connect\n\n준비 중인 게임입니다. 곧 만나요!',
  },
];

export default function GameCarousel({ selectedGameId, onSelectGame }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 280;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="game-carousel" id="game-carousel">
      <div className="game-carousel__header">
        <h2 className="section-title">
          <span className="section-title__icon">🎮</span>
          <span className="section-title__accent">게임 선택</span>
        </h2>
        <div className="game-carousel__arrows">
          <button
            className={`game-carousel__arrow ${!canScrollLeft ? 'game-carousel__arrow--disabled' : ''}`}
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="이전"
          >
            ◀
          </button>
          <button
            className={`game-carousel__arrow ${!canScrollRight ? 'game-carousel__arrow--disabled' : ''}`}
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="다음"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="game-carousel__track" ref={scrollRef}>
        {GAME_LIST.map((game) => {
          const isSelected = game.id === selectedGameId;
          const isComingSoon = game.status === 'coming_soon';

          return (
            <div
              key={game.id}
              className={`game-card ${isSelected ? 'game-card--selected' : ''} ${isComingSoon ? 'game-card--coming-soon' : ''}`}
              onClick={() => !isComingSoon && onSelectGame(game.id)}
              style={{
                '--card-accent': game.accentColor,
                '--card-bg-1': game.bgGradient[0],
                '--card-bg-2': game.bgGradient[1],
              }}
            >
              {/* 배경 */}
              <div className="game-card__bg">
                <span className="game-card__icon">{game.icon}</span>
              </div>

              {/* 정보 */}
              <div className="game-card__info">
                <div className="game-card__title">{game.title}</div>
                <div className="game-card__subtitle">{game.subtitle}</div>
              </div>

              {/* 상태 배지 */}
              {isComingSoon && (
                <div className="game-card__badge">COMING SOON</div>
              )}
              {isSelected && !isComingSoon && (
                <div className="game-card__badge game-card__badge--playing">▶ 플레이 중</div>
              )}

              {/* 선택 테두리 글로우 */}
              {isSelected && <div className="game-card__glow" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
