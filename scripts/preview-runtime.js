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

  // ── 게임 의견 게시판: 화면은 그대로 보여 주고, 저장만 하지 않는다 ──
  function initBoard(board) {
    const tabs = [...board.querySelectorAll('.tab')];
    const list = board.querySelector('.board-list');
    let current = 'all';
    const applyTopic = () => {
      tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.topic === current)));
      list.querySelectorAll('.board-post').forEach((p) => show(p, current === 'all' || p.dataset.topic === current));
    };
    tabs.forEach((t) => {
      handled(t).addEventListener('click', () => {
        current = t.dataset.topic;
        applyTopic();
      });
    });

    // 사본에서는 로그인할 수 없으므로, 로그인 버튼을 누르면 로그인한 화면을 보여 준다
    const prompt = board.querySelector('.board-login');
    const form = board.querySelector('[data-board-composer]');
    if (!prompt || !form) return;
    const textarea = form.querySelector('textarea');
    const select = form.querySelector('select');
    const count = form.querySelector('.board-form__count');
    const submit = form.querySelector('button[type=submit]');
    handled(prompt.querySelector('button')).addEventListener('click', () => {
      show(prompt, false);
      form.hidden = false;
      textarea.focus();
      toast('미리보기 사본이라 로그인한 것처럼 보여 드려요.');
    });
    const refresh = () => {
      count.textContent = `${textarea.value.length} / ${textarea.maxLength}`;
      submit.disabled = !textarea.value.trim();
    };
    textarea.addEventListener('input', refresh);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const body = textarea.value.trim();
      if (!body) return;
      const item = list.querySelector('.board-post').cloneNode(true);
      item.dataset.topic = select.value;
      item.querySelector('.board-post__author').textContent = '미리보기';
      item.querySelector('.board-post__date').textContent = '방금 전';
      item.querySelector('.board-post__topic').textContent = select.selectedOptions[0].textContent;
      item.querySelector('.board-post__body').textContent = body;
      const remove = handled(document.createElement('button'));
      remove.type = 'button';
      remove.textContent = '삭제';
      remove.addEventListener('click', () => item.remove());
      const actions = document.createElement('span');
      actions.className = 'board-post__actions';
      actions.append(remove);
      item.querySelector('.board-post__meta').append(actions);
      list.prepend(item);
      textarea.value = '';
      refresh();
      if (current !== 'all') current = select.value;
      applyTopic();
      toast('미리보기 사본이라 실제로 저장되지는 않아요.');
    });
  }

  document.querySelectorAll('.hub').forEach(initHub);
  document.querySelectorAll('.video-more button').forEach(initVideoMore);
  document.querySelectorAll('.site-nav__burger').forEach(initMobileMenu);
  document.querySelectorAll('.board').forEach(initBoard);
  initCollab();

  // 여기서 흉내 내지 않은 버튼은 눌러도 반응이 없어 고장 난 것처럼 보이므로 안내한다
  document.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button || button.dataset.previewOk || (button.type === 'submit' && button.form)) return;
    toast('미리보기 사본이라 이 버튼은 동작하지 않아요. 실제 사이트에서는 됩니다.');
  });
})();
