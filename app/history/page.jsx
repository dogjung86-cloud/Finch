import { createServerSupabase } from '../../src/lib/supabase-server';
import HistoryPageClient from './HistoryPageClient';

export const revalidate = 60;

export const metadata = {
  title: '100년 전 과학 – Finch',
  description: '100년 전, 과학은 어땠을까? 과거의 과학 이야기를 되짚어봅니다.',
};

export default async function HistoryPage() {
  const supabase = createServerSupabase();
  const { data: items } = await supabase
    .from('history_science')
    .select('id,title,thumbnail,date_original,content,source')
    .eq('is_published', true)
    .order('date_original', { ascending: false });

  return <HistoryPageClient items={items || []} />;
}
