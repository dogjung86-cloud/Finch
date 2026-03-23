import { useRef, useState, useCallback, useEffect } from 'react';

// ═══════════════════════════════════════════════
//  게임 목록 데이터
// ═══════════════════════════════════════════════
export const GAME_LIST = [
  {
    id: 'cosmic-flight',
    title: 'Fly Darwin',
    subtitle: '비행 어드벤처',
    description: '우주를 탐험하며 장애물을 피하고 별을 모으세요!',
    icon: '🚀',
    accentColor: '#00e5ff',
    bgGradient: ['#0b1628', '#1a2d5a'],
    thumbnail: '/images/game screens/Fly Darwin/Fly Darwin thumbs.jpg',
    status: 'playable',
    tutorial: '마우스/터치로 비행체 조종 · 에너지 코인 수집 · 장애물 회피',
    tutorialDetail: `## 🦠 Fly Darwin

### Fly Darwin 소개
- Fly Darwin은 진화를 테마로 한 3D 비행 게임입니다.
- 아메바(단세포 생물)에서 시작하여 비행 거리가 1,000m 늘어날 때마다 새로운 생명체(비행체)로 진화합니다.
- 둔클레오스테우스, 틱타알릭, 다윈의 핀치새 등 어떤 형태까지 진화할 수 있는지 최대한 멀리 날아보세요!

### 조작
- PC: 마우스를 움직여 비행체를 상하좌우로 조종
- 모바일: 화면을 터치 & 드래그하여 조종
- 일시정지: ESC / P 키 또는 ⏸ 버튼

### 핵심 규칙
- 에너지 코인 🥜 을 모아 에너지를 유지하세요 (에너지 0 = 게임 오버)
- 장애물 💀 을 피하세요 (충돌 시 에너지 -10)
- 무적 별 ⭐ 획득 시 5초간 무적 (장애물 파괴 가능)

### 게임 Tip
- 에너지 관리가 핵심 — 코인을 적극적으로 수집하세요
- 무적 별을 놓치지 마세요 — 800m마다 한 번 등장하는 희귀 아이템
- 속도 조절 — 마우스를 왼쪽에 놓으면 느리게 날아 장애물을 피하기 쉬움
- 레벨이 오를수록 장애물 증가 — 레벨 수 = 동시 장애물 수`,
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

export default function GameCarousel({ selectedGameId, onSelectGame, isGamePlaying }) {
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
          <span className="section-title__accent">Play Lab</span>
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
                {game.thumbnail ? (
                  <img src={game.thumbnail} alt={game.title} className="game-card__thumb" />
                ) : (
                  <span className="game-card__icon">{game.icon}</span>
                )}
              </div>

              {/* 정보 */}
              <div className="game-card__info">
                <div className="game-card__title">{isComingSoon ? 'Coming Soon' : game.title}</div>
                {!isComingSoon && <div className="game-card__subtitle">{game.subtitle}</div>}
              </div>

              {/* 상태 배지 */}
              {isComingSoon && (
                <div className="game-card__badge">COMING SOON</div>
              )}
              {isSelected && !isComingSoon && isGamePlaying && (
                <div className="game-card__badge game-card__badge--playing">▶</div>
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
