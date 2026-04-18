export const FONT_SIZES = [18, 20, 22, 24];

// 기사 본문 렌더링 직전 줄바꿈 보정.
export const fixLineBreaks = (html) =>
  html
    .replace(/\u200B/g, '')
    .replace(/([가-힣])~/g, '$1\u2060~')
    .replace(/(^|[\s>])([^\s<>]{1,3}~)\s/g, '$1$2\u00A0')
    .replace(/(\d+(?:\.\d+)?%)([가-힣])/g, '$1\u2060$2')
    .replace(/([가-힣])\(/g, '$1\u2060(')
    .replace(/\)([가-힣])/g, ')\u2060$1');
