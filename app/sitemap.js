import { createServerSupabase } from '../src/lib/supabase-server';
import { LIVE_GAMES } from '../src/data/games';

const BASE_URL = 'https://www.finch.co.kr';

export default async function sitemap() {
  const now = new Date();

  const staticRoutes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/works', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/games', priority: 0.8, changeFrequency: 'monthly' },
    ...LIVE_GAMES.map((g) => ({ path: `/games/${g.slug}`, priority: 0.7, changeFrequency: 'monthly' })),
    { path: '/articles', priority: 0.9, changeFrequency: 'daily' },
    { path: '/history', priority: 0.8, changeFrequency: 'daily' },
    { path: '/collaborate', priority: 0.7, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  ].map((r) => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const supabase = createServerSupabase();
  if (!supabase) return staticRoutes;

  const [articlesRes, historyRes] = await Promise.all([
    supabase.from('articles').select('id, created_at').eq('is_published', true),
    supabase.from('history_science').select('id, created_at').eq('is_published', true),
  ]);

  const articleRoutes = (articlesRes.data || []).map((a) => ({
    url: `${BASE_URL}/article/${a.id}`,
    lastModified: a.created_at ? new Date(a.created_at) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const historyRoutes = (historyRes.data || []).map((h) => ({
    url: `${BASE_URL}/history/${h.id}`,
    lastModified: h.created_at ? new Date(h.created_at) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...articleRoutes, ...historyRoutes];
}
