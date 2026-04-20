import TermsClient from './TermsClient';

export const metadata = {
  title: '이용약관 | 과학 매거진 Finch',
  description: 'Finch 이용약관.',
  alternates: { canonical: '/terms' },
};

export default function Terms() {
  return <TermsClient />;
}
