// 사이트 전역 정보. 문구나 링크를 바꿀 때는 이 파일만 고치면 된다.

export const SITE = {
  name: '과학드림',
  nameEn: 'Science Dream',
  person: '김정훈',
  url: 'https://www.finch.co.kr',
  email: 'sciencegive@gmail.com',
  // 브라우저 탭·검색 결과에 쓰는 기본 설명
  description:
    '유튜브 과학드림 김정훈의 홈페이지. 영상과 책, 출연작, 직접 만든 과학 게임, 과학 칼럼을 한곳에 모았습니다. 강연과 협업 제안도 여기서 받습니다.',
};

export const CHANNEL = {
  // RSS 로 최신 영상을 불러올 때 쓰는 채널 ID (UC 로 시작)
  id: 'UCIk1-yPCTnFuzfgu4gyfWqw',
  handle: '@ScienceDream',
  url: 'https://www.youtube.com/@ScienceDream',
  subscribeUrl: 'https://www.youtube.com/@ScienceDream?sub_confirmation=1',
  membershipUrl: 'https://www.youtube.com/channel/UCIk1-yPCTnFuzfgu4gyfWqw/join',
  since: 2019,
  // 채널 페이지에 표시되는 숫자를 옮겨 적은 값 (자동 갱신 아님, 2026년 11월 기준)
  subscribers: '115만',
  videoCount: '283개',
  totalViews: '3억+',
  // 채널 소개글 (유튜브 채널 정보에서 그대로 가져옴)
  description: [
    '과학으로 재미와 지식을 더해 드리는 채널입니다.',
    '한 때는 과학을 좋아했던, 지금도 과학을 좋아하는, 그리고 앞으로 과학을 좋아할 사람들이 제 채널과 함께였으면 합니다.',
  ],
};

export const NAV = [
  { href: '/', label: 'Home', ko: '홈' },
  { href: '/about', label: 'About Me', ko: '소개' },
  { href: '/works', label: 'Works', ko: '영상 · 책 · 출연' },
  { href: '/games', label: 'Games', ko: '게임' },
  { href: '/articles', label: 'Article', ko: '칼럼' },
  { href: '/collaborate', label: 'Collaborate', ko: '협업 문의' },
];

export const SOCIALS = [
  { id: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@ScienceDream' },
  { id: 'instagram', label: 'Instagram', href: 'https://instagram.com/sciencegive' },
  { id: 'store', label: '과학드림 스토어', href: 'https://smartstore.naver.com/sciencegive' },
];

// 전자상거래법상 표시 의무 정보 (푸터)
export const BUSINESS = {
  name: '과학드림',
  ceo: '김정훈',
  regNo: '105-26-94462',
  address: '경기도 시흥시 능곡번영길 30, 7층 710-4',
  email: 'sciencegive@gmail.com',
};
