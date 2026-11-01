// 게임 목록. 새 게임을 올릴 때 이 배열에 항목을 추가한다.
//
// access.type
//   'free'      무료
//   'paid'      유료 (price, currency 필요. 결제 연동 시 checkoutUrl 사용 예정)
//   'freemium'  무료 + 인앱 결제
// status
//   'live'  플레이 가능
//   'lab'   개발 중 (목록에 '실험 중' 카드로 표시)

export const GAMES = [
  {
    slug: 'fly-darwin',
    status: 'live',
    title: 'Fly Darwin',
    tagline: 'Fly into the Evolution',
    summary:
      '아메바에서 출발해 다윈의 핀치새까지. 장애물을 피하고 코인을 모으고 보스를 물리치며 진화하는 3D 비행 게임입니다.',
    genre: '3D 비행 · 진화',
    platforms: ['PC', '모바일'],
    access: { type: 'free' },
    cover: {
      src: '/images/games/fly-darwin-cover-1600.webp',
      srcSmall: '/images/games/fly-darwin-cover-900.webp',
      width: 1600,
      height: 786,
    },
    screenshot: '/images/games/fly-darwin-screen-1600.webp',
    embedUrl: 'https://fly-darwin.vercel.app/',
    accent: '#8fcdee',
    highlights: ['1,500m마다 진화', '보스전', '특수 비행체', '출석 · 일일 미션'],
    guide: [
      {
        title: '어떤 게임인가요',
        items: [
          'Fly Darwin은 진화를 주제로 한 3D 비행 게임입니다.',
          '아메바에서 시작해 장애물을 피하고, 코인을 모으고, 보스를 격파하며 다윈의 핀치새까지 진화해 나가세요.',
          '멀리 날수록 캐릭터가 진화하고, 모은 코인으로 특수 비행체와 업그레이드를 살 수 있습니다.',
        ],
      },
      {
        title: '조작 방법',
        items: [
          'PC: 마우스로 이동, 보스전에서는 마우스를 클릭하거나 누르고 있으면 공격, ESC 또는 P로 일시정지',
          '모바일: 화면을 터치하고 드래그해서 이동, 보스전에서는 터치하면 자동 발사, ⏸ 버튼으로 일시정지',
        ],
      },
      {
        title: '게임 규칙',
        items: [
          '🧬 진화: 1,500m마다 레벨이 오르며 캐릭터가 자동으로 진화합니다.',
          '👹 보스: 보스 체력이 25% 이하가 되면 분노 모드가 발동해 공격이 잦아집니다.',
          '🛸 특수 비행체: 다윈의 핀치새에 도달하거나 거리 미션을 달성하면 해금되고, 상점에서 살 수 있습니다.',
        ],
      },
      {
        title: '기타 요소',
        items: [
          '🍇 무적 열매: 900m마다 등장하며 5초간 무적 (핀치새는 10초, UFO는 30초)',
          '🌪️ 난기류: 3,000m부터 가끔 발생하고, 조작이 흔들립니다.',
          '🕳️ 블랙홀: 가까이 가면 속도가 느려지는 희귀 장애물',
          '▶️ 이어서 하기: 최대 3회 (50 / 200 / 300 코인)',
        ],
      },
      {
        title: '게임 팁',
        items: [
          '📅 출석 보상을 꼬박꼬박 챙기세요. 7일 연속 출석하면 보너스 100코인을 받습니다.',
          '📋 일일 미션을 확인하세요. 매일 2개의 미션이 배정되고, 완료 후 보상을 받으면 코인이 더 쌓입니다.',
        ],
      },
    ],
  },
  { slug: null, status: 'lab', title: '다음 게임', note: '실험실에서 조립 중' },
  { slug: null, status: 'lab', title: '그다음 게임', note: '아이디어 배양 중' },
];

export const LIVE_GAMES = GAMES.filter((g) => g.status === 'live');

export function getGame(slug) {
  return GAMES.find((g) => g.slug === slug) || null;
}

export function accessLabel(access) {
  if (!access || access.type === 'free') return '무료';
  if (access.type === 'freemium') return '무료 · 인앱 구매';
  if (access.type === 'paid' && access.price) {
    return `${access.price.toLocaleString('ko-KR')}원`;
  }
  return '유료';
}
