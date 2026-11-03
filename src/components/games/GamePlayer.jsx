'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { IconExpand, IconShrink } from '../site/Icons';

// 게임을 iframe 으로 띄우고, 로그인을 쓰는 게임에만 세션을 postMessage 로 넘긴다.
// (URL 쿼리스트링은 브라우저 기록 · 서버 로그에 남으므로 쓰지 않는다)
// cloudSave 게임은 토큰을 넘기지 않고, 게임이 보낸 기록을 사이트가 대신 저장한다.
const SAVE_MAX = 60000; // DB 제한(64KB)보다 조금 작게

export default function GamePlayer({ game }) {
  const iframeRef = useRef(null);
  const boxRef = useRef(null);
  const [full, setFull] = useState(false);
  const [pseudo, setPseudo] = useState(false);
  const { user, setShowLoginModal } = useAuth();
  const userId = user?.id || null;
  // 시험: ?preview=이름 으로 열면 공개 전 판을 이 자리에 띄운다. 실제 로그인으로 시험할 때 쓴다
  const [previewUrl, setPreviewUrl] = useState(null);
  const embedUrl = previewUrl || game.embedUrl;
  const origin = new URL(embedUrl).origin;
  const cloudSave = game.cloudSave || Boolean(previewUrl);
  const readyOrigin = useRef(null);

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('preview');
    if (key && game.previewEmbeds?.[key]) setPreviewUrl(game.previewEmbeds[key]);
  }, [game.previewEmbeds]);

  useEffect(() => {
    if (!cloudSave) return undefined;
    const post = (msg) => iframeRef.current?.contentWindow?.postMessage(msg, origin);
    let alive = true;
    let writing = false;
    let pending = null;

    async function sendState() {
      if (!userId) {
        post({ type: 'cloudsave-state', loggedIn: false });
        return;
      }
      const { data, error } = await supabase
        .from('game_saves')
        .select('data')
        .eq('user_id', userId)
        .eq('game_slug', game.slug)
        .maybeSingle();
      if (alive) post({ type: 'cloudsave-state', loggedIn: true, save: data?.data || null, failed: Boolean(error) });
    }

    // 저장은 한 번에 하나만 보내고, 그동안 온 것은 가장 최근 것만 남긴다
    async function write(save) {
      if (writing) {
        pending = save;
        return;
      }
      writing = true;
      const { error } = await supabase
        .from('game_saves')
        .upsert({ user_id: userId, game_slug: game.slug, data: save }, { onConflict: 'user_id,game_slug' });
      writing = false;
      if (error) console.warn('게임 기록 저장 실패', error.message);
      if (pending && alive) {
        const next = pending;
        pending = null;
        write(next);
      }
    }

    async function onMessage(e) {
      if (e.origin !== origin || e.source !== iframeRef.current?.contentWindow) return;
      const type = e.data?.type;
      if (type === 'cloudsave-ready') {
        readyOrigin.current = origin;
        sendState();
      } else if (type === 'cloudsave-login') {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        setPseudo(false);
        setShowLoginModal(true);
      } else if (!userId) {
        // 로그인 전에는 저장을 받지 않는다
      } else if (type === 'cloudsave-write') {
        const save = e.data.data;
        if (save && typeof save === 'object' && JSON.stringify(save).length <= SAVE_MAX) write(save);
      } else if (type === 'cloudsave-delete') {
        await supabase.from('game_saves').delete().eq('user_id', userId).eq('game_slug', game.slug);
        if (alive) post({ type: 'cloudsave-deleted' });
      }
    }
    window.addEventListener('message', onMessage);
    // 게임이 이미 준비된 뒤에 로그인 상태가 바뀌면 바로 알린다
    if (readyOrigin.current === origin) sendState();

    return () => {
      alive = false;
      window.removeEventListener('message', onMessage);
    };
  }, [cloudSave, origin, userId, game.slug, setShowLoginModal]);

  useEffect(() => {
    if (!game.usesLogin) return undefined;

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
  }, [origin, game.usesLogin]);

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
      className={`player${game.tallOnPhone ? ' player--tall' : ''}${pseudo ? ' is-pseudo-full' : ''}${full ? ' is-full' : ''}`}
      aria-label={`${game.title} 게임`}
    >
      <div className="player__frame">
        <iframe
          ref={iframeRef}
          src={embedUrl}
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
