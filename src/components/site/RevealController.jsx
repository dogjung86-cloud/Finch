'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// [data-reveal] 요소가 화면에 들어올 때 .is-in 을 붙여 부드럽게 등장시킨다.
// 하이드레이션 전에는 모든 콘텐츠가 그대로 보이고, 이미 화면 안에 있는 요소는
// 숨기지 않고 바로 표시해서 깜빡임이 없다.
export default function RevealController() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      root.classList.remove('reveal-ready');
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
    );

    const track = (el) => {
      if (el.classList.contains('is-in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.94 && r.bottom > 0) el.classList.add('is-in');
      else io.observe(el);
    };

    document.querySelectorAll('[data-reveal]').forEach(track);
    root.classList.add('reveal-ready');

    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches('[data-reveal]')) track(node);
          node.querySelectorAll?.('[data-reveal]').forEach(track);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
