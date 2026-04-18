import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_EMAIL } from '../../../src/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: 'missing_token' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    if (data.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const paths = Array.isArray(body.paths) ? body.paths : [];
    const revalidated = [];
    for (const p of paths) {
      if (typeof p === 'string' && p.startsWith('/') && p.length < 200) {
        revalidatePath(p);
        revalidated.push(p);
      }
    }
    return NextResponse.json({ ok: true, revalidated });
  } catch (e) {
    return NextResponse.json({ error: 'internal', detail: String(e) }, { status: 500 });
  }
}
