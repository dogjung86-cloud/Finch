// 게임 목록. 새 게임을 올릴 때 이 배열에 항목을 추가한다.
//
// access.type
//   'free'      무료
//   'paid'      유료 (price, currency 필요. 결제 연동 시 checkoutUrl 사용 예정)
//   'freemium'  무료 + 인앱 결제
// status
//   'live'  플레이 가능
//   'lab'   개발 중 (목록에 '실험 중' 카드로 표시)
// usesLogin    게임이 사이트 로그인을 쓴다 (true 일 때만 로그인 세션을 게임으로 넘긴다)
// cloudSave    게임 기록을 사이트가 대신 저장한다 (game_saves 표. 로그인 토큰은 게임으로 넘기지 않는다)
// previewEmbeds  ?preview=이름 으로 열 공개 전 판 주소. 실제 로그인으로 시험할 때 쓴다
// tallOnPhone  세로 화면 게임이라 휴대폰에서 플레이 화면을 세로로 길게 잡는다

export const GAMES = [
  {
    slug: 'jangsu-village',
    status: 'live',
    title: '장수거북 빌리지',
    tagline: '내 등에서 자라는 작은 마을',
    summary:
      '아기 장수거북이 되어 바다를 헤엄치며 자라요. 해파리를 먹고 섬과 심해를 찾아다니는 동안 내 등에서 따개비들의 마을이 자라납니다.',
    genre: '3D 코지 · 바다 여행',
    platforms: ['PC', '모바일'],
    access: { type: 'free' },
    cover: {
      src: '/images/games/jangsu-village-cover-1600.webp',
      srcSmall: '/images/games/jangsu-village-cover-900.webp',
      width: 1600,
      height: 786,
    },
    screenshot: '/images/games/jangsu-village-screen-1600.webp',
    embedUrl: 'https://jangsu-village.pages.dev/',
    cloudSave: true,
    previewEmbeds: {
      dev: 'https://dev.jangsu-village.pages.dev/',
      login: 'https://login.jangsu-village.pages.dev/',
    },
    accent: '#7ec8d8',
    tallOnPhone: true,
    highlights: ['내 등에서 자라는 마을', '섬마다 다른 일', '심해 마을', '따개비 이웃'],
    guide: [
      {
        title: '어떤 게임인가요',
        items: [
          '장수거북 빌리지는 아기 장수거북이 되어 넓은 바다를 여행하는 게임입니다.',
          '해파리를 먹을수록 몸이 자라고, 등 위에 이끼가 번지면서 따개비들이 이사 와 마을을 만듭니다.',
          '상상으로 만든 게임이에요. 실제 장수거북의 생태와는 달라요.',
        ],
      },
      {
        title: '조작 방법',
        items: [
          'PC: W A S D 또는 방향키로 헤엄치기, 스페이스로 잠수, R로 쉬기, 끌어서 둘러보기, 휠로 가까이 멀리',
          '모바일: 조이스틱으로 헤엄치기, 화면을 끌어 둘러보기, 두 손가락으로 가까이 멀리',
        ],
      },
      {
        title: '놀이 방법',
        items: [
          '🏝 섬마다 거기서만 되는 일이 있어요. 해내면 등에 건물이 생기고, 건물이 거북의 능력이 됩니다.',
          '🐚 자랄 때마다 바다 쪽, 심해 쪽, 쉼터 쪽 가운데 어느 쪽으로 마을을 넓힐지 고를 수 있어요.',
          '🏮 등불 소라 탑이 생기면 깊은 바다로 내려갈 수 있어요. 심해에는 또 다른 마을이 있습니다.',
        ],
      },
      {
        title: '마을 구경',
        items: [
          '화면을 끝까지 당기거나 마을 구경 버튼(PC는 V)을 누르면 따개비가 되어 등 위를 걸어요.',
          '건물에 다가가면 할 일이 나옵니다.',
        ],
      },
      {
        title: '기록과 소리',
        items: [
          '로그인하면 기록이 계정에도 저장되어 다른 기기에서 이어 할 수 있어요. 로그인하지 않으면 이 브라우저에만 저장돼요.',
          '소리 버튼에서 음악과 효과음 크기를 조절할 수 있어요. 음악은 Kounine의 Wholesome Place vol.2입니다.',
        ],
      },
    ],
  },
  {
    slug: 'fly-darwin',
    status: 'live',
    usesLogin: true,
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

// 의견 게시판의 주제. 출시한 게임은 자동으로 들어간다.
export const BOARD_TOPICS = [
  ...LIVE_GAMES.map((g) => ({ id: g.slug, label: g.title })),
  { id: 'etc', label: '그 밖의 의견' },
];

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
