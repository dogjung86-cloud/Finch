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
- Fly Darwin은 진화를 주제로 한 3D 비행 게임입니다.
- 아메바에서 시작하여 비행하며 장애물을 피하고, 코인을 모으고, 보스를 격파하며 다윈의 핀치새까지 진화해 나가세요.
- 거리를 비행할수록 캐릭터가 진화하고, 코인으로 특수 비행체와 업그레이드를 구매할 수 있습니다.

### 조작 방법
- PC: 마우스 이동 · 공격(보스전): 마우스 클릭/홀드 · 일시정지: ESC 또는 P
- 모바일: 화면 터치 & 드래그 · 공격(보스전): 터치 시 자동 발사 · 일시정지: ⏸ 버튼

### 게임 규칙
- 🧬 진화 시스템: 1,500m마다 레벨이 오르며 캐릭터가 자동으로 진화합니다.
- 👹 보스: 보스 체력이 25% 이하가 되면 분노 모드 발동 (공격 빈도 증가)
- 🛸 특수 비행체: 다윈의 핀치새 도달 또는 거리 미션을 달성하면 해금되며 상점에서 구매할 수 있습니다.

### 기타 요소
- 🍇 무적 열매: 900m마다 등장, 5초간 무적 (핀치새: 10초, UFO: 30초)
- 🌪️ 난기류: 3,000m부터 간헐적 발생, 조작이 흔들림
- 🕳️ 블랙홀: 가까이 가면 속도가 느려지는 희귀 장애물
- ▶️ 이어서 하기: 최대 3회 (50 / 200 / 300 코인)

### 게임 Tip
- 📅 출석 보상을 꼬박 챙기세요. 7일 연속 출석하면 보너스 100코인을 받을 수 있습니다.
- 📋 일일 미션을 확인하세요. 매일 2개의 미션이 배정되며, 완료 후 보상을 수령하면 추가 코인을 얻습니다.`,
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
