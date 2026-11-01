// 개발 서버에 떠 있는 사이트를 서버 없이 더블클릭으로 열어 볼 수 있는 HTML 폴더로 저장한다.
// 헤드리스 Chrome 으로 페이지를 하나씩 열어 다 그려진 화면의 HTML 을 받은 뒤,
// 스크립트를 빼고 사이트 안 주소를 상대 경로로 바꾸고 이미지와 CSS 를 함께 복사한다.
// 탭, 더보기, 모바일 메뉴 같은 화면 동작은 scripts/preview-runtime.js 가 사본에서 흉내 내고,
// 로그인이나 폼 보내기처럼 서버가 있어야 하는 동작은 사본에서 되지 않는다.
//
// 사용법: node scripts/snapshot.mjs <저장할 폴더> [개발 서버 주소]
//   예) npm run dev 를 켠 상태에서 node scripts/snapshot.mjs "D:/Finch/과학드림 홈페이지 미리보기"
// 결과: <저장할 폴더>/홈페이지 열기.html 과 <저장할 폴더>/site/ 폴더

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [outArg, baseArg = 'http://localhost:3100'] = process.argv.slice(2);
if (!outArg) {
  console.error('사용법: node scripts/snapshot.mjs <저장할 폴더> [개발 서버 주소]');
  process.exit(1);
}

const BASE = baseArg.replace(/\/+$/, '');
const OUT = path.resolve(outArg);
const SITE_DIR = path.join(OUT, 'site');
const MARKER = path.join(SITE_DIR, '.snapshot');
const RUNTIME_SOURCE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'preview-runtime.js');
const RUNTIME_FILE = '_assets/preview.js';
// 칼럼 글이 페이지 하나씩이라 글이 늘어도 다 담기도록 넉넉하게 둔다
const MAX_PAGES = 400;
// 사본에 넣지 않는 주소: 관리자, API, 계정 관련
const SKIP_ROUTE = /^\/(admin|api|auth|delete-account|_next)(\/|$)/;
const ASSET_EXT = /\.(webp|png|jpe?g|gif|svg|ico|avif|mp4|webm|css|js|woff2?|ttf|otf|json|txt|xml|pdf)$/i;

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => p && existsSync(p));

