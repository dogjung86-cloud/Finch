import { CHANNEL } from '../data/site';

// 유튜브 RSS(키 없이 공개)로 최신 영상을 불러온다. 1시간 캐시.
// 1순위: 긴 영상 전용 재생목록(UULF...) 피드라서 쇼츠가 섞이지 않는다.
// 2순위: 채널 전체 피드.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(str = '') {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name] ?? m);
}

function pick(block, re) {
  const m = block.match(re);
  return m ? m[1] : null;
}

export function parseFeed(xml) {
  return xml
    .split('<entry>')
    .slice(1)
    .map((chunk) => {
      const block = chunk.split('</entry>')[0];
      const id = pick(block, /<yt:videoId>([^<]+)<\/yt:videoId>/);
      if (!id) return null;
      return {
        id,
        title: decode(pick(block, /<title>([^<]*)<\/title>/) || ''),
        published: pick(block, /<published>([^<]+)<\/published>/),
        views: Number(pick(block, /<media:statistics views="(\d+)"/) || 0),
      };
    })
    .filter(Boolean);
}

export async function getLatestVideos(limit = 8) {
  if (!CHANNEL.id) return [];
  const rest = CHANNEL.id.replace(/^UC/, '');
  const feeds = [
    `https://www.youtube.com/feeds/videos.xml?playlist_id=UULF${rest}`,
    `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL.id}`,
  ];
  for (const url of feeds) {
    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) continue;
      const items = parseFeed(await res.text());
      if (items.length) return items.slice(0, limit);
    } catch {
      // 다음 피드로 넘어간다
    }
  }
  return [];
}

export function ytThumb(id, quality = 'hq') {
  const file = {
    max: 'maxresdefault.jpg',
    sd: 'sddefault.jpg',
    hq: 'hqdefault.jpg',
    mq: 'mqdefault.jpg',
  }[quality] || 'hqdefault.jpg';
  return `https://i.ytimg.com/vi/${id}/${file}`;
}

export function ytWatchUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}
