'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import SmartImage from './SmartImage';
import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════
//  Fly Darwin 게임 (Vercel iframe 임베드)
// ═══════════════════════════════════════════════

const GAME_BASE_URL = 'https://fly-darwin.vercel.app/';
const GAME_ORIGIN = new URL(GAME_BASE_URL).origin;

export default function HeroGame() {
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  // Supabase 세션 토큰을 iframe 으로 postMessage 전달.
  // (URL 쿼리스트링은 브라우저 히스토리·서버 로그에 잔류하므로 회피)
  useEffect(() => {
    function sendAuth(session) {
      const target = iframeRef.current?.contentWindow;
      if (!target) return;
      target.postMessage(
        {
          type: 'finch-auth',
          access_token: session?.access_token || null,
          refresh_token: session?.refresh_token || null,
        },
        GAME_ORIGIN,
      );
    }

    async function sendCurrentSession() {
      const { data: { session } } = await supabase.auth.getSession();
      sendAuth(session);
    }

    // 게임이 ready 신호를 보내오면 즉시 토큰 전송 (load 타이밍 의존 X)
    function onMessage(e) {
      if (e.origin !== GAME_ORIGIN) return;
      if (e.data?.type === 'flydarwin-ready') sendCurrentSession();
    }
    window.addEventListener('message', onMessage);

    // 로그인/로그아웃 이벤트 발생 시 즉시 갱신
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      sendAuth(session);
    });

    return () => {
      window.removeEventListener('message', onMessage);
      subscription.unsubscribe();
    };
  }, []);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 전체화면
  const handleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // 전체화면 변경 감지
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  return (
    <section className="hero-game" id="hero-game" ref={containerRef}>
      <div className="hero-game__container">
        <iframe
          ref={iframeRef}
          src={GAME_BASE_URL}
          className="hero-game__iframe"
          title="Fly Darwin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          allowFullScreen
          frameBorder="0"
        />
      </div>

      {/* ── 게임 하단 컨트롤 바 ── */}
      <div className="game-bar">
        <div className="game-bar__info">
          <div className="game-bar__icon"><SmartImage src="/images/favicon/favicon-32x32.png" alt="Finch" width={20} height={20} /></div>
          <div className="game-bar__text">
            <span className="game-bar__title">Fly Darwin</span>
            <span className="game-bar__maker">제작: Finch Lab</span>
          </div>
        </div>

        <div className="game-bar__actions">
          {/* 전체화면 */}
          <button
            className="game-bar__btn"
            onClick={handleFullscreen}
            title={isFullscreen ? '전체화면 종료' : '전체화면'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen ? (
                <>
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              ) : (
                <>
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
