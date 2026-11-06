// Works 페이지 데이터: 대표 영상 · 책 · 출연작
// 새 책이나 출연 영상이 생기면 아래 배열에 항목을 추가한다.
// 영상 id 는 유튜브 주소의 v= 뒤에 오는 11자리 값이다.

// 과학드림 채널 인기 영상 (2026년 11월 기준 조회수)
export const FEATURED_VIDEOS = [
  { id: 'wd1RG5BIsqE', title: '사람을 먹으면 안 되는 매우 과학적인 이유!', views: 12262600, date: '2020-05-22' },
  { id: 'kAtfE1rcvq8', title: '200만 년간의 장마, 그 결과 등장한 동물은?', views: 10605831, date: '2022-03-18' },
  { id: 'oA2PaUmv4ho', title: '바나나는 씨가 없는데 어떻게 재배할까?｜바나나에 숨겨진 놀라운 사실 Top3', views: 7213992, date: '2019-08-30' },
  { id: 'T0v1SrL70Jg', title: '세계에서 가장 위험한 혈액형!', views: 6930517, date: '2020-12-18' },
  { id: '5AgBxdrsce8', title: '초거대 상어 메갈로돈은 왜 멸종했을까?', views: 6423148, date: '2019-10-11' },
  { id: 'igMIB7U8Ijk', title: '지구 역사상 가장 지루했던 10억 년!｜무슨 일이 있었던 걸까?', views: 6211865, date: '2021-12-24' },
  { id: 'J_1C7iWYBa4', title: '어떤 심해 생물들은 왜 이토록 거대해졌을까?', views: 5212739, date: '2022-09-09' },
  { id: 'm-vSiXH4-7g', title: '2cm짜리 벌레가 자신보다 몇 배나 큰 개구리를 잡아먹는 방법!', views: 5039280, date: '2022-06-10' },
];

