import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { createServerSupabase } from './supabase-server';
import { stripHtmlToProse } from './htmlText';
import { DEV_SAMPLE_COLUMNS, DEV_SAMPLE_HISTORY } from '../data/devSamples';

// Supabase 가 연결되지 않은 로컬 개발 환경에서만 대신 쓰는 데이터.
// scripts/pull-live-articles.mjs 로 받아 둔 공개 사이트 글 사본이 있으면 그 글을, 없으면 샘플을 쓴다.
// 배포(production)에서는 절대 쓰지 않는다.
const isDev = () => process.env.NODE_ENV === 'development';
const LIVE_COPY = path.join(process.cwd(), '.dev-content', 'live.json');

function readLiveCopy() {
  if (!isDev()) return null;
  try {
    return JSON.parse(fs.readFileSync(LIVE_COPY, 'utf8'));
  } catch {
    return null;
  }
}

// kind: 'articles' (과학 칼럼) | 'history' (일상)
function devRows(kind) {
  if (!isDev()) return [];
  const live = readLiveCopy();
  if (live) return live[kind] || [];
  return kind === 'articles' ? DEV_SAMPLE_COLUMNS : DEV_SAMPLE_HISTORY;
}

const byNewest = (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0);

export { SERIES } from './series';

function toColumnItem(a) {
  return {
    key: `column-${a.id}`,
    series: 'column',
    href: `/article/${a.id}`,
    title: a.title,
    excerpt: a.excerpt || '',
    thumbnail: a.thumbnail || null,
    thumbPos: '50% 50%',
    category: a.category && a.category !== '미분류' ? a.category : null,
    author: a.author || null,
    date: a.created_at || null,
  };
}

function toHistoryItem(h) {
  return {
    key: `history-${h.id}`,
    series: 'history',
    href: `/history/${h.id}`,
    title: h.title,
    excerpt: h.excerpt ?? stripHtmlToProse(h.content || '', 110),
    thumbnail: h.thumbnail || null,
    thumbPos: h.thumbnail_position || '50% 50%',
    category: null,
    author: h.source || null,
    dateLabel: h.date_original || null,
    date: h.created_at || null,
  };
}

// 홈 노출용: 어드민 display_order 슬롯마다 최신 1개 (기존 홈과 같은 규칙)
export async function getCuratedColumns(limit = 8) {
  const supabase = createServerSupabase();
  let rows;
  if (supabase) {
    const { data } = await supabase
      .from('articles')
      .select('id,title,excerpt,thumbnail,author,category,created_at,display_order')
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    rows = data || [];
  } else {
    // Supabase 정렬과 같게: 슬롯 번호 오름차순(빈 값은 맨 뒤), 같은 슬롯은 최신 글 먼저
    const slot = (a) => a.display_order ?? Infinity;
    rows = [...devRows('articles')].sort((a, b) => slot(a) - slot(b) || byNewest(a, b));
  }
  const seen = new Set();
  return rows
    .filter((a) => {
      if (seen.has(a.display_order)) return false;
      seen.add(a.display_order);
      return true;
    })
    .slice(0, limit)
    .map(toColumnItem);
}

export async function getAllColumns() {
  const supabase = createServerSupabase();
  if (!supabase) return [...devRows('articles')].sort(byNewest).map(toColumnItem);
  const { data } = await supabase
    .from('articles')
    .select('id,title,excerpt,thumbnail,author,category,created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  return (data || []).map(toColumnItem);
}

export async function getHistoryItems(limit) {
  const supabase = createServerSupabase();
  if (!supabase) {
    const rows = [...devRows('history')].sort(byNewest);
    return (limit ? rows.slice(0, limit) : rows).map(toHistoryItem);
  }
  let q = supabase
    .from('history_science')
    .select('id,title,thumbnail,thumbnail_position,date_original,content,source,created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return (data || []).map(toHistoryItem);
}

// 글 하나. 상세 페이지 본문과 메타데이터가 같이 쓰므로 요청마다 한 번만 읽는다.
// 로컬에서는 받아 둔 사본에 있는 글만 열리고, 샘플 글은 본문이 없어 404 가 된다.
export const getColumnById = cache(async (id) => {
  const supabase = createServerSupabase();
  if (!supabase) return readLiveCopy()?.articles?.find((a) => a.id === id) ?? null;
  const { data, error } = await supabase.from('articles').select('*').eq('id', id).single();
  return error ? null : data;
});

export const getHistoryById = cache(async (id) => {
  const supabase = createServerSupabase();
  if (!supabase) return readLiveCopy()?.history?.find((h) => h.id === id) ?? null;
  const { data, error } = await supabase
    .from('history_science')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();
  return error ? null : data;
});

export function sortByDateDesc(items) {
  return [...items].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}
