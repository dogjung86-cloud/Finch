import AboutPage from '../../src/components/AboutPage';

export const metadata = {
  title: 'Finch 소개 | 과학 매거진 Finch',
  description: '과학을 즐기고, 과학을 읽다 - 과학 매거진 Finch를 소개합니다.',
  alternates: { canonical: '/about' },
};

export default function About() {
  return <AboutPage />;
}
