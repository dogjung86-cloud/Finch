import PrivacyClient from './PrivacyClient';

export const metadata = {
  title: '개인정보처리방침 | 과학 매거진 Finch',
  description: 'Finch 개인정보처리방침.',
  alternates: { canonical: '/privacy' },
};

export default function Privacy() {
  return <PrivacyClient />;
}