// 쓴 책 (최신순)
export const BOOKS = [
  {
    slug: 'creator-imagine',
    title: '과학 크리에이터가 되는 상상 어때?',
    subtitle: '창비 발견의 첫걸음 8',
    authors: '김정훈(과학드림), 이다혜',
    publisher: '창비',
    year: 2024,
    date: '2024-09-27',
    isbn: '9788936453282',
    cover: 'https://image.aladin.co.kr/product/34819/49/cover500/8936453289_1.jpg',
    description:
      '이공계 진로를 고민하는 청소년을 위한 진로 탐색서입니다. 과학 크리에이터라는 직업의 실제 모습과 준비 과정, 그리고 재능보다 성실함이 더 강한 무기라는 이야기를 담았습니다. 이다혜 작가와 함께 엮었습니다.',
    links: [
      { label: '알라딘', href: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=348194943' },
      { label: '교보문고', href: 'https://product.kyobobook.co.kr/detail/S000214413012' },
    ],
  },
  {
    slug: 'scary-science',
    title: '과학드림의 무섭게 빠져드는 과학책',
    subtitle: '읽다 보면 어느새 과학이 쉬워진다!',
    authors: '김정훈(과학드림)',
    publisher: '더퀘스트',
    year: 2023,
    date: '2023-10-20',
    isbn: '9791140706372',
    badge: '2024 세종도서 교양 부문',
    cover: 'https://image.aladin.co.kr/product/32611/41/cover500/k812935543_2.jpg',
    description:
      '지구의 역사, 고대 생물, 동물, 인류, 환경 다섯 갈래로 우주의 탄생부터 오늘날의 기후 문제까지 짚어 가는 두 번째 과학 교양서입니다. 2024 세종도서 교양 부문에 선정되었습니다.',
    links: [
      { label: '알라딘', href: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=326114160' },
      { label: '교보문고', href: 'https://product.kyobobook.co.kr/detail/S000209744293' },
    ],
  },
  {
    slug: 'weird-science',
    title: '과학드림의 이상하게 빠져드는 과학책',
    subtitle: '읽다 보면 저절로 똑똑해지는 과학 이야기',
    authors: '김정훈(과학드림)',
    publisher: '더퀘스트',
    year: 2022,
    date: '2022-05-20',
    isbn: '9791165219734',
    cover: 'https://image.aladin.co.kr/product/29442/87/cover500/k222837523_1.jpg',
    description:
      '과학드림 채널의 이야기를 처음 책으로 옮겼습니다. 사람, 공룡, 동물, 곤충, 식물 다섯 장에 걸쳐 "왜 이렇게 됐을까?" 싶은 질문에 답하고, 250컷이 넘는 일러스트를 함께 담았습니다.',
    links: [
      { label: '알라딘', href: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=294428738' },
      { label: '교보문고', href: 'https://product.kyobobook.co.kr/detail/S000061352564' },
    ],
  },
];

// 여러 편에 출연한 기관과 방송사. 새 영상이 올라오면 videos 맨 앞에 추가한다.
// 제목은 원래 영상 제목에서 프로그램 이름처럼 겹치는 말만 덜어 냈다.
// org: 기관 이름, program: 프로그램 이름, playlist: 유튜브 재생목록 id (프로그램이 하나일 때만)
// 프로그램이 둘 이상인 기관은 영상마다 kicker 에 프로그램 이름을 적는다.
export const APPEARANCE_GROUPS = [
  {
    slug: 'ytn-science',
    org: 'YTN 사이언스',
    program: '이프?랭크!',
    desc: "'만약'을 과학으로 풀어 보는 토크쇼입니다. 매회 주제를 정해 TOP 5를 겨룹니다.",
    playlist: 'PLCDnMDlH37XGKGfsBhq4qTx_cY2qV7jaN',
    videos: [
      { id: 'HWTANXJnlks', title: '[EP.33] 당신의 3살 이전 기억은 강제로 ‘봉인’ 당했다? 소름돋는 뇌의 비밀', date: '2026-10-30' },
      { id: 'tdmeEhLKwjY', title: '[EP.32] 한국인 30%는 사랑니가 안 나는 이유 (ft. 음식과 유전자)', date: '2026-10-21' },
      { id: 'n7ZdyL0FV2Q', title: '[EP.31] 외계인보다 연구 가치 높은 지구 최고의 생물? 인류를 구한 1mm의 비밀', date: '2026-10-13' },
      { id: 'bbgzKGkA-J4', title: '[EP.30] 선크림이 자외선을 튕겨낸다고요? 우리가 믿었던 상식의 배신 ㄷㄷ', date: '2026-09-30' },
      { id: 'WNdj9VoQEcQ', title: '[EP.29] 우주보다 미스터리한 바다🌊 심해 6,000m에서 발견된 외계 생명체의 정체', date: '2026-09-19' },
      { id: '5GDvfwOJeZM', title: '[EP.28] 홈런이냐, 뜬공이냐!⚾ 가을 야구 승패를 가르는 스포츠 속 물리학 (Feat. 김범준 교수)', date: '2026-09-12' },
      { id: 'I05jhHZC6tY', title: '[EP.27] 🚨티라노사우루스도 벌벌 떨었다?! 역사상 가장 강력한 고생물 TOP 5 🦖', date: '2026-08-31' },
      { id: 'cJzWSm7CGkA', title: '[EP.26] "나도 스파이더맨이 되고싶어..!" 훔치고 싶은 대자연의 초능력 TOP 5', date: '2026-08-24' },
      { id: 'U-6t_afu-kI', title: '[EP.25] "숨만 쉬어도 1년에 126억 개" 미세 플라스틱이 몸에 계속 쌓이다가는..?', date: '2026-08-12' },
      { id: 'oDL2RzfcAlo', title: '[EP.24] 몸과 뇌가 엇갈렸다! 내 몸이 통제를 벗어나는 순간들', date: '2026-07-31' },
      { id: '5evMdbqXNME', title: '[EP.23] 러브버그는 애교 수준?! 사람 목숨까지 위협하는 최악의 외래종 TOP 5', date: '2026-07-21' },
      { id: 'roBd4tF7s5o', title: '[EP.22] 피지컬 AI가 노동을 100% 대신한다면 우리 몸은 어떻게 진화할까?', date: '2026-07-10' },
      { id: 'eqG4NuTQkLE', title: '[EP.21] 2029년 지구 근접, 남은 시간은 단 3년? ‘시티 킬러’ 소행성 충돌 시 벌어질 최악의 시나리오 TOP 5', date: '2026-06-30' },
      { id: 'AMkMjeUxww0', title: '[EP.20] 우리 발밑은 안전할까? ‘깨어나는 순간 재앙’ 전 세계 가장 위험한 단층 TOP 5', date: '2026-06-19' },
      { id: 'VfPy-CAC6Yc', title: "[EP.19] 똑같이 먹어도 나만 살찌는 억울한 이유? 비만도 사실 '전염'되는 감염병이다!", date: '2026-06-10' },
      { id: 'ljP95c4kN78', title: '[EP.18] 죽음을 일시 정지 하시겠습니까?…무서운 속도로 발전하는 냉동 보존 기술', date: '2026-05-31' },
      { id: 'w5Jesl4-nNI', title: '[EP.17] 빙하가 전부 녹으면 생기는 일…대한민국에서 살아남는 도시는 단 한 곳?!', date: '2026-05-21' },
      { id: 'SlMcV69pulg', title: '[EP.16] ‘석유의 수천만 배 가치’…인류가 달에 갈 수밖에 없는 진짜 이유', date: '2026-05-11' },
      { id: 'pdNRHlCw0So', title: '[EP.15] 석유는 왜 이렇게 중요할까? 인류 문명이 석유가 없으면 붕괴하는 이유', date: '2026-04-28' },
      { id: 'HFHBlwTMeqA', title: '[EP.14] 히말라야 5000m에서 발견된 수백 구의 해골 ㄷㄷ;; 과학자들도 경악한 역대급 미스터리', date: '2026-04-21' },
      { id: 'BOZEdPfiOc0', title: '[EP.13] “3월에 44도?” 전 세계 덮친 이상현상... 봄이 진짜 사라지면 벌어질 일 TOP 5', date: '2026-04-13' },
      { id: 'v5uDrXXF4VQ', title: '[EP.12] 멸종 생물이 돌아온다?!…매머드부터 공룡까지, 다시 만날 수 있을까 TOP 5', date: '2026-03-31' },
      { id: 'iNsGNlBJNW8', title: '[EP.11] ‘치사율 100%’…인류를 무너뜨릴 최악의 바이러스 TOP 5', date: '2026-03-22' },
      { id: 'hV7IEWj063c', title: '[EP.10] 만약 중력이 ‘잠깐’ 사라진다면... 지구에 벌어질 일 TOP 5', date: '2026-03-11' },
      { id: '3gpH4GZw3kM', title: '[EP.9] 풀리면 노벨상?! 아직 아무도 모르는 과학 미스터리 TOP 5', date: '2026-02-27' },
      { id: 'L-G4RGXVCfg', title: '[EP.8] 목표는 생존이다! 진화의 상식을 뒤엎은 생물 TOP 5', date: '2026-02-18' },
      { id: '3h8SUI-c5i8', title: '[EP.7] AI에게 다 맡기면, 인간은 퇴화한다? 약해지는 뇌 기능 TOP 5', date: '2026-02-11' },
      { id: 'DnRJgR6BRNI', title: '[EP.6] 터지면 재앙 시작! 인류를 멈춰 세울 화산 TOP 5', date: '2026-01-30' },
      { id: 'Wk5VchVE2oM', title: '[EP.5] 인류가 사라진 날, 지구의 왕이 된 곤충들 TOP 5', date: '2026-01-21' },
      { id: 'AGp7nMkjxtY', title: '[EP.4] 우주여행이 일상이 된다면? 우리가 가장 먼저 걱정해야 할 질병 TOP 5', date: '2026-01-12' },
      { id: 'ogiudSDG98o', title: '[EP.3] 폐광이 AI 데이터센터로? 미래 과학이 태어날 이색장소들 TOP 5', date: '2025-12-31' },
      { id: 'Qj81lO6i4qw', title: '[EP.2] 연금술이 현실이 된다면? 금을 만들 수 있는 세상에서 벌어질 일 TOP 5', date: '2025-12-21' },
      { id: '199164lQkdU', title: '[EP.1] 도심 쥐 폭증? 좀비 바이러스 창궐? 기후변화가 계속되면 지구에 벌어질 일 TOP 5', date: '2025-12-11' },
    ],
  },
  {
    slug: 'nst',
    org: '국가과학기술연구회(NST)',
    program: '과학다방',
    desc: '카페 같은 분위기에서 연구자들을 만나 과학 이야기를 나누는 토크쇼입니다.',
    playlist: 'PLYfvFzp0udPi5Qj6K-_Zm6lvekP_gdz-k',
    videos: [
      { id: 'enB6ucRMXrU', title: '[6편] 목넘김이 시원한 증류주 개발부터 두피 건강에 좋은 하수오 원물까지! 열정이 담긴 증류주 이야기', date: '2026-09-30' },
      { id: 'Ar3ea3iLuF0', title: '[5편] 과학으로 완성하는 K-증류주의 미래', date: '2026-09-16' },
      { id: 'VRJAs7B7eBg', title: '[4편] 모다리부터 유도 블랙벨트까지, 애정을 채워주는 사랑의 배터리 이야기', date: '2026-07-27' },
      { id: '-gL3Q7TJ-98', title: '[3편] 습식부터 전고체 배터리까지 다 알려줄게', date: '2026-07-10' },
      { id: '0lpUHu9bDHg', title: "[2편] 쿠버네티스 뱃지부터 조혈모세포 기증서까지, '뇌섹남' 과학자들이 AI와 살아가는 법", date: '2026-05-28' },
      { id: 'WszTBPpn520', title: '[1편] 하네스? 오마이클로드? AI, 어디까지 알고있니?', date: '2026-05-20' },
    ],
  },
  {
    slug: 'nier',
    org: '국립환경과학원',
    program: '그곳이 알고 싶다 · 인사이드라이브',
    desc: '평소 쉽게 볼 수 없는 연구 시설을 찾아가고, 일상 속 환경 이야기를 연구자들과 나눕니다.',
    videos: [
      { id: 'zItEPSBTq0w', kicker: '그곳이 알고 싶다', title: '[EP.3] 국립환경과학원 안에 진짜 집이 있다?! (실내환경 융합 실증시험동 편)', date: '2026-10-30' },
      { id: 'MejVVeMx_dA', kicker: '그곳이 알고 싶다', title: '[EP.2] 내 차 배출가스, 여기서 판정한다?! (모빌리티환경연구센터 편)', date: '2026-10-23' },
      { id: '13CYiKWzFG4', kicker: '그곳이 알고 싶다', title: '[EP.1] 사람의 혈액을 영하 196도에서 보관하는 곳 (국가환경보건시료은행 편)', date: '2026-10-16' },
      { id: 'xffmLA1rOLY', kicker: '인사이드라이브', title: '[하이라이트 & 미방분] 알아두면 쓸모 있는 과학 잡학 지식!', date: '2026-09-25' },
      { id: 'Fv2u0bpUzII', kicker: '인사이드라이브', title: '[EP.03] 오늘 공기 정말 안전한가요?', date: '2026-09-11' },
      { id: '1-B-vgxkxjU', kicker: '인사이드라이브', title: '[EP.02] 당신의 서랍 속 숨은 자원', date: '2026-09-04' },
      { id: '3P7TvBH4xWQ', kicker: '인사이드라이브', title: '[EP.01] 내 몸에 기록되는 한 끼(?)의 흔적', date: '2026-08-28' },
    ],
  },
  {
    slug: 'gwacheon',
    org: '국립과천과학관',
    program: '심심할 땐 과학 시즌5',
    desc: '무대 장치와 소리, 조명, 특수분장에 숨은 과학을 파헤칩니다.',
    videos: [
      { id: 'ev5U8rmL7yg', title: '[EP.04] 이거 실화...? 과학드림이 촬영 중 10분 만에 50년 늙어버린 이유!', date: '2026-01-23' },
      { id: 'YlsFYz5cvfg', title: '[EP.03] 무대를 살아 움직이게 하는 힘, 조명에 있다?!', date: '2026-01-09' },
      { id: '5cCw5TkkrIA', title: '[EP.02] 무대를 장악하는 소리에... 과학의 비밀이?', date: '2025-12-26' },
      { id: 'CCDiuBdGNFw', title: '[EP.01] 무대 마술? ✨ 무대 기술? 🎭 무대 기술에도 과학이?! 🔬⚙️', date: '2025-12-12' },
    ],
  },
  {
    slug: 'kps',
    org: '한전KPS',
    program: '기술의 급이 다른 썰',
    desc: '전기와 발전 설비에 숨은 원리를 함께 파헤칩니다.',
    videos: [
      { id: '-u8bmIuy-E8', title: '[기술의 급이 다른 썰] 전기에도 품질이 있을까?', date: '2026-10-27' },
      { id: 'RwOpaCDTIwc', title: '[기술의 급이 다른 썰] 가족이 모이는 추석, 전기는 더 바빠집니다.', date: '2026-09-22' },
    ],
  },
  {
    slug: 'nfqs',
    org: '국립수산물품질관리원',
    program: '꼬리에 꼬리를 무는 수산생물 검역 이야기',
    desc: '곽재식 작가와 함께 수산생물 국경검역이 왜 중요한지 이야기합니다.',
    videos: [
      { id: 'P6bQ7wEufGI', title: '꼬리에 꼬리를 무는 수산생물 검역 이야기 (1편)', date: '2024-08-21' },
      { id: 'ffLP4whtxpw', title: '꼬리에 꼬리를 무는 수산생물 검역 이야기 (2편)', date: '2024-08-21' },
    ],
  },
  {
    slug: 'nssc',
    org: '원자력안전위원회',
    program: '원자력 안전드림',
    desc: '핵안보부터 소형모듈원자로, 방사성 폐기물, 생활방사선까지 전문가와 함께 알아봅니다.',
    videos: [
      { id: 'Q1kp67fIWrU', title: '[원자력 안전드림] 4편 생활방사선을 알려드림!', date: '2024-06-25' },
      { id: 'k0RN0MDn2XE', title: '[원자력 안전드림] 3편 방사성 폐기물을 알려드림!', date: '2024-06-18' },
      { id: '8M3wf5SI06c', title: '[원자력 안전드림] 2편 소형모듈원자로(SMR)를 알려드림!', date: '2024-06-11' },
      { id: 'JWC1Zpvvhiw', title: '[원자력 안전드림] 1편 핵안보·핵비확산을 알려드림!', date: '2024-06-04' },
    ],
  },
];

// 그 밖의 다른 채널 · 방송 출연 (최신순). 제목은 원래 영상 제목 그대로.
export const APPEARANCES = [
  { id: 'ZCYIa_pMgkw', title: '폐이불을 탐내는 회사 SK케미칼', channel: 'SK케미칼', date: '2026-05-14' },
  { id: '1cc8tbiE5pA', title: '[KIMST X 과학드림] 위험천만한 북극의 극한을 이기는 기술 🤖📡 ｜ 극한지 협동이동체 시스템', channel: '해양수산과학기술진흥원', date: '2026-03-06' },
  { id: 'S80y7easzSA', title: '[수산수다2🐟] 김에 대해 알아두면 쓸모 있는 신비한 잡학사전', channel: '수협 공식 유튜브 채널', date: '2026-01-19' },
  { id: 'Znb5texoSlU', title: '인류 멸종 시나리오가 이미 시작됐다 | feat.과학드림 & 썬킴', channel: '과장창', date: '2025-11-05' },
  { id: 'ExRcxhdco8Q', title: '원자력을 맛있게 낋여 드리고 찵여 드리는 토크쇼 – 과학드림과 함께 하는 [원자력을 부탁해] 🍳', channel: '과학하는 원연이(한국원자력연구원)', date: '2025-09-02' },
  { id: 'SL8kZNwuePE', title: '[궤도X과학드림] 여태 궤소리를 이렇게 잘 받아주는 사람은 없었다', channel: '스페이스 허브 TV', date: '2023-11-30' },
  { id: '1izvv0lBOqs', title: '[궤도X과학드림] 심해보다 우주를 더 좋아하는 과학적인 이유', channel: '스페이스 허브 TV', date: '2023-11-16' },
  { id: 'OJdybEz6dxM', title: "[저기, 잠깐만요] 눈을 뗄 수 없이 재미있는 과학 콘텐츠 '과학드림' / YTN 사이언스", channel: 'YTN 사이언스', date: '2023-09-01' },
  { id: 'Z8YEzO6dE0k', title: '꼬리에 꼬리를 무는 암 이야기(이현숙 교수, 과학드림)', channel: '국가과학기술인력개발원 (KIRD)', date: '2023-01-04' },
  { id: 'eOZEBq6qxE0', title: '사이언스오블리주_공룡복원에 대한 모든 것_1편 (서울대 이융남 교수X과학드림X공룡영재 김건우)', channel: '국가과학기술인력개발원 (KIRD)', date: '2021-06-29' },
];
