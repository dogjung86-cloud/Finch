'use client';

import { useRouter } from 'next/navigation';
import TermsPage from '../../src/components/TermsPage';

export default function Terms() {
  const router = useRouter();
  return <TermsPage onBack={() => { router.push('/'); window.scrollTo(0, 0); }} />;
}
