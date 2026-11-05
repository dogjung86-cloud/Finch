import { NAV } from '../data/site';
import { GAMES, getGame } from '../data/games';
import { isNavActive } from '../components/site/SiteNav';

// 관리자 통계가 방문 기록(page_views)을 읽는 규칙.
// 페이지를 새로 만들거나 주소를 옮기면 여기를 같이 고친다. 메뉴 이름은 NAV, 게임 이름은 GAMES 를 따른다.

// 옮긴 주소. 옮기기 전의 방문도 지금 페이지로 센다 (next.config.mjs 의 redirects 와 같게)
const MOVED = { '/playlab': '/games/fly-darwin' };

// 메뉴 이름만으로는 구분이 안 되는 목록 페이지
const LIST_LABELS = {
  '/games': 'Games 목록',
  '/articles': 'Article 목록',
  '/history': '일상 목록',
};

// 메뉴 밖의 공개 페이지
const OTHER_PAGES = {
  '/privacy': '개인정보처리방침',
  '/terms': '이용약관',
  '/delete-account': '계정 삭제',
};
const UNKNOWN_PAGE = '그 밖의 주소'; // 없는 주소를 찾아온 로봇 등
const DELETED_POST = '지운 글';
const OTHER_MENU = { href: null, label: '그 밖의 페이지' };

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const kstDay = (iso) => new Date(new Date(iso).getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);

const isAdminPage = (page) => page === '/admin' || page.startsWith('/admin/');

// 글 주소는 titles({ '/article/아이디': 제목 })에서 제목을 찾는다
export function describePage(rawPage, titles = {}) {
  const page = MOVED[rawPage] || rawPage;
  const menu = NAV.find((item) => isNavActive(item.href, page));
  if (!menu) return { page, menu: null, label: OTHER_PAGES[page] || UNKNOWN_PAGE };
  if (page.startsWith('/article/') || page.startsWith('/history/')) {
    return { page, menu: menu.href, label: titles[page] || DELETED_POST };
  }
  if (page.startsWith('/games/')) {
    return { page, menu: menu.href, label: getGame(page.slice('/games/'.length))?.title || page };
  }
  return { page, menu: menu.href, label: LIST_LABELS[page] || menu.label };
}

// 유입 경로로 세지 않는 곳: 사이트 안 이동, 구글 로그인에서 돌아온 경우, 게임 서버, 내 컴퓨터에서 연 페이지
const GAME_HOSTS = GAMES.filter((g) => g.embedUrl).map((g) => new URL(g.embedUrl).hostname);
const isInternalHost = (host) =>
  host === 'localhost' ||
  host === '127.0.0.1' ||
  host === 'accounts.google.com' ||
  host === 'finch.co.kr' ||
  host.endsWith('.finch.co.kr') ||
  GAME_HOSTS.some((game) => host === game || host.endsWith(`.${game}`));

function referrerSource(referrer) {
  if (!referrer) return '직접 방문';
  try {
    const host = new URL(referrer).hostname;
    if (isInternalHost(host)) return null;
    if (host.includes('google')) return 'Google';
    if (host.includes('naver')) return 'Naver';
    if (host.includes('youtube')) return 'YouTube';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('twitter') || host === 't.co' || host === 'x.com') return 'X (Twitter)';
    if (host.includes('facebook')) return 'Facebook';
    return host;
  } catch {
    return '기타';
  }
}

const topEntries = (counts, limit) =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

// rows: page_views 의 줄들. 관리자 페이지 방문은 사이트 방문이 아니므로 뺀다.
export function summarizeViews(allRows, titles = {}) {
  const rows = allRows
    .map((row) => ({ ...row, page: row.page || '' }))
    .filter((row) => !isAdminPage(row.page));

  const visitors = new Set();
  const daily = {};
  const referrers = {};
  const pages = {};
  const visitsByPage = {};
  const menus = [...NAV, OTHER_MENU].map((item) => ({
    href: item.href,
    label: item.label,
    views: 0,
    visitors: new Set(),
  }));
  let mobile = 0;

  rows.forEach((row) => {
    visitors.add(row.visitor_id);
    if (row.device === 'mobile') mobile += 1;

    const day = kstDay(row.created_at);
    (daily[day] ||= new Set()).add(row.visitor_id);

    const source = referrerSource(row.referrer);
    if (source) referrers[source] = (referrers[source] || 0) + 1;

    const { page, menu, label } = describePage(row.page, titles);
    pages[label] = (pages[label] || 0) + 1;
    visitsByPage[page] = (visitsByPage[page] || 0) + 1;

    const group = menus.find((item) => item.href === menu);
    group.views += 1;
    group.visitors.add(row.visitor_id);
  });

  const totalPV = rows.length;
  return {
    uniqueVisitors: visitors.size,
    totalPV,
    mobilePercent: totalPV ? Math.round((mobile / totalPV) * 100) : 0,
    dailyStats: Object.entries(daily)
      .map(([date, set]) => ({ date, uv: set.size }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    menus: menus.map((item) => ({
      ...item,
      visitors: item.visitors.size,
      percent: totalPV ? Math.round((item.views / totalPV) * 100) : 0,
    })),
    topReferrers: topEntries(referrers, 5),
    topPages: topEntries(pages, 10),
    visitsByPage,
  };
}