if (!CHROME) {
  console.error('Chrome 을 찾지 못했습니다. CHROME_PATH 환경 변수로 chrome.exe 위치를 알려 주세요.');
  process.exit(1);
}
// 다른 폴더를 실수로 지우지 않도록, 이 스크립트가 만든 site 폴더만 새로 덮어쓴다
if (existsSync(SITE_DIR) && !existsSync(MARKER)) {
  console.error(`${SITE_DIR} 폴더가 이미 있는데 이 스크립트가 만든 것이 아니라서 건드리지 않았습니다.`);
  process.exit(1);
}
try {
  await fetch(BASE, { method: 'HEAD' });
} catch {
  console.error(`${BASE} 에 개발 서버가 떠 있지 않습니다. 먼저 npm run dev 를 켜 주세요.`);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 헤드리스 Chrome 연결 ──
const profile = await mkdtemp(path.join(os.tmpdir(), 'snapshot-chrome-'));
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

async function pageSocketUrl() {
  for (let i = 0; i < 75; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error('Chrome 개발자 도구에 연결하지 못했습니다.');
}

const ws = new WebSocket(await pageSocketUrl());
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
const listeners = new Set();
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  } else if (msg.method) {
    listeners.forEach((fn) => fn(msg));
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

function waitForEvent(method, ms) {
  return new Promise((resolve) => {
    const fn = (msg) => {
      if (msg.method !== method) return;
      clearTimeout(timer);
      listeners.delete(fn);
      resolve(msg.params);
    };
    const timer = setTimeout(() => {
      listeners.delete(fn);
      resolve(null);
    }, ms);
    listeners.add(fn);
  });
}

async function evaluate(expression) {
  const { result, exceptionDetails } = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result.value;
}

// 끝까지 한 번 스크롤해 늦게 불러오는 이미지(유튜브 썸네일 대체 화질 포함)까지 다 띄운 뒤,
// 스크립트를 뺀 HTML 과 페이지 안 링크 목록을 돌려준다
const CAPTURE_JS = `(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // 글과 영상을 전부 펼쳐서 저장한다. 처음 상태로 다시 접는 일은 preview-runtime.js 가 사본에서 한다
  document.querySelector('.hub .tab[data-series="all"]')?.click();
  await wait(200);
  for (let i = 0; i < 100; i++) {
    const more = document.querySelector('.hub__more button');
    if (!more) break;
    more.click();
    await wait(250);
  }
  document.querySelectorAll('.video-more button[aria-expanded="false"]').forEach((button) => button.click());
  await wait(300);
  for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
    scrollTo(0, y);
    await wait(150);
  }
  for (let round = 0; round < 6; round++) {
    const loading = [...document.images].filter((img) => !img.complete);
    if (!loading.length && round > 0) break;
    await Promise.all(loading.map((img) => new Promise((r) => {
      img.addEventListener('load', r, { once: true });
      img.addEventListener('error', r, { once: true });
      setTimeout(r, 8000);
    })));
    await wait(400);
  }
  scrollTo(0, 0);
  await wait(400);
  const root = document.documentElement;
  // 스크롤 등장 효과는 스크립트가 있어야 풀리므로 사본에서는 처음부터 다 보이게 한다
  root.classList.remove('reveal-ready');
  document
    .querySelectorAll('script:not([type="application/ld+json"]), link[as="script"], link[rel="modulepreload"], nextjs-portal, next-route-announcer, [data-next-hide-fouc]')
    .forEach((el) => el.remove());
  // 개발 서버 오류 창이 넣는 글꼴 스타일도 뺀다
  document.querySelectorAll('style').forEach((el) => { if (el.textContent.includes('__nextjs')) el.remove(); });
  // 읽기 진행 막대는 스크롤을 따라 움직여야 하는데 사본에서는 멈춘 채 남으므로 뺀다
  document.querySelectorAll('.read-progress').forEach((el) => el.remove());
  return {
    html: '<!DOCTYPE html>\\n' + root.outerHTML,
    links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
  };
})()`;

// ── 주소 바꾸기 ──
function routeOf(href) {
  if (!href || !href.startsWith('/') || href.startsWith('//')) return null;
  const { pathname } = new URL(href, BASE);
  if (SKIP_ROUTE.test(pathname) || ASSET_EXT.test(pathname)) return null;
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
}

const pageFile = (route) => (route === '/' ? 'index.html' : `${decodeURIComponent(route.slice(1))}.html`);

function assetFile(pathname) {
  const p = decodeURIComponent(pathname);
  return p.startsWith('/_next/static/') ? `_assets/${p.slice('/_next/static/'.length)}` : p.slice(1);
}

function relative(fromFile, toFile) {
  const rel = path.posix.relative(path.posix.dirname(fromFile), toFile);
  return rel
    .split('/')
    .map((s) => (s === '..' ? s : encodeURIComponent(s)))
    .join('/');
}

const pages = new Map(); // 경로 → { file, html }
const assets = new Map(); // site 안 파일 경로 → 개발 서버에서 받을 주소

// 사이트 안 주소 하나를 사본 기준 상대 경로로 바꾼다. 바깥 주소, #, mailto: 는 그대로 둔다
function localize(value, fromFile) {
  if (!value.startsWith('/') || value.startsWith('//')) return value;
  const url = new URL(value, BASE);
  if (url.pathname === '/_next/image') {
    const original = url.searchParams.get('url') || '';
    return original.startsWith('/') ? localize(original, fromFile) : original || value;
  }
  if (ASSET_EXT.test(url.pathname) || url.pathname.startsWith('/_next/')) {
    const file = assetFile(url.pathname);
    assets.set(file, url.pathname + url.search);
    return relative(fromFile, file);
  }
  const page = pages.get(routeOf(value));
  // 사본에 없는 페이지(샘플 글, 관리자 등)는 null 을 돌려주고, 링크에서는 주소를 뺀다
  return page ? relative(fromFile, page.file) + url.hash : null;
}

const decodeAttr = (s) => s.replace(/&amp;/g, '&');
const encodeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function rewriteHtml(html, fromFile) {
  return html
    .replace(/(\s(?:href|src|poster|action))="([^"]*)"/g, (match, name, raw) => {
      const value = decodeAttr(raw);
      const next = localize(value, fromFile);
      if (next === null) return '';
      return next === value ? match : `${name}="${encodeAttr(next)}"`;
    })
    .replace(/(\s(?:srcset|imagesrcset))="([^"]*)"/g, (match, name, raw) => {
      const value = decodeAttr(raw);
      const next = value
        .split(',')
        .map((candidate) => {
          const [u, ...descriptor] = candidate.trim().split(/\s+/);
          return [localize(u, fromFile) ?? u, ...descriptor].join(' ');
        })
        .join(', ');
      return `${name}="${encodeAttr(next)}"`;
    })
    .replace(/url\((&quot;|["']?)(\/[^"')&]+)\1\)/g, (match, q, value) => `url(${q}${encodeAttr(localize(value, fromFile) ?? value)}${q})`);
}

async function save(file, data) {
  const target = path.join(SITE_DIR, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

// ── 실행 ──
// 한국 시간, 예: 2026-11-01 18:22
const stamp = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 16).replace('T', ' ');
try {
  await send('Page.enable');
  await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  console.log(`페이지 저장 중 (${BASE})`);
  const queue = ['/'];
  const seen = new Set(queue);
  while (queue.length && pages.size < MAX_PAGES) {
    const route = queue.shift();
    let status = 0;
    const onResponse = (msg) => {
      // 페이지 안 iframe 응답이 아니라 첫 문서 응답의 상태만 본다
      if (!status && msg.method === 'Network.responseReceived' && msg.params.type === 'Document') status = msg.params.response.status;
    };
    listeners.add(onResponse);
    const loaded = waitForEvent('Page.loadEventFired', 120_000);
    await send('Page.navigate', { url: BASE + route });
    await loaded;
    listeners.delete(onResponse);
    if (status >= 400) {
      console.warn(`  건너뜀 ${route} (${status})`);
      continue;
    }
    await sleep(1200);
    const { html, links } = await evaluate(CAPTURE_JS);
    pages.set(route, { file: pageFile(route), html });
    console.log(`  ${route}`);
    for (const href of links) {
      const next = routeOf(href);
      if (next && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }

  // 다 받은 다음에 예전 사본을 지우고 새로 쓴다
  await rm(SITE_DIR, { recursive: true, force: true });
  const note = `<!-- 과학드림 홈페이지 미리보기 사본 (${stamp} 기준, scripts/snapshot.mjs 로 만듦) -->`;
  for (const { file, html } of pages.values()) {
    const runtimeTag = `<script src="${relative(file, RUNTIME_FILE)}"></script></body>`;
    await save(
      file,
      rewriteHtml(html, file)
        .replace(/^<!DOCTYPE html>\n/, `<!DOCTYPE html>\n${note}\n`)
        .replace('</body>', () => runtimeTag),
    );
  }
  await save(RUNTIME_FILE, await readFile(RUNTIME_SOURCE));

  // CSS 안에서 다시 이미지나 글꼴을 부르면 그것도 받는다
  const done = new Set();
  let missing = 0;
  for (let again = true; again; ) {
    again = false;
    for (const [file, src] of [...assets]) {
      if (done.has(file)) continue;
      done.add(file);
      again = true;
      const res = await fetch(BASE + src);
      if (!res.ok) {
        missing++;
        console.warn(`  받지 못함 ${src} (${res.status})`);
        continue;
      }
      let body = Buffer.from(await res.arrayBuffer());
      if (file.endsWith('.css')) {
        const css = body
          .toString('utf8')
          .replace(/url\((["']?)(\/[^"')]+)\1\)/g, (match, q, value) => `url(${q}${localize(value, file) ?? value}${q})`);
        body = Buffer.from(css, 'utf8');
      }
      await save(file, body);
    }
  }

  await writeFile(MARKER, `${stamp}\n`);
  await writeFile(
    path.join(OUT, '홈페이지 열기.html'),
    `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=site/index.html">
<title>과학드림 홈페이지 미리보기</title>
</head>
<body>
<p><a href="site/index.html">과학드림 홈페이지 미리보기 열기</a> (${stamp} 기준)</p>
</body>
</html>
`,
  );
  console.log(`완료: 페이지 ${pages.size}개, 파일 ${done.size - missing}개`);
  console.log(`열기: ${path.join(OUT, '홈페이지 열기.html')}`);
} catch (e) {
  console.error('실패:', e.message);
  process.exitCode = 1;
} finally {
  ws.close();
  chrome.kill();
  await sleep(500);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
