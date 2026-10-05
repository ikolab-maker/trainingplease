// Pruebas de las reglas de Firestore. Correr con: npm run test:rules (usa el emulador).
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, addDoc, getDocs } from 'firebase/firestore';

let env;
const consent = { version: '1.0-borrador', acceptedAt: new Date(), optional: { ai: false, marketing: false, stats: false } };

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-trainplease',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
after(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/ana'), { role: 'athlete', name: 'Ana', email: 'ana@x.com', consent });
    await setDoc(doc(db, 'users/beto'), { role: 'athlete', name: 'Beto', email: 'beto@x.com', consent: null });
    await setDoc(doc(db, 'plans/ana/weeks/2026-W40'), { start: '2026-09-28', title: 'Semana 1' });
    await setDoc(doc(db, 'plans/ana/weeks/2026-W40/sessions/s1'), { date: '2026-09-29', sport: 'running', title: 'Rodaje' });
    await setDoc(doc(db, 'logs/ana/entries/s1'), { done: true, rpe: 5, comment: 'bien', weekId: '2026-W40', updatedAt: new Date() });
    await setDoc(doc(db, 'logs/beto/entries/s9'), { done: true, rpe: 5, comment: 'ok', weekId: '2026-W40', updatedAt: new Date() });
    await setDoc(doc(db, 'allowlist/nuevo@x.com'), { name: 'Nuevo', uid: null });
  });
});

const ana = () => env.authenticatedContext('ana', { role: 'athlete' }).firestore();
const beto = () => env.authenticatedContext('beto', { role: 'athlete' }).firestore();
const coach = () => env.authenticatedContext('coach', { role: 'admin' }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

const log = (extra = {}) => ({ done: true, rpe: 6, comment: 'ok', weekId: '2026-W40', updatedAt: serverTimestamp(), ...extra });

test('sin sesión no se lee nada', async () => {
  await assertFails(getDoc(doc(anon(), 'users/ana')));
  await assertFails(getDoc(doc(anon(), 'plans/ana/weeks/2026-W40')));
});

test('el atleta lee lo suyo y no lo de otro', async () => {
  await assertSucceeds(getDoc(doc(ana(), 'users/ana')));
  await assertSucceeds(getDoc(doc(ana(), 'plans/ana/weeks/2026-W40/sessions/s1')));
  await assertFails(getDoc(doc(ana(), 'users/beto')));
  await assertFails(getDoc(doc(ana(), 'plans/beto/weeks/2026-W40')));
  await assertFails(getDoc(doc(ana(), 'logs/beto/entries/s9')));
});

test('el atleta no escribe planes; el coach sí', async () => {
  await assertFails(setDoc(doc(ana(), 'plans/ana/weeks/2026-W40/sessions/s2'), { title: 'x' }));
  await assertSucceeds(setDoc(doc(coach(), 'plans/ana/weeks/2026-W40/sessions/s2'), { title: 'x' }));
});

test('el atleta no puede cambiarse el rol', async () => {
  await assertFails(updateDoc(doc(ana(), 'users/ana'), { role: 'admin' }));
  await assertSucceeds(updateDoc(doc(ana(), 'users/ana'), { theme: 'oscuro' }));
});

test('el coach no puede tocar rol ni consentimiento', async () => {
  await assertFails(updateDoc(doc(coach(), 'users/ana'), { role: 'admin' }));
  await assertFails(updateDoc(doc(coach(), 'users/ana'), { consent: null }));
  await assertSucceeds(updateDoc(doc(coach(), 'users/ana'), { goalRace: { name: '21K', date: '2027-08-22', distanceKm: 21.1 } }));
});

test('registro del atleta: válido sí, inválido no', async () => {
  await assertSucceeds(setDoc(doc(ana(), 'logs/ana/entries/s1'), log()));
  await assertFails(setDoc(doc(ana(), 'logs/ana/entries/s1'), log({ rpe: 11 })));
  await assertFails(setDoc(doc(ana(), 'logs/ana/entries/s1'), log({ extra: 'x' })));
  await assertFails(setDoc(doc(ana(), 'logs/ana/entries/s1'), log({ comment: 'x'.repeat(1001) })));
  await assertFails(setDoc(doc(ana(), 'logs/beto/entries/s1'), log()));
});

test('sin consentimiento el atleta no registra y el coach no ve sus registros', async () => {
  await assertFails(setDoc(doc(beto(), 'logs/beto/entries/s9'), log()));
  await assertFails(getDoc(doc(coach(), 'logs/beto/entries/s9')));
  await assertSucceeds(getDoc(doc(coach(), 'logs/ana/entries/s1')));
  await assertSucceeds(getDoc(doc(beto(), 'logs/beto/entries/s9')));
});

test('consentimiento: solo se agregan eventos propios', async () => {
  const ev = { action: 'granted', version: '1.0-borrador', at: serverTimestamp() };
  await assertSucceeds(addDoc(collection(ana(), 'consents/ana/events'), ev));
  await assertFails(addDoc(collection(ana(), 'consents/beto/events'), ev));
  await assertFails(addDoc(collection(ana(), 'consents/ana/events'), { ...ev, action: 'otro' }));
  const ref = await addDoc(collection(ana(), 'consents/ana/events'), ev);
  await assertFails(deleteDoc(ref));
});

test('allowlist: solo lectura para el coach, nadie escribe desde el cliente', async () => {
  await assertSucceeds(getDocs(collection(coach(), 'allowlist')));
  await assertFails(getDocs(collection(ana(), 'allowlist')));
  await assertFails(setDoc(doc(coach(), 'allowlist/otro@x.com'), { name: 'x' }));
});

test('nadie crea su propio perfil desde el cliente', async () => {
  const intruso = env.authenticatedContext('intruso', {}).firestore();
  await assertFails(setDoc(doc(intruso, 'users/intruso'), { role: 'admin' }));
});
