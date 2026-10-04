import 'server-only';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Credenciales solo por variable de entorno (FIREBASE_SERVICE_ACCOUNT); nunca en el repo.
function adminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw && process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'trainingplease' });
  }
  if (!raw) throw new Error('Falta FIREBASE_SERVICE_ACCOUNT');
  let sa: Record<string, string>;
  try {
    sa = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT no es un JSON válido (pega el archivo completo, con las llaves { }).');
  }
  if (sa.project_id && sa.project_id !== (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'trainingplease')) {
    throw new Error(`La cuenta de servicio es del proyecto "${sa.project_id}", no de "trainingplease".`);
  }
  return initializeApp({ credential: cert(sa) });
}

export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Verifica el ID token del header Authorization: Bearer <token>. */
export async function verifyRequest(req: Request) {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  const auth = adminAuth(); // si falta la cuenta de servicio, el error sube con su mensaje
  try {
    return await auth.verifyIdToken(token);
  } catch (e) {
    console.error('verifyIdToken', e);
    return null;
  }
}
