const fs = require('fs');
const path = require('path');

// config.json 우선 → 없으면 config.json.example fallback
const SKILL_DIR_GUESS = path.resolve(__dirname, '..');
const CFG_PATH = fs.existsSync(path.join(SKILL_DIR_GUESS, 'config.json'))
  ? path.join(SKILL_DIR_GUESS, 'config.json')
  : path.join(SKILL_DIR_GUESS, 'config.json.example');
const cfg = JSON.parse(fs.readFileSync(CFG_PATH, 'utf8'));
console.log('config:', CFG_PATH);

const ROOT = cfg.nautilus_archive;
const SKILL_DIR = cfg.skill_dir || SKILL_DIR_GUESS;
const STATE_DIR = path.join(SKILL_DIR, 'state');
const TMPL_PATH = path.join(SKILL_DIR, 'templates/selector.html');
const ITEMS_PATH = path.join(STATE_DIR, 'items.json');
const ITEMS_KO_PATH = path.join(STATE_DIR, 'items-ko.json');
const HISTORY_PATH = path.join(STATE_DIR, 'history.json');
const SELECTOR_PATH = path.join(STATE_DIR, 'selector.html');

function toForward(p) {
  return p.split(path.sep).join('/');
}

function stripHtml(s) {
  return String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

const out = [];
const dirs = fs.readdirSync(ROOT);
for (const dir of dirs) {
  const full = path.join(ROOT, dir);
  let stat;
  try { stat = fs.statSync(full); } catch (e) { continue; }
  if (!stat.isDirectory()) continue;
  const metaPath = path.join(full, 'metadata.json');
  if (!fs.existsSync(metaPath)) continue;
  let m;
  try { m = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch (e) { continue; }
  out.push({
    archive_dir: toForward(full),
    article_md_path: toForward(path.join(full, 'article.md')),
    metadata_path: toForward(metaPath),
    title: m.title || '',
    subtitle: stripHtml(m.subtitle || ''),
    author: m.author || '',
    date: m.date || '',
    url: m.url || '',
    body_length: m.bodyLength || 0,
  });
}

// items-ko.json이 있으면 title_ko / summary_ko 필드 머지
if (fs.existsSync(ITEMS_KO_PATH)) {
  try {
    const koMap = JSON.parse(fs.readFileSync(ITEMS_KO_PATH, 'utf8'));
    for (const it of out) {
      const ko = koMap[it.archive_dir];
      if (ko) {
        it.title_ko = ko.title_ko || '';
        it.summary_ko = ko.summary_ko || '';
      }
    }
    console.log('items-ko merged:', Object.keys(koMap).length);
  } catch (e) {
    console.log('items-ko.json read failed:', e.message);
  }
} else {
  console.log('items-ko.json not found — 영문 원본만 사용');
}

// history.json 있으면 이미 발행된 기사에 used 플래그
if (fs.existsSync(HISTORY_PATH)) {
  try {
    const hist = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
    const usedSet = new Set((hist.used_archive_dirs || []).map(s => s.replace(/\\/g, '/')));
    let usedCount = 0;
    for (const it of out) {
      if (usedSet.has(it.archive_dir)) {
        it.used = true;
        it.used_at = (hist.used_at && hist.used_at[it.archive_dir]) || null;
        usedCount++;
      }
    }
    console.log('used history merged:', usedCount);
  } catch (e) {
    console.log('history.json read failed:', e.message);
  }
}

fs.writeFileSync(ITEMS_PATH, JSON.stringify(out));
console.log('items collected:', out.length);

const tmpl = fs.readFileSync(TMPL_PATH, 'utf8');
const html = tmpl.split('__ITEMS_PLACEHOLDER__').join(JSON.stringify(out));
console.log('placeholder remaining?', html.includes('__ITEMS_PLACEHOLDER__'));
fs.writeFileSync(SELECTOR_PATH, html);
console.log('selector.html written:', SELECTOR_PATH);
