import TermsClient from './TermsClient';

export const metadata = {
  title: '이용약관',
  description: '과학드림(finch.co.kr) 이용약관.',
  alternates: { canonical: '/terms' },
};

export default function Terms() {
  return <TermsClient />;
}
