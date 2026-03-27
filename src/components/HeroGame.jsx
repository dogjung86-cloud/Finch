import { useRef, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════
//  Fly Darwin 게임 (Vercel iframe 임베드)
// ═══════════════════════════════════════════════

const GAME_BASE_URL = 'https://fly-darwin.vercel.app/';

export default function HeroGame({ onScoreChange }) {
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const [gameUrl, setGameUrl] = useState(GAME_BASE_URL);

  // Supabase 세션 토큰을 iframe URL에 전달
  useEffect(() => {
    async function passToken() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setGameUrl(GAME_BASE_URL + '?access_token=' + session.access_token + '&refresh_token=' + session.refresh_token);
      }
    }
    passToken();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setGameUrl(GAME_BASE_URL + '?access_token=' + session.access_token + '&refresh_token=' + session.refresh_token);
      } else {
        setGameUrl(GAME_BASE_URL);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  const [likes, setLikes] = useState(() =>
    parseInt(localStorage.getItem('finch_flydarwin_likes') || '0', 10)
  );
  const [dislikes, setDislikes] = useState(() =>
    parseInt(localStorage.getItem('finch_flydarwin_dislikes') || '0', 10)
  );
  const [userVote, setUserVote] = useState(() =>
    localStorage.getItem('finch_flydarwin_vote') || null
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 좋아요
  const handleLike = useCallback(() => {
    if (userVote === 'like') return; // 이미 좋아요
    let newLikes = likes;
    let newDislikes = dislikes;

    if (userVote === 'dislike') {
      newDislikes = Math.max(0, dislikes - 1);
    }
    newLikes = likes + 1;

    setLikes(newLikes);
    setDislikes(newDislikes);
    setUserVote('like');
    localStorage.setItem('finch_flydarwin_likes', String(newLikes));
    localStorage.setItem('finch_flydarwin_dislikes', String(newDislikes));
    localStorage.setItem('finch_flydarwin_vote', 'like');
  }, [likes, dislikes, userVote]);

  // 싫어요
  const handleDislike = useCallback(() => {
    if (userVote === 'dislike') return;
    let newLikes = likes;
    let newDislikes = dislikes;

    if (userVote === 'like') {
      newLikes = Math.max(0, likes - 1);
    }
    newDislikes = dislikes + 1;

    setLikes(newLikes);
    setDislikes(newDislikes);
    setUserVote('dislike');
    localStorage.setItem('finch_flydarwin_likes', String(newLikes));
    localStorage.setItem('finch_flydarwin_dislikes', String(newDislikes));
    localStorage.setItem('finch_flydarwin_vote', 'dislike');
  }, [likes, dislikes, userVote]);

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
  useState(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  });



  // 숫자 포맷 (1000 → 1K)
  const formatCount = (n) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  };

  return (
    <section className="hero-game" id="hero-game" ref={containerRef}>
      <div className="hero-game__container">
        <iframe
          ref={iframeRef}
          src={gameUrl}
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
          <div className="game-bar__icon">🐦</div>
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
