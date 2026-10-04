import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, verifyRequest } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function requireAdmin(req: Request) {
  const token = await verifyRequest(req);
  return token && token.role === 'admin' ? token : null;
}

/** Alta manual de un atleta: su correo de Google queda autorizado para entrar. */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? '').trim().toLowerCase();
  const name = String(body?.name ?? '').trim();
  if (!EMAIL_RE.test(email) || !name) {
    return NextResponse.json({ error: 'Nombre y correo de Google válidos son obligatorios.' }, { status: 400 });
  }

  const race = body?.goalRace;
  const goalRace = race && race.name && DATE_RE.test(race.date)
    ? { name: String(race.name).slice(0, 120), date: race.date, distanceKm: race.distanceKm ? Number(race.distanceKm) : null }
    : null;

  const ref = adminDb().doc(`allowlist/${email}`);
  if ((await ref.get()).exists) {
    return NextResponse.json({ error: 'Ese correo ya está registrado.' }, { status: 409 });
  }
  await ref.set({
    email,
    name: name.slice(0, 120),
    goalRace,
    uid: null,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: admin.email ?? admin.uid,
  });
  return NextResponse.json({ ok: true });
}

/** Quita una alta que aún no se usó (el atleta todavía no entró). */
export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const email = new URL(req.url).searchParams.get('email')?.toLowerCase() ?? '';
  const ref = adminDb().doc(`allowlist/${email}`);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (snap.get('uid')) {
    return NextResponse.json({ error: 'El atleta ya entró; no se puede quitar desde aquí.' }, { status: 409 });
  }
  await ref.delete();
  return NextResponse.json({ ok: true });
}
