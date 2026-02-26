import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { nowIso } from '@/lib/time';
import type { Opportunity, OpportunityStatus, OpportunityType } from '@/models/vallox';

const collectionName = 'opportunities';

interface SaveOpportunityInput {
  title: string;
  description: string;
  requiredSkills: string[];
  sdgTags: number[];
  type: OpportunityType;
  location: string;
  isRemote: boolean;
  status: OpportunityStatus;
}

export async function createOpportunity(orgId: string, input: SaveOpportunityInput) {
  const timestamp = nowIso();
  const payload: Omit<Opportunity, 'id'> = {
    orgId,
    title: input.title,
    description: input.description,
    requiredSkills: input.requiredSkills,
    sdgTags: input.sdgTags,
    type: input.type,
    location: input.location,
    isRemote: input.isRemote,
    status: input.status,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const docRef = await addDoc(collection(getFirestoreDb(), collectionName), payload);
  return {
    id: docRef.id,
    ...payload
  } as Opportunity;
}

export async function updateOpportunity(opportunityId: string, updates: Partial<SaveOpportunityInput>) {
  await updateDoc(doc(getFirestoreDb(), collectionName, opportunityId), {
    ...updates,
    updatedAt: nowIso()
  });
}

export async function deleteOpportunity(opportunityId: string) {
  await deleteDoc(doc(getFirestoreDb(), collectionName, opportunityId));
}

export async function getOpportunityById(opportunityId: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), collectionName, opportunityId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Opportunity, 'id'>)
  } as Opportunity;
}

export async function getOpenOpportunities() {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), collectionName), where('status', '==', 'open')));

  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<Opportunity, 'id'>) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as Opportunity[];
}

export async function getOpportunitiesByOrgId(orgId: string) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), collectionName), where('orgId', '==', orgId)));

  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<Opportunity, 'id'>) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as Opportunity[];
}

export async function getAllOpportunities() {
  const snapshot = await getDocs(collection(getFirestoreDb(), collectionName));

  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<Opportunity, 'id'>) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as Opportunity[];
}
