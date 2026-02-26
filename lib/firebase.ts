import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const missingFirebaseKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const isFirebaseConfigured = missingFirebaseKeys.length === 0;

export const firebaseConfigErrorMessage = isFirebaseConfigured
  ? ''
  : `Firebase is not configured. Missing environment variables: ${missingFirebaseKeys.join(', ')}`;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

function ensureFirebaseApp() {
  if (!isFirebaseConfigured) {
    throw new Error(firebaseConfigErrorMessage);
  }

  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }

  return app;
}

export function getFirebaseAuth() {
  if (!auth) {
    auth = getAuth(ensureFirebaseApp());
  }
  return auth;
}

export function getGoogleProvider() {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
  }
  return googleProvider;
}

export function getFirestoreDb() {
  if (!db) {
    db = getFirestore(ensureFirebaseApp());
  }
  return db;
}
