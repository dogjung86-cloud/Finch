// 협업 문의 양식에서 쓰는 선택지와 안내 문구

export const COLLAB_KINDS = [
  { id: 'talk', label: '강연 · 특강', desc: '학교, 도서관, 과학관, 기관, 박람회 강연' },
  { id: 'show', label: '방송 · 유튜브 출연', desc: '방송 프로그램, 다른 채널 출연과 대담' },
  { id: 'content', label: '기관 · 브랜드 콘텐츠', desc: '연구기관, 기업과 함께 만드는 과학 영상' },
  { id: 'advice', label: '자문 · 감수', desc: '과학 콘텐츠 자문, 감수, 고증' },
  { id: 'publish', label: '출판 · 기고', desc: '책, 칼럼, 원고 청탁' },
  { id: 'etc', label: '기타 제안', desc: '그 밖의 재밌는 아이디어' },
];

// 실제로 함께한 곳 (출연 영상과 언론 보도로 확인된 곳만)
export const COLLAB_REFERENCES = [
  '국립중앙과학관',
  '국립과천과학관',
  '한국연구재단',
  '한국원자력연구원',
  '한국해양과학기술원',
  '해양수산과학기술진흥원',
  '국가과학기술인력개발원',
  'YTN 사이언스',
  '대한민국 과학축제',
  '경상남도 평생학습 박람회',
];

export const PRIVACY_NOTICE = {
  items: '이름, 이메일, 소속(선택)',
  purpose: '협업 문의 확인과 회신',
  retention: '문의 처리가 끝나면 지체 없이 파기 (법령상 보관 의무가 있는 경우 그 기간 동안 보관)',
};
