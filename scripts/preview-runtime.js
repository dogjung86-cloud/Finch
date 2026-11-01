// 미리보기 사본 전용 스크립트. scripts/snapshot.mjs 가 사본의 _assets/preview.js 로 복사해 모든 페이지에 붙인다.
// 사본에는 React 가 없어서 실제 사이트의 탭, 더보기, 메뉴 같은 화면 동작을 여기서 간단히 흉내 낸다.
// 사본을 저장할 때 글과 영상을 전부 펼쳐 두므로, 여기서 처음 상태로 다시 접는다. 실제 사이트에는 들어가지 않는다.
(() => {
  const ARTICLES_PER_PAGE = 12; // src/components/articles/ArticlesHub.jsx 의 PAGE 와 같게

  const show = (el, on) => {
    el.style.display = on ? '' : 'none';
  };
  const handled = (el) => {
    el.dataset.previewOk = '1';
    return el;
  };

  let toastEl;
  let toastTimer;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.setAttribute('role', 'status');
      toastEl.style.cssText =
        'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2000;width:max-content;max-width:calc(100vw - 32px);padding:12px 18px;font-size:14px;line-height:1.5;text-align:center;color:#fff;background:rgba(20,20,20,.92);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.25)';
      document.body.append(toastEl);
    }
    toastEl.textContent = text;
    show(toastEl, true);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => show(toastEl, false), 2800);
  }

  // ── 칼럼 목록: 시리즈 탭, 분야 필터, 글 더 보기 ──
  function initHub(hub) {
    const tabs = [...hub.querySelectorAll('.tab')];
    const grid = hub.querySelector('.hub__grid');
    if (!grid) return;
    const items = [...grid.children];
    const categories = (hub.dataset.categories || '').split(',').filter(Boolean);
    let series = hub.dataset.initialSeries || 'all';
    let category = 'all';
    let limit = ARTICLES_PER_PAGE;

    const pills = document.createElement('div');
    pills.className = 'pills hub__cats';
    pills.setAttribute('role', 'group');
    pills.setAttribute('aria-label', '분야');
    const pillButtons = ['all', ...categories].map((c) => {
      const b = handled(document.createElement('button'));
      b.type = 'button';
      b.className = 'pill';
      b.textContent = c === 'all' ? '모든 분야' : c;
      b.addEventListener('click', () => {
        category = c;
        limit = ARTICLES_PER_PAGE;
        render();
      });
      b.dataset.category = c;
      pills.append(b);
      return b;
    });
    hub.querySelector('.tabs').after(pills);

    const more = document.createElement('div');
    more.className = 'hub__more';
    const moreButton = handled(document.createElement('button'));
    moreButton.type = 'button';
    moreButton.className = 'btn btn--outline btn--lg';
    moreButton.textContent = '글 더 보기';
    moreButton.addEventListener('click', () => {
      limit += ARTICLES_PER_PAGE;
      render();
    });
    more.append(moreButton);
    grid.after(more);

    function render() {
      tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.series === series)));
      show(pills, series === 'column' && categories.length > 0);
      pillButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.category === category)));
      const matched = items.filter(
        (el) =>
          (series === 'all' || el.dataset.series === series) &&
          (series !== 'column' || category === 'all' || el.dataset.category === category),
      );
      items.forEach((el) => show(el, false));
      matched.slice(0, limit).forEach((el) => show(el, true));
      show(more, matched.length > limit);
    }

    tabs.forEach((t) =>
      handled(t).addEventListener('click', () => {
        series = t.dataset.series;
        category = 'all';
        limit = ARTICLES_PER_PAGE;
        render();
      }),
    );
    render();
  }

  // ── 출연 영상 더보기 ──
  function initVideoMore(button) {
    const limit = Number(button.dataset.limit);
    const grid = button.parentElement.previousElementSibling;
    const items = [...grid.children];
    let open = false;
    function render() {
      items.forEach((el, i) => show(el, open || i < limit));
      button.textContent = open ? '접기' : `더보기 (${items.length - limit}편)`;
      button.setAttribute('aria-expanded', String(open));
    }
    handled(button).addEventListener('click', () => {
      if (open) grid.scrollIntoView({ block: 'start', behavior: 'instant' });
      open = !open;
      render();
    });
    render();
  }

  // ── 모바일 메뉴 ──
  function initMobileMenu(burger) {
    const nav = burger.closest('.site-nav');
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    function setOpen(open) {
      menu.hidden = !open;
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      document.body.style.overflow = open ? 'hidden' : '';
    }
    handled(burger).addEventListener('click', () => setOpen(menu.hidden));
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  // ── 협업 문의: 선택과 입력은 그대로 되고, 보내기만 막는다 ──
  function initCollab() {
    document.querySelector('.collab-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      toast('미리보기 사본이라 실제로 보내지지는 않아요.');
    });
    const copy = document.querySelector('.copy-email button');
    const address = document.querySelector('.copy-email__addr')?.textContent.trim();
    if (copy && address) {
      handled(copy).addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(address);
          toast('주소를 복사했어요.');
        } catch {
          toast(address);
        }
      });
    }
  }

  document.querySelectorAll('.hub').forEach(initHub);
  document.querySelectorAll('.video-more button').forEach(initVideoMore);
  document.querySelectorAll('.site-nav__burger').forEach(initMobileMenu);
  initCollab();

  // 여기서 흉내 내지 않은 버튼은 눌러도 반응이 없어 고장 난 것처럼 보이므로 안내한다
  document.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button || button.dataset.previewOk || (button.type === 'submit' && button.form)) return;
    toast('미리보기 사본이라 이 버튼은 동작하지 않아요. 실제 사이트에서는 됩니다.');
  });
})();
