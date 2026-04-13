'use client';

import { useRouter } from 'next/navigation';
import AdminPage from '../../src/components/AdminPage';

export default function Admin() {
  const router = useRouter();

  return (
    <AdminPage
      onBack={() => {
        router.push('/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    />
  );
}
