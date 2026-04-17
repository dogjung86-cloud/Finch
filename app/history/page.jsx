import { createServerSupabase } from '../../src/lib/supabase-server';
import HistoryPageClient from './HistoryPageClient';

export const revalidate = 60;

export const metadata = {
  title: '100년 전 과학 | 과거 신문 속 과학 이야기 – Finch',
  description:
    '100년 전 신문과 저널에 실렸던 과학 기사를 다시 읽는다. 과학의 역사와 발자취를 따라가는 과학 매거진 Finch.',
  alternates: { canonical: '/history' },
  openGraph: {
    title: '100년 전 과학 | Finch',
    description: '100년 전 신문 속 과학 기사 – 과학의 역사를 되짚다',
    url: 'https://www.finch.co.kr/history',
    type: 'website',
  },
};

export default async function HistoryPage() {
  const supabase = createServerSupabase();
  const { data: items } = await supabase
    .from('history_science')
    .select('id,title,thumbnail,date_original,content,source,created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  return <HistoryPageClient items={items || []} />;
}
