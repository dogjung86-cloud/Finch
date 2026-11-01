import { NextResponse } from 'next/server';
import { COLLAB_KINDS } from '../../../src/data/collab';
import { SITE } from '../../../src/data/site';

// 협업 제안 메일 보내기
//
// 메일 발송은 Resend(https://resend.com) API 를 쓴다. Vercel 환경변수에 아래 값을 넣으면 동작한다.
//   RESEND_API_KEY      필수. Resend 에서 발급한 API 키
//   COLLAB_TO_EMAIL     선택. 받는 주소 (기본값: 사이트 이메일)
//   COLLAB_FROM_EMAIL   선택. 보내는 주소. 도메인 인증 전에는 기본값(onboarding@resend.dev)을 쓰며,
//                       이 경우 Resend 계정 주인의 이메일로만 받을 수 있다.
// 키가 없으면 503 을 돌려주고, 화면에서는 메일 앱으로 보내기 안내가 나온다.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KIND_IDS = new Set(COLLAB_KINDS.map((k) => k.id));

// 같은 서버 인스턴스 안에서만 지키는 간단한 도배 방지 (10분에 5건)
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 2000) hits.clear();
  return recent.length > 5;
}

function clean(value, max) {
  return typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim().slice(0, max) : '';
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}

export async function POST(request) {
  // 다른 사이트에서 이 주소로 몰래 보내는 요청 차단
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host) {
    let originHost = '';
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = '';
    }
    if (originHost !== host) return json({ ok: false, error: 'forbidden' }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  // 숨은 칸이 채워졌으면 봇으로 보고 성공한 척 끝낸다
  if (body?.website) return json({ ok: true });

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return json({ ok: false, error: 'too_many' }, 429);

  const v = {
    kind: clean(body.kind, 20),
    name: clean(body.name, 60),
    org: clean(body.org, 100),
    email: clean(body.email, 120),
    schedule: clean(body.schedule, 100),
    budget: clean(body.budget, 100),
    link: clean(body.link, 300),
    message: clean(body.message, 5000),
    agree: body.agree === true,
  };

  const fields = {};
  if (!KIND_IDS.has(v.kind)) fields.kind = '어떤 협업인지 골라 주세요.';
  if (!v.name) fields.name = '이름을 적어 주세요.';
  if (!EMAIL_RE.test(v.email)) fields.email = '회신받을 이메일 주소를 확인해 주세요.';
  if (v.message.length < 10) fields.message = '내용을 조금만 더 자세히 적어 주세요. (10자 이상)';
  if (!v.agree) fields.agree = '개인정보 수집과 이용에 동의해 주세요.';
  if (Object.keys(fields).length) return json({ ok: false, error: 'invalid', fields }, 400);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return json({ ok: false, error: 'not_configured' }, 503);

  const kindLabel = COLLAB_KINDS.find((k) => k.id === v.kind)?.label || v.kind;
  const subject = `[협업 제안] ${kindLabel} · ${v.org || v.name}`;
  const rows = [
    ['협업 종류', kindLabel],
    ['이름', v.name],
    ['소속', v.org],
    ['회신 이메일', v.email],
    ['희망 일정', v.schedule],
    ['예산', v.budget],
    ['참고 링크', v.link],
  ].filter(([, value]) => value);

  const text = `${rows.map(([k, value]) => `${k}: ${value}`).join('\n')}\n\n${v.message}\n\n(${SITE.url}/collaborate 에서 보낸 메일)`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:640px;color:#1e1a15">
      <h2 style="margin:0 0 16px;font-size:20px">새 협업 제안이 도착했어요</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px;margin-bottom:20px">
        ${rows
          .map(
            ([k, value]) =>
              `<tr><th style="text-align:left;padding:8px 12px;background:#f4efe4;border:1px solid #e2d8c4;width:120px">${escapeHtml(k)}</th><td style="padding:8px 12px;border:1px solid #e2d8c4">${escapeHtml(value)}</td></tr>`,
          )
          .join('')}
      </table>
      <div style="white-space:pre-wrap;font-size:15px;line-height:1.7;padding:16px;border:1px solid #e2d8c4;border-radius:8px">${escapeHtml(v.message)}</div>
      <p style="margin-top:20px;font-size:12px;color:#7c7366">${escapeHtml(SITE.url)}/collaborate 에서 보낸 메일입니다. 답장하면 제안한 분에게 바로 갑니다.</p>
    </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.COLLAB_FROM_EMAIL || '과학드림 홈페이지 <onboarding@resend.dev>',
        to: [process.env.COLLAB_TO_EMAIL || SITE.email],
        reply_to: v.email,
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) {
      console.error('collaborate: resend error', res.status, await res.text().catch(() => ''));
      return json({ ok: false, error: 'send_failed' }, 502);
    }
    return json({ ok: true });
  } catch (e) {
    console.error('collaborate: send exception', e);
    return json({ ok: false, error: 'send_failed' }, 502);
  }
}
