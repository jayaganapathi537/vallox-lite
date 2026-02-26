import { collection, doc, getDoc, getDocs, limit, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { nowIso } from '@/lib/time';
import type { BaseUser, UserRole } from '@/models/vallox';

const usersCollection = 'users';

export interface CreateUserInput {
  id: string;
  role: UserRole;
  name: string;
  email: string;
}

interface FirebaseIdentity {
  uid: string;
  displayName: string | null;
  email: string | null;
}

function fallbackNameFromEmail(email: string | null) {
  if (!email) {
    return 'New User';
  }

  const [localPart] = email.split('@');
  const normalized = localPart.replace(/[._-]+/g, ' ').trim();
  if (!normalized) {
    return 'New User';
  }

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function normalizeLookupValue(value: string) {
  return value.trim().toLowerCase();
}

export async function createUserDocument(input: CreateUserInput) {
  const timestamp = nowIso();
  const payload: BaseUser = {
    id: input.id,
    role: input.role,
    name: input.name,
    email: input.email,
    onboardingComplete: false,
    status: 'active',
    lastLoginAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await setDoc(
    doc(getFirestoreDb(), usersCollection, input.id),
    {
      ...payload,
      usernameKey: normalizeLookupValue(input.name),
      nameKey: normalizeLookupValue(input.name),
      emailKey: normalizeLookupValue(input.email)
    },
    { merge: false }
  );
  return payload;
}

export async function ensureUserDocument(input: CreateUserInput) {
  const userDocRef = doc(getFirestoreDb(), usersCollection, input.id);
  const snapshot = await getDoc(userDocRef);

  if (snapshot.exists()) {
    return snapshot.data() as BaseUser;
  }

  return createUserDocument(input);
}

export async function getUserById(userId: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), usersCollection, userId));
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.data() as BaseUser;
}

export async function getAllUsers() {
  const snapshot = await getDocs(collection(getFirestoreDb(), usersCollection));
  return snapshot.docs
    .map((item) => item.data() as BaseUser)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrCreateUserFromFirebaseIdentity(identity: FirebaseIdentity, roleHint: UserRole) {
  const existing = await getUserById(identity.uid);
  if (existing) {
    await updateDoc(doc(getFirestoreDb(), usersCollection, identity.uid), {
      lastLoginAt: nowIso(),
      updatedAt: nowIso()
    });
    return existing;
  }

  return createUserDocument({
    id: identity.uid,
    role: roleHint,
    name: identity.displayName ?? fallbackNameFromEmail(identity.email),
    email: identity.email ?? ''
  });
}

export async function getUsersByIds(userIds: string[]) {
  const uniqueIds = [...new Set(userIds)];
  const snapshots = await Promise.all(uniqueIds.map((id) => getDoc(doc(getFirestoreDb(), usersCollection, id))));

  return snapshots
    .filter((snapshot) => snapshot.exists())
    .map((snapshot) => snapshot.data() as BaseUser);
}

export async function updateUser(userId: string, updates: Partial<BaseUser>) {
  const payload: Record<string, unknown> = {
    ...updates,
    updatedAt: nowIso()
  };

  if (typeof updates.name === 'string') {
    payload.usernameKey = normalizeLookupValue(updates.name);
    payload.nameKey = normalizeLookupValue(updates.name);
  }

  if (typeof updates.email === 'string') {
    payload.emailKey = normalizeLookupValue(updates.email);
  }

  await updateDoc(doc(getFirestoreDb(), usersCollection, userId), payload);
}

async function findUserByField(field: string, value: string) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), usersCollection), where(field, '==', value), limit(1)));
  if (snapshot.empty) {
    return null;
  }
  return snapshot.docs[0].data() as BaseUser;
}

export async function getUserByEmail(email: string) {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return null;
  }

  const byEmailKey = await findUserByField('emailKey', normalizeLookupValue(trimmedEmail));
  if (byEmailKey) {
    return byEmailKey;
  }

  return findUserByField('email', trimmedEmail);
}

export async function resolveLoginEmailIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes('@')) {
    return trimmed;
  }

  const normalized = normalizeLookupValue(trimmed);

  try {
    const byUsername = await findUserByField('usernameKey', normalized);
    if (byUsername?.email) return byUsername.email;

    const byNameKey = await findUserByField('nameKey', normalized);
    if (byNameKey?.email) return byNameKey.email;

    const byExactName = await findUserByField('name', trimmed);
    if (byExactName?.email) return byExactName.email;
  } catch {
    return null;
  }

  return null;
}
