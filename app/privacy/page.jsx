import PrivacyClient from './PrivacyClient';

export const metadata = {
  title: '개인정보처리방침',
  description: '과학드림(finch.co.kr) 개인정보처리방침.',
  alternates: { canonical: '/privacy' },
};

export default function Privacy() {
  return <PrivacyClient />;
}
