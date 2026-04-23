const NAMED_ENTITIES = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&([a-zA-Z]+);/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name) ? NAMED_ENTITIES[name] : match
    );
}

export function stripHtmlToText(html, maxLen) {
  if (!html) return '';
  const text = decodeEntities(String(html).replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  if (typeof maxLen === 'number' && text.length > maxLen) {
    return text.slice(0, maxLen) + '...';
  }
  return text;
}

export function stripHtmlToProse(html, maxLen) {
  if (!html) return '';
  const cleaned = String(html)
    .replace(/<p[^>]*class="[^"]*ql-align-center[^"]*"[^>]*>[\s\S]*?<\/p>/gi, ' ')
    .replace(/<figure[\s\S]*?<\/figure>/gi, ' ')
    .replace(/<figcaption[\s\S]*?<\/figcaption>/gi, ' ')
    .replace(/<img[^>]*>/gi, ' ');
  const text = decodeEntities(cleaned.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return stripHtmlToText(html, maxLen);
  if (typeof maxLen === 'number' && text.length > maxLen) {
    return text.slice(0, maxLen) + '...';
  }
  return text;
}
