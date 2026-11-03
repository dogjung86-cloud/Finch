// 메뉴별 그림과 색. 홈 카드와 각 메뉴 페이지 머리에서 함께 쓴다.
// 그림 5장은 아치 위치와 모양이 픽셀까지 같고, color 는 그림 앞 종이 색과 같은 값이다.
// 그림을 다시 만들면 아치를 다시 맞춘다 (원본과 편집 스크립트: D:\home-style-mockups\final\align_arch.py).

export const CHAPTERS = {
  about: { href: '/about', title: 'About Me', label: '소개와 약력', color: '#ae3a1e', ink: '#fbf6ec', image: '/images/chapters/about' },
  works: { href: '/works', title: 'Works', label: '영상 · 책 · 출연', color: '#093842', ink: '#fbf6ec', image: '/images/chapters/works' },
  games: { href: '/games', title: 'Games', label: '과학 게임', color: '#d18f2d', ink: '#1c1b18', image: '/images/chapters/games' },
  article: { href: '/articles', title: 'Article', label: '과학 칼럼 · 기록', color: '#515837', ink: '#fbf6ec', image: '/images/chapters/article' },
  collaborate: { href: '/collaborate', title: 'Collaborate', label: '강연 · 협업 문의', color: '#213c58', ink: '#fbf6ec', image: '/images/chapters/collaborate' },
};

export const CHAPTER_ORDER = ['about', 'works', 'games', 'article', 'collaborate'];
