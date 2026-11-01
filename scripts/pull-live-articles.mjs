// 공개 사이트에 올라가 있는 칼럼(요즘 과학)과 과학사 글을 받아 로컬 개발용 사본으로 저장한다.
// Supabase 접속 정보가 없는 로컬에서도 Article 메뉴에 실제 글이 보이게 하려는 용도다.
//
// 사용법: node scripts/pull-live-articles.mjs [https://www.finch.co.kr]
// 결과: .dev-content/live.json (git 에는 올리지 않는다)
// 개발 서버(npm run dev)만 이 파일을 읽고, 배포 빌드는 언제나 Supabase 에서 직접 읽는다.
// 글 목록은 사이트맵에서, 글 내용은 각 글 페이지에 실려 오는 데이터에서 꺼낸다.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = (process.argv[2] || 'https://www.finch.co.kr').replace(/\/+$/, '');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.dev-content', 'live.json');

// route: 글 주소, prop: 페이지가 화면 컴포넌트에 넘기는 이름, key: 저장할 때 쓰는 이름
const KINDS = [
  { route: 'article', prop: 'article', key: 'articles' },
  { route: 'history', prop: 'item', key: 'history' },
];

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (finch dev copy)' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

// 페이지 HTML 에 나눠 실린 React 서버 컴포넌트 데이터(self.__next_f)를 하나로 이어 붙인다
function readFlight(html) {
  let flight = '';
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)) flight += JSON.parse(m[1]);
  return flight;
}

// 행 형식은 "<id>:<JSON>\n", 긴 글자는 "<id>:T<바이트 길이(16진수)>,<글자>"
function parseRows(flight) {
  const buf = Buffer.from(flight, 'utf8');
  const rows = new Map();
  let i = 0;
  while (i < buf.length) {
    const colon = buf.indexOf(0x3a, i);
    if (colon < 0) break;
    const id = buf.subarray(i, colon).toString('utf8');
    if (buf[colon + 1] === 0x54) {
      const comma = buf.indexOf(0x2c, colon);
      const len = parseInt(buf.subarray(colon + 2, comma).toString('utf8'), 16);
      rows.set(id, { text: buf.subarray(comma + 1, comma + 1 + len).toString('utf8') });
      i = comma + 1 + len;
    } else {
      let nl = buf.indexOf(0x0a, colon);
      if (nl < 0) nl = buf.length;
      rows.set(id, { json: buf.subarray(colon + 1, nl).toString('utf8') });
      i = nl + 1;
    }
  }
  return rows;
}

// "$12" 같은 참조를 실제 값으로 바꾼다. "$$" 로 시작하면 원래 "$" 로 시작하는 글자다
function resolve(value, rows) {
  if (typeof value === 'string' && value[0] === '$') {
    if (value[1] === '$') return value.slice(1);
    if (value === '$undefined') return undefined;
    const row = /^\$[0-9a-f]+$/.test(value) ? rows.get(value.slice(1)) : null;
    if (row?.text != null) return row.text;
    if (row?.json != null) return resolve(JSON.parse(row.json), rows);
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => resolve(v, rows));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, rows)]));
  }
  return value;
}

function findRecord(node, prop, id) {
  if (!node || typeof node !== 'object') return null;
  if (!Array.isArray(node) && node[prop]?.id === id) return node[prop];
  for (const v of Object.values(node)) {
    const found = findRecord(v, prop, id);
    if (found) return found;
  }
  return null;
}

async function pullOne(kind, id) {
  const rows = parseRows(readFlight(await get(`${BASE}/${kind.route}/${id}`)));
  for (const { json } of rows.values()) {
    if (!json || !json.includes(`"${kind.prop}":{`)) continue;
    const record = findRecord(JSON.parse(json), kind.prop, id);
    if (record) return resolve(record, rows);
  }
  throw new Error(`글 데이터를 찾지 못함: /${kind.route}/${id}`);
}

// 공개 사이트에 부담을 주지 않도록 한 번에 4개까지만 받는다
async function mapLimit(list, limit, fn) {
  const out = new Array(list.length);
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const i = next++;
      out[i] = await fn(list[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  return out;
}

const locs = [...(await get(`${BASE}/sitemap.xml`)).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
const result = { source: BASE, fetchedAt: new Date().toISOString() };
let failed = 0;

for (const kind of KINDS) {
  const pattern = new RegExp(`^/${kind.route}/([^/]+)$`);
  const ids = [...new Set(locs.map((u) => new URL(u).pathname.match(pattern)?.[1]).filter(Boolean))];
  const records = await mapLimit(ids, 4, async (id) => {
    try {
      return await pullOne(kind, decodeURIComponent(id));
    } catch (e) {
      failed++;
      console.warn(`  건너뜀: ${e.message}`);
      return null;
    }
  });
  result[kind.key] = records
    .filter(Boolean)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  console.log(`/${kind.route}: ${result[kind.key].length}편`);
}

if (!result.articles.length && !result.history.length) {
  console.error('받은 글이 하나도 없어서 저장하지 않았습니다.');
  process.exit(1);
}
await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, JSON.stringify(result, null, 1));
console.log(`저장: ${path.relative(ROOT, OUT)}${failed ? ` (실패 ${failed}건)` : ''}`);
