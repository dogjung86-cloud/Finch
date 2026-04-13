import { createServerSupabase } from '../src/lib/supabase-server';
import HomePageClient from './HomePageClient';

export default async function HomePage() {
  const supabase = createServerSupabase();
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(6);

  return <HomePageClient articles={articles || []} />;
}
