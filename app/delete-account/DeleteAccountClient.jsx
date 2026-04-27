'use client';

import { useRouter } from 'next/navigation';
import DeleteAccountPage from '../../src/components/DeleteAccountPage';

export default function DeleteAccountClient() {
  const router = useRouter();
  return <DeleteAccountPage onBack={() => { router.push('/'); window.scrollTo(0, 0); }} />;
}
