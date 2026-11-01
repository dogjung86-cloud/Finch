'use client';

import ArticlePage from '../../../src/components/ArticlePage';
import { useAuth } from '../../../src/providers/AuthProvider';

export default function ArticlePageClient({ article }) {
  const { user, setShowLoginModal } = useAuth();

  return (
    <ArticlePage
      article={article}
      user={user}
      onLoginRequest={() => setShowLoginModal(true)}
    />
  );
}
