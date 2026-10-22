import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  const requiredEnvironment = [
    ['EXPO_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
    ['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
    ['EXPO_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
    ['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket],
    ['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId],
    ['EXPO_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId],
  ] as const;
  return requiredEnvironment.every(([, value]) => Boolean(value?.trim() && !/your|placeholder|replace-with/i.test(value)));
}

export function assertFirebaseConfigured(): void {
  const requiredEnvironment = [
    ['EXPO_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
    ['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
    ['EXPO_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
    ['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket],
    ['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId],
    ['EXPO_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId],
  ] as const;
  const missing = requiredEnvironment
    .filter(([, value]) => !value?.trim() || /your|placeholder|replace-with/i.test(value))
    .map(([name]) => name);
  if (missing.length) {
    throw new Error(`Configure Firebase before using Firebase services: ${missing.join(', ')}`);
  }
}

export function getFirebaseApp(): FirebaseApp {
  assertFirebaseConfigured();
  const existingApp = getApps().find((app) => app.name === '[DEFAULT]');
  return existingApp || initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}
