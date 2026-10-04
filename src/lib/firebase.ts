'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, GoogleAuthProvider, signInWithCredential, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

// Configuración web pública del proyecto de Firebase "trainingplease" (no es secreta:
// la protección está en las reglas de Firestore). Las variables NEXT_PUBLIC_* la reemplazan.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyBPmEDBHjaujYN2hd5O3dEoSXJXbRks9h4',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'trainingplease.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'trainingplease',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:574814197147:web:8713eaac14e4aa62873d3e',
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId);

// Desarrollo local con el emulador de Firebase (npm run dev:emu). Nunca en producción.
const useEmulators = process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === '1';

let app: FirebaseApp | undefined;
function getApp(): FirebaseApp {
  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
    if (useEmulators) {
      connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8080);
      // Atajo para probar sin la ventana de Google: __tpSignIn('correo@gmail.com')
      (window as unknown as Record<string, unknown>).__tpSignIn = (email: string) =>
        signInWithCredential(getAuth(app), GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true })));
    }
  }
  return app;
}

export function auth(): Auth { return getAuth(getApp()); }
export function db(): Firestore { return getFirestore(getApp()); }

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
