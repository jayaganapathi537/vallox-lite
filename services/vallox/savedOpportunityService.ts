import { collection, doc, getDocs, query, setDoc, where, deleteDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { nowIso } from '@/lib/time';
import type { SavedOpportunity } from '@/models/vallox';

const collectionName = 'savedOpportunities';

function savedId(studentId: string, opportunityId: string) {
  return `${studentId}_${opportunityId}`;
}

export async function saveOpportunity(studentId: string, opportunityId: string, orgId: string) {
  const timestamp = nowIso();
  const payload: SavedOpportunity = {
    id: savedId(studentId, opportunityId),
    studentId,
    opportunityId,
    orgId,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await setDoc(doc(getFirestoreDb(), collectionName, payload.id), payload, { merge: true });
  return payload;
}

export async function unsaveOpportunity(studentId: string, opportunityId: string) {
  await deleteDoc(doc(getFirestoreDb(), collectionName, savedId(studentId, opportunityId)));
}

export async function toggleSavedOpportunity(studentId: string, opportunityId: string, orgId: string, saved: boolean) {
  if (saved) {
    await unsaveOpportunity(studentId, opportunityId);
    return false;
  }

  await saveOpportunity(studentId, opportunityId, orgId);
  return true;
}

export async function getSavedOpportunityIds(studentId: string) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), collectionName), where('studentId', '==', studentId)));
  return new Set(snapshot.docs.map((item) => (item.data() as SavedOpportunity).opportunityId));
}
