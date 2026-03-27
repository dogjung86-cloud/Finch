import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from './lib/supabase';

// 컴포넌트
import Navbar from './components/Navbar';
import HeroGame from './components/HeroGame';
import GameCarousel, { GAME_LIST } from './components/GameCarousel';
import MagazineGrid from './components/MagazineGrid';
import Footer from './components/Footer';
import ArticlePage from './components/ArticlePage';
import AboutPage from './components/AboutPage';
import LoginModal from './components/LoginModal';
import AdminPage from './components/AdminPage';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';

/* ── URL → 페이지 상태 파싱 ── */
function parseUrl(path = window.location.pathname) {
  if (path.startsWith('/article/')) return { page: 'article', articleId: path.split('/article/')[1] };
  if (path === '/about') return { page: 'about' };
  if (path === '/admin') return { page: 'admin' };
  if (path === '/terms') return { page: 'terms' };
  if (path === '/privacy') return { page: 'privacy' };
  return { page: 'home' };
}

export default function App() {
  // ── 페이지 라우팅 (URL 기반) ──
  const initialRoute = useMemo(() => parseUrl(), []);
  const [currentPage, setCurrentPage] = useState(initialRoute.page);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [pendingArticleId, setPendingArticleId] = useState(initialRoute.articleId || null);

  // ── 인증 (Supabase Auth) ──
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const ADMIN_EMAIL = 'sciencegive@gmail.com';
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url,
        });
      }
    });

    // 세션 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url,
        });
        setShowLoginModal(false);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── URL 변경 함수 ──
  const navigateTo = useCallback((page, data = {}) => {
    let path = '/';
    if (page === 'article' && data.article) path = `/article/${data.article.id}`;
    else if (page === 'about') path = '/about';
    else if (page === 'admin') path = '/admin';
    else if (page === 'terms') path = '/terms';
    else if (page === 'privacy') path = '/privacy';

    window.history.pushState({ page, ...data }, '', path);
    setCurrentPage(page);
    if (data.article) setSelectedArticle(data.article);
  }, []);

  // ── 브라우저 뒤로/앞으로 버튼 ──
  useEffect(() => {
    const handlePopState = (e) => {
      const route = parseUrl();
      setCurrentPage(route.page);
      if (route.page === 'article' && route.articleId) {
        setPendingArticleId(route.articleId);
      } else {
        setSelectedArticle(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ── URL에서 직접 기사 접근 시 로드 ──
  useEffect(() => {
    if (!pendingArticleId || selectedArticle) return;
    const fetchArticle = async () => {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('id', pendingArticleId)
        .single();
      if (data) {
        setSelectedArticle(data);
        setCurrentPage('article');
      } else {
        setCurrentPage('home');
        window.history.replaceState({}, '', '/');
      }
      setPendingArticleId(null);
    };
    fetchArticle();
  }, [pendingArticleId, selectedArticle]);

  // ── 포인트 / 레벨 ──
  const [points, setPoints] = useState(() =>
    parseInt(localStorage.getItem('scidream_points') || '0', 10)
  );
  const [level, setLevel] = useState(() =>
    parseInt(localStorage.getItem('scidream_level') || '1', 10)
  );

  // ── 게임 선택 ──
  const [selectedGameId, setSelectedGameId] = useState('cosmic-flight');
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [isGamePlaying] = useState(true);

  const selectedGame = GAME_LIST.find((g) => g.id === selectedGameId);

  // ── 스크롤 기반 활성 섹션 추적 ──
  const [activeSection, setActiveSection] = useState('home');
  const heroRef = useRef(null);
  const gamesRef = useRef(null);
  const magazineRef = useRef(null);

  useEffect(() => {
    if (currentPage !== 'home') return;

    const sections = [
      { id: 'home', ref: heroRef },
      { id: 'games', ref: gamesRef },
      { id: 'magazine', ref: magazineRef },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = sections.find((s) => s.ref.current === entry.target);
            if (section) setActiveSection(section.id);
          }
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );

    sections.forEach(({ ref }) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, [currentPage]);

  // 포인트 → localStorage & 레벨
  useEffect(() => {
    localStorage.setItem('scidream_points', String(points));
    const newLevel = Math.floor(points / 500) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      localStorage.setItem('scidream_level', String(newLevel));
    }
  }, [points, level]);

  const handleScoreChange = useCallback((score) => {
    setPoints((prev) => prev + Math.floor(score / 10));
  }, []);

  // 네비게이션
  const handleSectionChange = (section) => {
    if (section === 'about') {
      navigateTo('about');
      setActiveSection('about');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 다른 페이지에서 홈으로
    if (currentPage !== 'home') {
      navigateTo('home');
      setSelectedArticle(null);
      setActiveSection(section);
      // 약간의 지연 후 스크롤 (렌더링 대기)
      setTimeout(() => {
        const refMap = { home: heroRef, games: gamesRef, magazine: magazineRef };
        const target = refMap[section];
        if (target?.current) {
          const navbarHeight = 60;
          const top = target.current.getBoundingClientRect().top + window.scrollY - navbarHeight;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    const refMap = { home: heroRef, games: gamesRef, magazine: magazineRef };
    const target = refMap[section];
    if (target?.current) {
      const navbarHeight = 60;
      const top = target.current.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // 게임 선택
  const handleSelectGame = (id) => {
    setSelectedGameId(id);
    setTutorialOpen(false);
  };

  // 기사 클릭
  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    navigateTo('article', { article });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 기사 → 홈 돌아가기
  const handleBackFromArticle = () => {
    navigateTo('home');
    setSelectedArticle(null);
    setTimeout(() => {
      if (magazineRef.current) {
        const navbarHeight = 60;
        const top = magazineRef.current.getBoundingClientRect().top + window.scrollY - navbarHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 100);
  };

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // ── 관리자 페이지 ──
  if (currentPage === 'admin') {
    return (
      <>
        <Navbar
          activeSection="admin"
          onSectionChange={handleSectionChange}
          user={user}
          onLoginClick={() => setShowLoginModal(true)}
          onSignupClick={() => setShowLoginModal(true)}
          onLogout={handleLogout}
          onAdminClick={() => navigateTo('admin')}
          isAdmin={isAdmin}
        />
        <AdminPage
          onBack={() => {
            navigateTo('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      <Footer onNavigate={(page) => navigateTo(page)} />
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
          />
        )}
      </>
    );
  }

  // ── 기사 상세 페이지 ──
  if (currentPage === 'article' && selectedArticle) {
    return (
      <>
        <Navbar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          user={user}
          onLoginClick={() => setShowLoginModal(true)}
          onSignupClick={() => setShowLoginModal(true)}
          onLogout={handleLogout}
          onAdminClick={() => navigateTo('admin')}
          isAdmin={isAdmin}
        />
        <ArticlePage
          article={selectedArticle}
          onBack={handleBackFromArticle}
          user={user}
          onLoginRequest={() => setShowLoginModal(true)}
        />
      <Footer onNavigate={(page) => navigateTo(page)} />
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
          />
        )}
      </>
    );
  }

  // ── About 페이지 ──
  if (currentPage === 'about') {
    return (
      <>
        <Navbar
          activeSection="about"
          onSectionChange={handleSectionChange}
          user={user}
          onLoginClick={() => setShowLoginModal(true)}
          onSignupClick={() => setShowLoginModal(true)}
          onLogout={handleLogout}
          onAdminClick={() => navigateTo('admin')}
          isAdmin={isAdmin}
        />
        <AboutPage />
        <Footer onNavigate={(page) => navigateTo(page)} />
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
          />
        )}
      </>
    );
  }

  // ── 이용약관 페이지 ──
  if (currentPage === 'terms') {
    return (
      <>
        <TermsPage onBack={() => { navigateTo('home'); window.scrollTo(0, 0); }} />
        <Footer onNavigate={(page) => navigateTo(page)} />
      </>
    );
  }

  // ── 개인정보처리방침 페이지 ──
  if (currentPage === 'privacy') {
    return (
      <>
        <PrivacyPage onBack={() => { navigateTo('home'); window.scrollTo(0, 0); }} />
        <Footer onNavigate={(page) => navigateTo(page)} />
      </>
    );
  }

  // ── 홈 페이지 ──
  return (
    <>
      <Navbar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        user={user}
        onLoginClick={() => setShowLoginModal(true)}
        onSignupClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        onAdminClick={() => navigateTo('admin')}
        isAdmin={isAdmin}
      />

      <div ref={heroRef}>
        <HeroGame
          onScoreChange={handleScoreChange}
        />
      </div>

      <div ref={gamesRef}>
        <GameCarousel
          selectedGameId={selectedGameId}
          onSelectGame={handleSelectGame}
          isGamePlaying={isGamePlaying}
        />

        {/* ── 튜토리얼 상세 패널 ── */}
        {selectedGame && (
          <div className="tutorial-panel-wrap">
            <button
              className={`tutorial-toggle ${tutorialOpen ? 'tutorial-toggle--open' : ''}`}
              onClick={() => setTutorialOpen(!tutorialOpen)}
            >
              <span className="tutorial-toggle__icon">📖</span>
              <span>Fly Darwin 상세 가이드</span>
              <span className={`tutorial-toggle__arrow ${tutorialOpen ? 'tutorial-toggle__arrow--open' : ''}`}>▼</span>
            </button>

            {tutorialOpen && (
              <div className="tutorial-detail">
                <div className="tutorial-detail__content">
                  {selectedGame.tutorialDetail?.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) return <h2 key={i} className="tutorial-detail__h2">{line.replace('## ', '')}</h2>;
                    if (line.startsWith('### ')) return <h3 key={i} className="tutorial-detail__h3">{line.replace('### ', '')}</h3>;
                    if (line.startsWith('- ')) return <li key={i} className="tutorial-detail__li">{line.replace('- ', '')}</li>;
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} className="tutorial-detail__p">{line}</p>;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 물결 전환 ── */}
      <div className="wave-transition">
        <svg viewBox="0 0 1440 140" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,40 C360,100 720,0 1080,40 C1260,60 1380,55 1440,40 L1440,100 C1380,115 1260,120 1080,100 C720,60 360,160 0,100 Z" fill="#F2F2F2" />
          <path d="M0,60 C240,20 480,80 720,60 C960,40 1200,70 1440,60 L1440,110 C1200,120 960,90 720,110 C480,130 240,70 0,110 Z" fill="#E8E8E8" opacity="0.45" />
        </svg>
      </div>

      <div ref={magazineRef}>
        <MagazineGrid onArticleClick={handleArticleClick} />
      </div>

      <Footer onNavigate={(page) => navigateTo(page)} />

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </>
  );
}
