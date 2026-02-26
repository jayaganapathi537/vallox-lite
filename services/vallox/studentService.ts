import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { nowIso } from '@/lib/time';
import type { StudentProfile } from '@/models/vallox';

const collectionName = 'studentProfiles';

export async function getStudentProfile(userId: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), collectionName, userId));
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.data() as StudentProfile;
}

export async function upsertStudentProfile(
  userId: string,
  payload: Pick<StudentProfile, 'headline' | 'bio' | 'skills' | 'sdgInterests'>
) {
  const existing = await getStudentProfile(userId);
  const timestamp = nowIso();

  const profile: StudentProfile = {
    userId,
    headline: payload.headline,
    bio: payload.bio,
    skills: payload.skills,
    sdgInterests: payload.sdgInterests,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp
  };

  await setDoc(doc(getFirestoreDb(), collectionName, userId), profile, { merge: true });
  return profile;
}

export async function getAllStudentProfiles() {
  const snapshot = await getDocs(collection(getFirestoreDb(), collectionName));

  return snapshot.docs
    .map((item) => item.data() as StudentProfile)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
