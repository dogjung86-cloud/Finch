// 로컬 개발(Supabase 미연결)에서 레이아웃 확인용으로만 쓰는 샘플 데이터.
// production 빌드에서는 content.js 가 이 데이터를 절대 사용하지 않는다.
const day = (n) => new Date(Date.now() - n * 86400000).toISOString();

export const DEV_SAMPLE_COLUMNS = [
  { id: 's1', title: '(샘플) 공룡 미라의 피부는 어떻게 수천만 년을 버텼을까', excerpt: '부드러운 조직이 화석으로 남는 드문 조건과, 그 덕분에 새로 알게 된 사실들을 정리했습니다.', thumbnail: null, author: '과학드림', category: '생명진화', created_at: day(1), display_order: 1 },
  { id: 's2', title: '(샘플) 상어는 왜 4억 년 동안 거의 그대로일까', excerpt: '살아 있는 화석이라는 말 뒤에 숨은 진화의 속도 이야기.', thumbnail: '/images/games/fly-darwin-cover-900.webp', author: '과학드림', category: '생명진화', created_at: day(3), display_order: 2 },
  { id: 's3', title: '(샘플) 달의 뒷면은 왜 앞면과 이렇게 다르게 생겼나', excerpt: '두꺼운 지각과 화산 활동의 차이가 만든 비대칭.', thumbnail: null, author: '과학드림', category: '천문우주', created_at: day(5), display_order: 3 },
  { id: 's4', title: '(샘플) 개미 군체는 어떻게 길을 잃지 않을까', excerpt: '페로몬 길과 태양 나침반, 그리고 걸음 수 세기.', thumbnail: null, author: '과학드림', category: '뇌심리', created_at: day(8), display_order: 4 },
  { id: 's5', title: '(샘플) 빙하가 녹으면 땅이 솟아오른다', excerpt: '무게가 사라진 대륙이 천천히 되튀어 오르는 현상.', thumbnail: null, author: '과학드림', category: '지구환경', created_at: day(12), display_order: 5 },
  { id: 's6', title: '(샘플) 물은 왜 4도에서 가장 무거울까', excerpt: '수소 결합이 만드는 이상한 물의 성질.', thumbnail: null, author: '과학드림', category: '물리화학', created_at: day(15), display_order: 6 },
];

export const DEV_SAMPLE_HISTORY = [
  { id: 'h1', title: '(샘플) 1926년, 기차보다 빠른 비둘기 경주', excerpt: '전보보다 빨랐던 전서구 이야기를 당시 신문으로 다시 읽습니다.', thumbnail: '/images/games/fly-darwin-screen-1600.webp', thumbnail_position: '50% 50%', date_original: '1926년 5월', source: 'Popular Science', created_at: day(2) },
  { id: 'h2', title: '(샘플) 라디오로 식물을 키운다던 실험', excerpt: '전파가 작물을 자라게 한다는 믿음은 어떻게 퍼졌을까.', thumbnail: null, thumbnail_position: '50% 50%', date_original: '1925년 3월', source: 'Science News', created_at: day(6) },
  { id: 'h3', title: '(샘플) 화성 운하 논쟁의 마지막 장면', excerpt: '망원경 너머의 선을 두고 벌어진 백 년 전 토론.', thumbnail: null, thumbnail_position: '50% 30%', date_original: '1924년 8월', source: 'Scientific American', created_at: day(9) },
];
