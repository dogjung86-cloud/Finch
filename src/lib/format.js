// 날짜·숫자 표시 도우미

// 서버(UTC)와 방문자 브라우저의 시간대가 달라도 같은 날짜가 나오도록 한국 시간으로 고정한다
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function formatDate(value) {
  if (!value) return '';
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return '';
  const d = new Date(time + KST_OFFSET_MS);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function timeAgo(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  if (d < 30) return `${Math.floor(d / 7)}주 전`;
  return formatDate(value);
}

export function formatViews(n) {
  if (!n) return '';
  if (n >= 100000000) return `조회수 ${trim(n / 100000000)}억회`;
  if (n >= 10000) return `조회수 ${trim(n / 10000)}만회`;
  if (n >= 1000) return `조회수 ${trim(n / 1000)}천회`;
  return `조회수 ${n}회`;
}

function trim(x) {
  const v = x >= 100 ? Math.round(x) : Math.round(x * 10) / 10;
  return String(v).replace(/\.0$/, '');
}
