import { useState, useEffect, useRef, useCallback } from 'react';
import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext';

/* ── 날개짓하는 핀치새 SVG ── */
function FlappingBird({ size = 100, style, className, ...props }) {
  return (
    <svg
      viewBox="0 0 120 100"
      width={size}
      height={size * 0.83}
      style={style}
      className={className}
      {...props}
    >
      {/* 몸통 */}
      <ellipse cx="60" cy="58" rx="22" ry="18" fill="#2c2c2c" />
      {/* 배 */}
      <ellipse cx="62" cy="64" rx="14" ry="12" fill="#4a4a4a" />
      {/* 머리 */}
      <circle cx="78" cy="42" r="13" fill="#2c2c2c" />
      {/* 눈 */}
      <circle cx="83" cy="40" r="4" fill="white" />
      <circle cx="84" cy="39.5" r="2" fill="#111" />
      {/* 부리 */}
      <polygon points="91,41 102,44 91,46" fill="#d4822a" />
      {/* 왼쪽 날개 - 펄럭임 */}
      <g className="about-bird__wing-left">
        <path
          d="M48,50 Q20,20 8,28 Q16,38 38,48 Z"
          fill="#3a3a3a"
        />
      </g>
      {/* 오른쪽 날개 - 펄럭임 */}
      <g className="about-bird__wing-right">
        <path
          d="M48,50 Q30,15 18,8 Q14,22 38,45 Z"
          fill="#444"
        />
      </g>
      {/* 꼬리 */}
      <path d="M38,60 Q18,55 12,68 Q28,65 38,64 Z" fill="#3a3a3a" />
      {/* 다리 */}
      <line x1="55" y1="74" x2="50" y2="90" stroke="#d4822a" strokeWidth="2" />
      <line x1="65" y1="74" x2="60" y2="90" stroke="#d4822a" strokeWidth="2" />
      {/* 발 */}
      <path d="M44,90 L50,90 L53,88" stroke="#d4822a" strokeWidth="1.5" fill="none" />
      <path d="M54,90 L60,90 L63,88" stroke="#d4822a" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

/* ── 소개 텍스트 ── */
const INTRO_TEXT =
  '1835년, 찰스 다윈은 갈라파고스 제도에서 섬마다 부리 모양이 다른 핀치새들을 관찰했습니다. ' +
  '이 작은 새들이 훗날 진화론이라는 거대한 과학 혁명의 불씨가 될 줄은 아무도 몰랐죠. ' +
  'Finch는 바로 그 핀치새의 이름을 빌려왔습니다. ' +
  '작은 관찰 하나가 세상을 바꾸는 영감이 되었듯, ' +
  '이 플랫폼도 일상 속에서 과학적 호기심과 영감을 만나는 공간이 되길 바라는 마음으로 만들었습니다. ' +
  'Finch는 유튜브 과학드림 채널의 서브 프로젝트로, ' +
  '과학드림만의 개성과 취향이 듬뿍 담겨 있는 플랫폼입니다. ' +
  '가볍게 즐기는 과학 게임부터 깊이 있는 기초과학 기사까지, ' +
  '과학을 좋아하는 사람이라면 누구나 편하게 즐길 수 있는 놀이터를 꿈꾸고 있습니다.';

/* ── 상수 ── */
const BIRD_W = 130;
const BIRD_H = 148;
const LINE_H = 32;
const FONT_PX = 17;
const FONT = `${FONT_PX}px "Noto Sans KR", sans-serif`;
const GAP = 20;
const MAX_AREA_H = 700;

export default function AboutPage() {
  const canvasRef = useRef(null);
  const areaRef = useRef(null);
  const preparedRef = useRef(null);

  const [birdPos, setBirdPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);

  const dragStart = useRef({ px: 0, py: 0, bx: 0, by: 0 });
  const lastX = useRef(0);

  /* ── 초기화: 폰트 로드 후 Pretext 준비 ── */
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    document.fonts.ready.then(() => {
      preparedRef.current = prepareWithSegments(INTRO_TEXT, FONT);
      const s = getComputedStyle(area);
      const w = area.clientWidth - (parseFloat(s.paddingLeft) || 0) - (parseFloat(s.paddingRight) || 0);
      setBirdPos({ x: w - BIRD_W - 24, y: 16 });
      setReady(true);
    });

    const onResize = () => {
      setBirdPos((p) => {
        if (!p) return p;
        const s = getComputedStyle(area);
        const w = area.clientWidth - (parseFloat(s.paddingLeft) || 0) - (parseFloat(s.paddingRight) || 0);
        return { x: Math.min(p.x, w - BIRD_W), y: p.y };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ── 캔버스에 텍스트 렌더링 (양쪽 정렬) ── */
  useEffect(() => {
    if (!ready || !birdPos || !canvasRef.current || !areaRef.current) return;

    const canvas = canvasRef.current;
    const area = areaRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const style = getComputedStyle(area);
    const padL = parseFloat(style.paddingLeft) || 0;
    const padR = parseFloat(style.paddingRight) || 0;
    const W = area.clientWidth - padL - padR;

    const lines = [];
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let y = 0;

    while (true) {
      let maxW = W;
      let xOff = 0;

      if (y + LINE_H > birdPos.y && y < birdPos.y + BIRD_H) {
        const spaceL = birdPos.x - GAP;
        const spaceR = W - (birdPos.x + BIRD_W + GAP);

        if (spaceL >= spaceR && spaceL > 80) {
          maxW = Math.max(80, spaceL);
          xOff = 0;
        } else if (spaceR > 80) {
          maxW = Math.max(80, spaceR);
          xOff = birdPos.x + BIRD_W + GAP;
        }
      }

      const line = layoutNextLine(preparedRef.current, cursor, maxW);
      if (!line) break;

      const isLast = (() => {
        const peek = layoutNextLine(preparedRef.current, line.end, maxW);
        return !peek;
      })();

      lines.push({ text: line.text, x: xOff, y, maxW, isLast });
      cursor = line.end;
      y += LINE_H;
      if (y > MAX_AREA_H) break;
    }

    const H = Math.max(y + LINE_H, birdPos.y + BIRD_H + LINE_H, 280);

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    ctx.font = FONT;
    ctx.fillStyle = '#333';
    ctx.textBaseline = 'top';

    for (const l of lines) {
      const yPos = l.y + (LINE_H - FONT_PX) / 2;

      if (l.isLast) {
        ctx.fillText(l.text, l.x, yPos);
      } else {
        const textW = ctx.measureText(l.text).width;
        const extra = l.maxW - textW;

        if (extra > 0 && extra < l.maxW * 0.4) {
          const words = l.text.split(/(\s+)/);
          const spaceIndices = [];
          for (let i = 0; i < words.length; i++) {
            if (/^\s+$/.test(words[i])) spaceIndices.push(i);
          }

          if (spaceIndices.length > 0) {
            const addPerSpace = extra / spaceIndices.length;
            let cx = l.x;
            for (let i = 0; i < words.length; i++) {
              if (/^\s+$/.test(words[i])) {
                cx += ctx.measureText(words[i]).width + addPerSpace;
              } else {
                ctx.fillText(words[i], cx, yPos);
                cx += ctx.measureText(words[i]).width;
              }
            }
          } else {
            const chars = [...l.text];
            if (chars.length > 1) {
              const totalCharW = chars.reduce((s, c) => s + ctx.measureText(c).width, 0);
              const addPer = (l.maxW - totalCharW) / (chars.length - 1);
              let cx = l.x;
              for (const c of chars) {
                ctx.fillText(c, cx, yPos);
                cx += ctx.measureText(c).width + addPer;
              }
            } else {
              ctx.fillText(l.text, l.x, yPos);
            }
          }
        } else {
          ctx.fillText(l.text, l.x, yPos);
        }
      }
    }

    area.style.height = H + 'px';
  }, [ready, birdPos]);

  /* ── 드래그 핸들러 ── */
  const onDown = useCallback(
    (e) => {
      if (!birdPos) return;
      e.preventDefault();
      e.target.setPointerCapture(e.pointerId);
      setIsDragging(true);
      lastX.current = e.clientX;
      dragStart.current = {
        px: e.clientX,
        py: e.clientY,
        bx: birdPos.x,
        by: birdPos.y,
      };
    },
    [birdPos],
  );

  const onMove = useCallback(
    (e) => {
      if (!isDragging || !areaRef.current) return;
      const s = getComputedStyle(areaRef.current);
      const W = areaRef.current.clientWidth - (parseFloat(s.paddingLeft) || 0) - (parseFloat(s.paddingRight) || 0);
      const dx = e.clientX - dragStart.current.px;
      const dy = e.clientY - dragStart.current.py;
      const newX = Math.max(0, Math.min(W - BIRD_W, dragStart.current.bx + dx));

      /* 이동 방향에 따라 새 방향 전환 */
      if (Math.abs(e.clientX - lastX.current) > 2) {
        setFacingLeft(e.clientX < lastX.current);
        lastX.current = e.clientX;
      }

      setBirdPos({
        x: newX,
        y: Math.max(0, Math.min(MAX_AREA_H - BIRD_H, dragStart.current.by + dy)),
      });
    },
    [isDragging],
  );

  const onUp = useCallback(() => setIsDragging(false), []);

  /* ── JSX ── */
  return (
    <div className="about-page">
      <div className="about-page__container">
        {/* ── 히어로 ── */}
        <div className="about-page__hero">
          <span className="about-page__label">INTRODUCE</span>
          <img
            src="/about logo.png"
            alt="Finch"
            className="about-page__title-logo"
          />
          <p className="about-page__subtitle">과학을 즐기고, 과학을 읽다</p>
        </div>

        {/* ── Pretext 인터랙티브 영역 ── */}
        <section className="about-pretext-section">
          <p className="about-pretext__hint">
            핀치새를 드래그해서 움직여보세요!
          </p>
          <div ref={areaRef} className="about-pretext__area">
            <canvas ref={canvasRef} className="about-pretext__canvas" />
            {birdPos && (
              <div
                className={`about-pretext__bird${isDragging ? ' about-pretext__bird--dragging' : ''}`}
                style={{
                  left: birdPos.x,
                  top: birdPos.y,
                  width: BIRD_W,
                  height: BIRD_H,
                  transform: facingLeft ? 'scaleX(-1)' : 'none',
                }}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
              >
                <FlappingBird size={BIRD_W} />
              </div>
            )}
          </div>
        </section>

        {/* ── 피처 카드 ── */}
        <div className="about-features">
          <div className="about-feature-card">
            <span className="about-feature-card__icon">🎮</span>
            <h3 className="about-feature-card__title">Play Lab</h3>
            <p className="about-feature-card__desc">
              요즘 게임은 조작이 복잡하고 진입 장벽이 높습니다. 저는 옛날
              아케이드 게임처럼 누구나 바로 플레이할 수 있는 가벼운 게임을
              좋아합니다. 그래서 Play Lab에는 단순하면서도 중독성 있는 게임들로
              채워나갈 예정입니다. 물론 과학적 상상력이 한 스푼 곁들여져 있으니,
              과학 편향 주의!
            </p>
          </div>
          <div className="about-feature-card">
            <span className="about-feature-card__icon">📰</span>
            <h3 className="about-feature-card__title">The Finch</h3>
            <p className="about-feature-card__desc">
              우리나라 과학 뉴스는 IT 기기, AI 같은 기술과학이 대부분이고,
              언론에서는 공공기관 포럼이나 행사 소식이 주를 이룹니다.
              생물학, 고생물학, 천문학 같은 기초과학 이야기를 만나기가 쉽지 않죠.
              그래서 직접 쓰기로 했습니다. The Finch는 순수한 기초과학의 재미와
              발견을 전하는 매거진입니다.
            </p>
          </div>
          <div className="about-feature-card">
            <span className="about-feature-card__icon">🧪</span>
            <h3 className="about-feature-card__title">커뮤니티</h3>
            <p className="about-feature-card__desc about-feature-card__desc--coming">
              준비중입니다
            </p>
          </div>
        </div>

        {/* ── 과학드림 ── */}
        <section className="about-sciencedream">
          <img
            src="/images/sciencedream_logo.png"
            alt="과학드림"
            className="about-sciencedream__logo"
          />
          <p className="about-sciencedream__text">
            Finch는 유튜브{' '}
            <a
              href="https://www.youtube.com/@sciencedream"
              target="_blank"
              rel="noopener noreferrer"
            >
              과학드림
            </a>{' '}
            채널에서 운영하는 서브 프로젝트입니다.
          </p>
        </section>

        {/* ── Contact ── */}
        <section className="about-section about-contact">
          <h2 className="about-section__title">Contact</h2>
          <p className="about-section__text">
            게임의 버그나 문의 사항이 있으시면{' '}
            <strong>sciencegive@gmail.com</strong>으로 연락 부탁드립니다.
          </p>
        </section>
      </div>
    </div>
  );
}
