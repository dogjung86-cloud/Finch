import { useRef, useEffect, useState, useCallback } from 'react';

// ═══════════════════════════════════════════════
//  로켓 비행 미니게임 (Canvas 기반)
// ═══════════════════════════════════════════════

const ROCKET_SIZE = 28;
const STAR_COUNT = 80;
const OBSTACLE_INTERVAL = 1800;
const COLLECTIBLE_INTERVAL = 2500;

function createStars(width, height) {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 1.5 + 0.5,
    brightness: Math.random() * 0.5 + 0.5,
  }));
}

export default function HeroGame({ onScoreChange, tutorial }) {
  const canvasRef = useRef(null);
  const gameStateRef = useRef('idle'); // idle, playing, gameover
  const [displayState, setDisplayState] = useState('idle');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('scidream_best_score') || '0', 10);
  });

  const gameDataRef = useRef({
    rocket: { x: 0, y: 0, vy: 0, angle: 0 },
    stars: [],
    obstacles: [],
    collectibles: [],
    particles: [],
    score: 0,
    frame: 0,
    lastObstacle: 0,
    lastCollectible: 0,
    keys: new Set(),
    mouseY: null,
  });

  const animFrameRef = useRef(null);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    gameDataRef.current = {
      rocket: { x: w * 0.15, y: h / 2, vy: 0, angle: 0 },
      stars: createStars(w, h),
      obstacles: [],
      collectibles: [],
      particles: [],
      score: 0,
      frame: 0,
      lastObstacle: 0,
      lastCollectible: 0,
      keys: new Set(),
      mouseY: null,
    };

    gameStateRef.current = 'playing';
    setDisplayState('playing');
    setScore(0);
  }, []);

  const endGame = useCallback(() => {
    gameStateRef.current = 'gameover';
    setDisplayState('gameover');
    const finalScore = gameDataRef.current.score;
    setScore(finalScore);
    if (finalScore > bestScore) {
      setBestScore(finalScore);
      localStorage.setItem('scidream_best_score', String(finalScore));
    }
    onScoreChange?.(finalScore);
  }, [bestScore, onScoreChange]);

  // 키보드 이벤트
  useEffect(() => {
    const onKeyDown = (e) => {
      gameDataRef.current.keys.add(e.key);
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
      }
    };
    const onKeyUp = (e) => {
      gameDataRef.current.keys.delete(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // 마우스 이벤트
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      gameDataRef.current.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    };
    const handleMouseLeave = () => {
      gameDataRef.current.mouseY = null;
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // 캔버스 및 게임 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      gameDataRef.current.stars = createStars(rect.width, rect.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const gameLoop = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      const d = gameDataRef.current;

      // 배경
      ctx.fillStyle = '#0b0e18';
      ctx.fillRect(0, 0, w, h);

      // 별 그리기 & 이동
      d.stars.forEach((star) => {
        const twinkle = 0.5 + 0.5 * Math.sin(d.frame * 0.02 + star.x);
        const alpha = star.brightness * twinkle;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // idle 상태에서도 살짝 움직이게 (느린 속도)
        if (gameStateRef.current === 'idle') {
          star.x -= star.speed * 0.15;
          if (star.x < -5) {
            star.x = w + 5;
            star.y = Math.random() * h;
          }
        } else if (gameStateRef.current === 'playing') {
          star.x -= star.speed;
          if (star.x < -5) {
            star.x = w + 5;
            star.y = Math.random() * h;
          }
        }
      });

      // 은하 배경 장식 — idle 시 더 밝게
      const nebulaOpacity = gameStateRef.current === 'playing' ? 1 : 2.5;
      const g1 = ctx.createRadialGradient(w * 0.7, h * 0.3, 0, w * 0.7, h * 0.3, w * 0.4);
      g1.addColorStop(0, `rgba(139, 92, 246, ${0.04 * nebulaOpacity})`);
      g1.addColorStop(0.5, `rgba(0, 229, 255, ${0.025 * nebulaOpacity})`);
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // idle/gameover 시 추가 성운 레이어
      if (gameStateRef.current !== 'playing') {
        const g2 = ctx.createRadialGradient(w * 0.25, h * 0.7, 0, w * 0.25, h * 0.7, w * 0.35);
        g2.addColorStop(0, 'rgba(236, 72, 153, 0.08)');
        g2.addColorStop(0.6, 'rgba(139, 92, 246, 0.04)');
        g2.addColorStop(1, 'transparent');
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, w, h);

        const g3 = ctx.createRadialGradient(w * 0.85, h * 0.65, 0, w * 0.85, h * 0.65, w * 0.3);
        g3.addColorStop(0, 'rgba(6, 182, 212, 0.07)');
        g3.addColorStop(0.5, 'rgba(59, 130, 246, 0.03)');
        g3.addColorStop(1, 'transparent');
        ctx.fillStyle = g3;
        ctx.fillRect(0, 0, w, h);
      }
      // idle/gameover에서도 twinkle·이동 프레임 증가
      if (gameStateRef.current !== 'playing') {
        d.frame++;
      }

      if (gameStateRef.current === 'playing') {
        d.frame++;

        // 로켓 이동
        const { keys, mouseY, rocket } = d;
        let targetVy = 0;

        if (mouseY !== null) {
          const diff = mouseY - rocket.y;
          targetVy = Math.max(-5, Math.min(5, diff * 0.08));
        }
        if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) targetVy = -4;
        if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) targetVy = 4;

        rocket.vy += (targetVy - rocket.vy) * 0.12;
        rocket.y += rocket.vy;
        rocket.angle = rocket.vy * 3;

        // 경계
        if (rocket.y < ROCKET_SIZE) { rocket.y = ROCKET_SIZE; rocket.vy = 0; }
        if (rocket.y > h - ROCKET_SIZE) { rocket.y = h - ROCKET_SIZE; rocket.vy = 0; }

        // 장애물 생성
        if (d.frame - d.lastObstacle > OBSTACLE_INTERVAL / 16) {
          const gapSize = Math.max(100, 180 - d.score * 0.5);
          const gapY = Math.random() * (h - gapSize - 80) + 40;
          d.obstacles.push({
            x: w + 30,
            gapY,
            gapSize,
            width: 40 + Math.random() * 20,
            scored: false,
          });
          d.lastObstacle = d.frame;
        }

        // 수집 아이템 생성
        if (d.frame - d.lastCollectible > COLLECTIBLE_INTERVAL / 16) {
          d.collectibles.push({
            x: w + 20,
            y: Math.random() * (h - 60) + 30,
            size: 12,
            type: Math.random() > 0.7 ? 'diamond' : 'star',
            angle: 0,
          });
          d.lastCollectible = d.frame;
        }

        // 장애물 업데이트
        const speed = 2.5 + d.score * 0.02;
        d.obstacles = d.obstacles.filter((obs) => {
          obs.x -= speed;

          // 점수
          if (!obs.scored && obs.x + obs.width < rocket.x) {
            obs.scored = true;
            d.score += 10;
            setScore(d.score);
          }

          // 충돌 검사
          if (
            rocket.x + ROCKET_SIZE * 0.5 > obs.x &&
            rocket.x - ROCKET_SIZE * 0.5 < obs.x + obs.width
          ) {
            if (rocket.y - ROCKET_SIZE * 0.3 < obs.gapY || rocket.y + ROCKET_SIZE * 0.3 > obs.gapY + obs.gapSize) {
              // 충돌 파티클
              for (let i = 0; i < 20; i++) {
                d.particles.push({
                  x: rocket.x,
                  y: rocket.y,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  life: 1,
                  color: Math.random() > 0.5 ? '#00e5ff' : '#ff6b35',
                });
              }
              endGame();
            }
          }

          // 그리기 — 운석/소행성 느낌
          ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.fillRect(obs.x, 0, obs.width, obs.gapY);
          ctx.fillRect(obs.x, obs.gapY + obs.gapSize, obs.width, h - obs.gapY - obs.gapSize);

          // 위쪽 장애물 테두리
          ctx.strokeStyle = 'rgba(255, 107, 53, 0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.gapY);
          ctx.lineTo(obs.x + obs.width, obs.gapY);
          ctx.stroke();

          // 아래쪽 장애물 테두리
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.gapY + obs.gapSize);
          ctx.lineTo(obs.x + obs.width, obs.gapY + obs.gapSize);
          ctx.stroke();

          return obs.x > -obs.width;
        });

        // 수집 아이템 업데이트
        d.collectibles = d.collectibles.filter((col) => {
          col.x -= speed * 0.8;
          col.angle += 0.05;

          // 충돌
          const dist = Math.hypot(col.x - rocket.x, col.y - rocket.y);
          if (dist < ROCKET_SIZE + col.size) {
            d.score += col.type === 'diamond' ? 50 : 20;
            setScore(d.score);
            // 파티클
            for (let i = 0; i < 8; i++) {
              d.particles.push({
                x: col.x,
                y: col.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                color: col.type === 'diamond' ? '#00e5ff' : '#ffd700',
              });
            }
            return false;
          }

          // 그리기
          ctx.save();
          ctx.translate(col.x, col.y);
          ctx.rotate(col.angle);

          if (col.type === 'diamond') {
            ctx.fillStyle = '#00e5ff';
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(0, -col.size);
            ctx.lineTo(col.size * 0.7, 0);
            ctx.lineTo(0, col.size);
            ctx.lineTo(-col.size * 0.7, 0);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 8;
            ctx.font = `${col.size * 2}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⭐', 0, 0);
          }

          ctx.restore();
          return col.x > -20;
        });

        // 로켓 그리기
        ctx.save();
        ctx.translate(rocket.x, rocket.y);
        ctx.rotate((rocket.angle * Math.PI) / 180);

        // 로켓 불꽃
        ctx.fillStyle = '#ff6b35';
        ctx.shadowColor = '#ff6b35';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        const flameLength = 15 + Math.sin(d.frame * 0.3) * 5;
        ctx.moveTo(-ROCKET_SIZE * 0.5, -4);
        ctx.lineTo(-ROCKET_SIZE * 0.5 - flameLength, 0);
        ctx.lineTo(-ROCKET_SIZE * 0.5, 4);
        ctx.closePath();
        ctx.fill();

        // 로켓 본체
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#e0e8f0';
        ctx.beginPath();
        ctx.moveTo(ROCKET_SIZE * 0.6, 0);
        ctx.lineTo(-ROCKET_SIZE * 0.3, -ROCKET_SIZE * 0.35);
        ctx.lineTo(-ROCKET_SIZE * 0.5, 0);
        ctx.lineTo(-ROCKET_SIZE * 0.3, ROCKET_SIZE * 0.35);
        ctx.closePath();
        ctx.fill();

        // 로켓 창문
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(ROCKET_SIZE * 0.15, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // 엔진 파티클 (비행 중)
        if (d.frame % 2 === 0) {
          d.particles.push({
            x: rocket.x - ROCKET_SIZE * 0.5,
            y: rocket.y + (Math.random() - 0.5) * 6,
            vx: -Math.random() * 3 - 1,
            vy: (Math.random() - 0.5) * 2,
            life: 0.8,
            color: Math.random() > 0.5 ? '#ff6b35' : '#ffab00',
          });
        }
      }

      // 파티클 업데이트
      d.particles = d.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        return p.life > 0;
      });

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [endGame]);

  return (
    <section className="hero-game" id="hero-game">
      <div className="hero-game__container">
        <canvas
          ref={canvasRef}
          className={`hero-game__canvas ${displayState !== 'playing' ? 'hero-game__canvas--blur' : ''}`}
        />

        {/* 대기 화면 오버레이 */}
        {displayState === 'idle' && (
          <div className="hero-game__overlay">
            <h1 className="hero-game__title">
              <span className="hero-game__title-main">COSMIC FLIGHT</span>
            </h1>
            <p className="hero-game__subtitle">
              우주를 탐험하며 별을 모아 포인트를 획득하세요
            </p>
            {tutorial && (
              <p className="hero-game__tutorial">
                {tutorial}
              </p>
            )}
            <button className="hero-game__play-btn" onClick={startGame}>
              🚀 지금 플레이하기
            </button>
          </div>
        )}

        {/* 게임 중 점수 */}
        {displayState === 'playing' && (
          <div className="hero-game__score">
            ⭐ {score}
          </div>
        )}

        {/* 게임 오버 */}
        {displayState === 'gameover' && (
          <div className="hero-game__gameover">
            <div className="hero-game__gameover-title">GAME OVER</div>
            <div className="hero-game__gameover-score">
              점수: <span style={{ color: 'var(--accent-cyan)' }}>{score}</span>
            </div>
            <div className="hero-game__gameover-best">
              🏆 최고 기록: {bestScore}
            </div>
            <button className="hero-game__play-btn" onClick={startGame}>
              🔄 다시 플레이
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
