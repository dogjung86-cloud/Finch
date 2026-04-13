'use client';

import { useRouter } from 'next/navigation';
import PrivacyPage from '../../src/components/PrivacyPage';

export default function Privacy() {
  const router = useRouter();
  return <PrivacyPage onBack={() => { router.push('/'); window.scrollTo(0, 0); }} />;
}
