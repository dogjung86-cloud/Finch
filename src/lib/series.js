// 아티클 시리즈 정의 (클라이언트에서도 쓰므로 서버 전용 모듈과 분리)
export const SERIES = {
  column: { id: 'column', label: '요즘 과학', short: 'Column' },
  history: { id: 'history', label: '쓸데없이 재밌는 과학사', short: 'History' },
};

// '요즘 과학' 기사의 분야 (어드민에서 쓰는 카테고리 이름과 같아야 한다)
export const COLUMN_CATEGORIES = ['천문우주', '생명진화', '뇌심리', '지구환경', '물리화학'];
