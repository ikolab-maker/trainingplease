// Carga en Firestore un plan guardado en JSON (p. ej. data/claudia-plan.json).
//
// Uso (el atleta debe haber entrado una vez a la app para tener uid):
//   FIREBASE_SERVICE_ACCOUNT="$(cat cuenta-servicio.json)" node scripts/seed-plan.mjs correo@gmail.com data/claudia-plan.json
//
// No borra nada: crea o sobrescribe las semanas y sesiones del archivo.
// Formato: [{ id: "2026-W39", week: {...}, sessions: [{ id, date, sport, ... }] }]

import { readFileSync } from 'node:fs';

const [email, file] = process.argv.slice(2);
if (!email || !file) { console.error('Uso: node scripts/seed-plan.mjs <correo> <archivo.json>'); process.exit(1); }
const plan = JSON.parse(readFileSync(file, 'utf8'));

const { initializeApp, cert } = await import('firebase-admin/app');
const { getAuth } = await import('firebase-admin/auth');
const { getFirestore } = await import('firebase-admin/firestore');

initializeApp(process.env.FIRESTORE_EMULATOR_HOST && !process.env.FIREBASE_SERVICE_ACCOUNT
  ? { projectId: process.env.GCLOUD_PROJECT ?? 'demo-trainplease' }
  : { credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? '{}')) });

const user = await getAuth().getUserByEmail(email).catch(() => null);
if (!user) { console.error(`${email} todavía no entró a la app. Pídele que entre una vez con Google.`); process.exit(1); }

const db = getFirestore();
const batch = db.batch();
for (const w of plan) {
  batch.set(db.doc(`plans/${user.uid}/weeks/${w.id}`), w.week, { merge: true });
  for (const { id, ...s } of w.sessions) {
    batch.set(db.doc(`plans/${user.uid}/weeks/${w.id}/sessions/${id}`), { ...s, weekId: w.id });
  }
}
await batch.commit();
console.log(`Listo: ${plan.length} semanas y ${plan.reduce((n, w) => n + w.sessions.length, 0)} sesiones para ${email}.`);
