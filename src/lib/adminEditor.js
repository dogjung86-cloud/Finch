import { supabase } from './supabase';

// 어드민 글쓰기 도구가 함께 쓰는 도우미: 이미지 올리기, 본문 정리, 오류 문구, 임시 저장본 보관.

// ── 이미지 ──
// 썸네일은 공유 미리보기에도 쓰이므로 어디서나 열리는 JPEG 로 저장한다.
export const THUMB_IMAGE = { width: 1280, type: 'image/jpeg' };
export const BODY_IMAGE = { width: 800 };

const QUALITY = 0.8;
const MAX_BYTES = 10 * 1024 * 1024; // Supabase 버킷 한도
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

// 올리기 전에 가로폭을 맞추고 다시 압축한다. 움직이는 GIF 같은 형식은 그대로 두고, 오히려 커지면 원본을 쓴다.
async function compressImage(file, { width, type }) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, width / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  // 사진은 JPEG, 투명한 부분이 있을 수 있는 그림은 WebP
  const outType = type || (file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp');
  const ctx = canvas.getContext('2d');
  if (outType === 'image/jpeg') {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, outType, QUALITY));
  return blob && blob.size < file.size ? blob : file;
}

// spec: { bucket, folder, width, type? }. 올린 이미지의 공개 주소를 돌려준다.
export async function uploadAdminImage(file, { bucket, folder, ...spec }) {
  const image = await compressImage(file, spec);
  if (image.size > MAX_BYTES) throw new Error('줄여도 10MB 가 넘는 이미지는 올릴 수 없습니다.');

  const ext = EXTENSIONS[image.type] || file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, image, { upsert: true });
  if (error) throw error;

  return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
}

// ── 본문 ──
// Quill 은 띄어쓰기를 전부 &nbsp; 로, 빈 줄을 <p></p> 로 내보낸다.
// 그대로 저장하면 단어가 줄 끝에서 잘리고 에디터에 있던 빈 줄이 공개 화면에서 사라진다.
export const normalizeEditorHtml = (html) =>
  (html || '').replace(/&nbsp;/g, ' ').replace(/<p( [^>]*)?><\/p>/g, '<p$1><br></p>');

// 저장 직전 정리. 다른 곳에서 복사해 온 글에 글자 데이터로 박힌 이미지는 올리고 주소로 바꾼다.
export async function prepareBody(html, spec) {
  let body = normalizeEditorHtml(html);
  const inline = new Set([...body.matchAll(/<img[^>]*\ssrc="(data:image\/[^"]+)"/g)].map((m) => m[1]));
  for (const src of inline) {
    const blob = await (await fetch(src)).blob();
    const name = `pasted.${blob.type.split('/')[1].split('+')[0]}`;
    const url = await uploadAdminImage(new File([blob], name, { type: blob.type }), spec);
    body = body.split(src).join(url);
  }
  return body;
}

// ── 오류 문구 ──
export function adminErrorMessage(error) {
  const text = error?.message || String(error);
  if (error?.code === '42501' || /row-level security|jwt|unauthorized/i.test(text)) {
    return '권한이 없습니다. 로그인이 풀렸을 수 있으니 다시 로그인해 주세요.';
  }
  if (error?.code === '23514') return '입력한 값이 저장 규칙에 맞지 않습니다. 카테고리를 확인해 주세요.';
  if (/maximum allowed size|payload too large/i.test(text)) return '이미지가 10MB 를 넘습니다.';
  if (/failed to fetch|networkerror/i.test(text)) return '인터넷 연결을 확인해 주세요.';
  return text;
}

// 고치거나 지운 줄이 없을 때의 문구. 로그인이 풀리면 오류 없이 0줄로 끝난다.
export const NOTHING_CHANGED = '반영되지 않았습니다. 로그인이 풀렸거나 글이 이미 지워졌을 수 있습니다. 다시 로그인한 뒤 해 주세요.';

// ── 임시 저장본 ──
// 쓰던 글을 이 브라우저에만 보관한다. 브라우저 저장소는 막혀 있을 수 있어 모두 try 로 감싼다.
const DRAFT_PREFIX = 'finch-admin-draft:';
const draftKey = (kind, id) => `${DRAFT_PREFIX}${kind}:${id}`;

export function readDraft(kind, id) {
  try {
    return JSON.parse(localStorage.getItem(draftKey(kind, id)));
  } catch {
    return null;
  }
}

// 보관한 시각을 돌려준다. 실패하면 false.
export function writeDraft(kind, id, form) {
  const savedAt = Date.now();
  try {
    localStorage.setItem(draftKey(kind, id), JSON.stringify({ id, form, savedAt }));
    return savedAt;
  } catch {
    return false;
  }
}

export function removeDraft(kind, id) {
  try {
    localStorage.removeItem(draftKey(kind, id));
  } catch {
    /* 저장소를 쓸 수 없으면 지울 것도 없다 */
  }
}

function draftKeys(prefix) {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith(prefix));
  } catch {
    return [];
  }
}

export function listDrafts(kind) {
  return draftKeys(`${DRAFT_PREFIX}${kind}:`)
    .map((k) => {
      try {
        return JSON.parse(localStorage.getItem(k));
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.savedAt - a.savedAt);
}

export const hasDrafts = () => draftKeys(DRAFT_PREFIX).length > 0;

export const formatSavedTime = (savedAt) =>
  new Date(savedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });
