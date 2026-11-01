'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { IconExpand, IconShrink } from '../site/Icons';

// 게임을 iframe 으로 띄우고, 로그인 세션을 postMessage 로 넘긴다.
// (URL 쿼리스트링은 브라우저 기록 · 서버 로그에 남으므로 쓰지 않는다)
export default function GamePlayer({ game }) {
  const iframeRef = useRef(null);
  const boxRef = useRef(null);
  const [full, setFull] = useState(false);
  const [pseudo, setPseudo] = useState(false);
  const origin = new URL(game.embedUrl).origin;

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
        origin,
      );
    }

    async function sendCurrentSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      sendAuth(session);
    }

    // 게임이 준비됐다고 알려오면 바로 토큰 전송 (load 타이밍에 기대지 않음)
    function onMessage(e) {
      if (e.origin !== origin) return;
      if (e.data?.type === 'flydarwin-ready') sendCurrentSession();
    }
    window.addEventListener('message', onMessage);

    // 로그인 · 로그아웃 즉시 반영
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => sendAuth(session));

    return () => {
      window.removeEventListener('message', onMessage);
      subscription.unsubscribe();
    };
  }, [origin]);

  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // 전체화면 API 가 없는 기기(아이폰 사파리 등)는 화면을 꽉 채우는 모드로 대신한다
  useEffect(() => {
    if (!pseudo) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setPseudo(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [pseudo]);

  const toggleFull = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;
    if (pseudo) {
      setPseudo(false);
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    if (box.requestFullscreen) {
      box.requestFullscreen().catch(() => setPseudo(true));
    } else {
      setPseudo(true);
    }
  }, [pseudo]);

  const expanded = full || pseudo;

  return (
    <section
      ref={boxRef}
      className={`player${pseudo ? ' is-pseudo-full' : ''}${full ? ' is-full' : ''}`}
      aria-label={`${game.title} 게임`}
    >
      <div className="player__frame">
        <iframe
          ref={iframeRef}
          src={game.embedUrl}
          title={game.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen"
          allowFullScreen
        />
      </div>
      <div className="player__bar">
        <div className="player__info">
          <span className="player__live" aria-hidden="true" />
          <strong>{game.title}</strong>
          <span className="player__genre">{game.genre}</span>
        </div>
        <button type="button" className="btn btn--sm player__full" onClick={toggleFull}>
          {expanded ? <IconShrink /> : <IconExpand />}
          {expanded ? '작게 보기' : '전체화면'}
        </button>
      </div>
    </section>
  );
}
