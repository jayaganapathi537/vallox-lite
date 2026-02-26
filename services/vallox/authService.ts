import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  type User
} from 'firebase/auth';
import {
  firebaseConfigErrorMessage,
  getFirebaseAuth,
  getGoogleProvider,
  isFirebaseConfigured
} from '@/lib/firebase';
import type { UserRole } from '@/models/vallox';
import { ensureUserDocument } from '@/services/vallox/userService';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

function requireConfiguredAuth() {
  if (!isFirebaseConfigured) {
    throw new Error(firebaseConfigErrorMessage);
  }
  return getFirebaseAuth();
}

export async function registerWithEmail(input: RegisterInput) {
  const credential = await createUserWithEmailAndPassword(requireConfiguredAuth(), input.email, input.password);

  await updateProfile(credential.user, { displayName: input.name });

  const appUser = await ensureUserDocument({
    id: credential.user.uid,
    role: input.role,
    name: input.name,
    email: input.email
  });

  return { firebaseUser: credential.user, appUser };
}

export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(requireConfiguredAuth(), email, password);
  return credential.user;
}

export async function loginWithGoogle(defaultRole: UserRole) {
  const credential = await signInWithPopup(requireConfiguredAuth(), getGoogleProvider());
  const firebaseUser = credential.user;

  const appUser = await ensureUserDocument({
    id: firebaseUser.uid,
    role: defaultRole,
    name: firebaseUser.displayName ?? 'New User',
    email: firebaseUser.email ?? ''
  });

  return { firebaseUser, appUser };
}

export async function requestPasswordReset(email: string) {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    throw new Error('Enter your registered email or username first.');
  }

  await sendPasswordResetEmail(requireConfiguredAuth(), trimmedEmail);
}

export async function logout() {
  if (!isFirebaseConfigured) {
    return;
  }
  await signOut(getFirebaseAuth());
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured) {
    callback(null);
    return () => {};
  }
  try {
    return onAuthStateChanged(getFirebaseAuth(), callback);
  } catch {
    callback(null);
    return () => {};
  }
}
