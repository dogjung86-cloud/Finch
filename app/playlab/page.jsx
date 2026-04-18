import PlayLabClient from './PlayLabClient';

export const metadata = {
  title: 'Play Lab | 과학 게임 – Finch',
  description: '과학 매거진 Finch의 Play Lab. 과학을 게임으로 즐겨보세요 — Fly Darwin부터 다양한 과학 게임이 기다립니다.',
  alternates: { canonical: '/playlab' },
  openGraph: {
    title: 'Play Lab | Finch',
    description: '과학을 게임으로 즐기는 공간, Finch Play Lab',
    url: 'https://www.finch.co.kr/playlab',
    type: 'website',
  },
};

export default function PlayLabPage() {
  return <PlayLabClient />;
}
