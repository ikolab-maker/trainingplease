import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb, adminEmails, verifyRequest } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

/**
 * Primer paso tras iniciar sesión con Google.
 * Crea users/{uid} si el correo está dado de alta (ADMIN_EMAILS o allowlist)
 * y deja el rol como custom claim para las reglas de Firestore.
 */
export async function POST(req: Request) {
  const token = await verifyRequest(req);
  if (!token) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const email = (token.email ?? '').toLowerCase();
  if (!email || !token.email_verified) {
    return NextResponse.json({ error: 'email_not_verified' }, { status: 403 });
  }

  const db = adminDb();
  const userRef = db.doc(`users/${token.uid}`);
  const existing = await userRef.get();

  let role: 'admin' | 'athlete' | null = null;

  if (adminEmails().includes(email)) {
    role = 'admin';
  } else if (existing.exists) {
    role = existing.get('role');
  } else {
    const invite = await db.doc(`allowlist/${email}`).get();
    if (invite.exists) role = 'athlete';
  }

  if (!role) return NextResponse.json({ error: 'not_registered' }, { status: 403 });

  if (!existing.exists) {
    const invite = await db.doc(`allowlist/${email}`).get();
    await userRef.set({
      role,
      email,
      name: invite.get('name') ?? token.name ?? email,
      photoURL: token.picture ?? null,
      theme: 'rosa',
      goalRace: invite.get('goalRace') ?? null,
      profile: {},
      consent: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    if (invite.exists) {
      await invite.ref.update({ uid: token.uid, joinedAt: FieldValue.serverTimestamp() });
    }
  } else if (existing.get('role') !== role) {
    await userRef.update({ role });
  }

  let claimsChanged = false;
  if (token.role !== role) {
    await adminAuth().setCustomUserClaims(token.uid, { role });
    claimsChanged = true;
  }

  return NextResponse.json({ role, claimsChanged });
}
