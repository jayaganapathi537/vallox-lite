import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { nowIso } from '@/lib/time';
import type { Achievement, AchievementType } from '@/models/vallox';

const collectionName = 'achievements';

interface SaveAchievementInput {
  type: AchievementType;
  title: string;
  organization: string;
  roleOrAward?: string;
  description: string;
  credentialUrl?: string;
  issuedAt: string;
  verified?: boolean;
}

export async function createAchievement(studentId: string, input: SaveAchievementInput) {
  const timestamp = nowIso();
  const payload: Omit<Achievement, 'id'> = {
    studentId,
    type: input.type,
    title: input.title,
    organization: input.organization,
    roleOrAward: input.roleOrAward,
    description: input.description,
    credentialUrl: input.credentialUrl,
    issuedAt: input.issuedAt,
    verified: input.verified ?? false,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const ref = await addDoc(collection(getFirestoreDb(), collectionName), payload);
  return {
    id: ref.id,
    ...payload
  } as Achievement;
}

export async function updateAchievement(achievementId: string, updates: Partial<SaveAchievementInput>) {
  await updateDoc(doc(getFirestoreDb(), collectionName, achievementId), {
    ...updates,
    updatedAt: nowIso()
  });
}

export async function deleteAchievement(achievementId: string) {
  await deleteDoc(doc(getFirestoreDb(), collectionName, achievementId));
}

export async function getAchievementsByStudent(studentId: string) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), collectionName), where('studentId', '==', studentId)));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<Achievement, 'id'>) }))
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)) as Achievement[];
}
