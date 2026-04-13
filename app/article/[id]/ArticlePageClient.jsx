'use client';

import { useRouter } from 'next/navigation';
import ArticlePage from '../../../src/components/ArticlePage';
import { useAuth } from '../../../src/providers/AuthProvider';

export default function ArticlePageClient({ article }) {
  const router = useRouter();
  const { user, setShowLoginModal } = useAuth();

  const handleBack = () => {
    router.push('/');
  };

  return (
    <ArticlePage
      article={article}
      onBack={handleBack}
      user={user}
      onLoginRequest={() => setShowLoginModal(true)}
    />
  );
}
