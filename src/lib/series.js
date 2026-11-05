// 아티클 시리즈 정의 (클라이언트에서도 쓰므로 서버 전용 모듈과 분리)
export const SERIES = {
  column: { id: 'column', label: '과학 칼럼', adminLabel: '과학 기사', short: 'Column' },
  history: { id: 'history', label: '일상', adminLabel: '일상 기록', short: 'History' },
};

// 과학 칼럼의 분야 (어드민에서 쓰는 카테고리 이름과 같아야 한다)
export const COLUMN_CATEGORIES = ['천문우주', '생명진화', '뇌심리', '지구환경', '물리화학'];
