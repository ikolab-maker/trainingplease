'use client';

import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { LEGAL_VERSION } from './legal';

export type OptionalPurposes = { ai: boolean; marketing: boolean; stats: boolean };

/**
 * Guarda la evidencia (consents/{uid}/events) y el estado vigente (users/{uid}.consent)
 * en una sola escritura atómica.
 */
export async function grantConsent(uid: string, optional: OptionalPurposes) {
  const batch = writeBatch(db());
  batch.set(doc(collection(db(), 'consents', uid, 'events')), {
    action: 'granted',
    version: LEGAL_VERSION,
    required: ['adult', 'health', 'risk', 'terms', 'data'],
    optional,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : '',
    at: serverTimestamp(),
  });
  batch.update(doc(db(), 'users', uid), {
    consent: { version: LEGAL_VERSION, acceptedAt: serverTimestamp(), optional },
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

/** Revoca el consentimiento necesario: el coach deja de ver los registros al instante. */
export async function revokeConsent(uid: string) {
  const batch = writeBatch(db());
  batch.set(doc(collection(db(), 'consents', uid, 'events')), {
    action: 'revoked',
    version: LEGAL_VERSION,
    scope: 'all',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : '',
    at: serverTimestamp(),
  });
  batch.update(doc(db(), 'users', uid), { consent: null, updatedAt: serverTimestamp() });
  await batch.commit();
}
