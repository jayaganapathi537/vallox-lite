import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { nowIso } from '@/lib/time';
import type { VerificationProofType, VerificationRequest, VerificationStatus } from '@/models/vallox';

const collectionName = 'verificationRequests';

interface CreateVerificationInput {
  studentId: string;
  projectId: string;
  opportunityId?: string;
  orgId?: string;
  proofType: VerificationProofType;
  proofLink: string;
  notes?: string;
}

export async function createVerificationRequest(input: CreateVerificationInput) {
  const timestamp = nowIso();
  const payload: Omit<VerificationRequest, 'id'> = {
    studentId: input.studentId,
    projectId: input.projectId,
    opportunityId: input.opportunityId,
    orgId: input.orgId,
    proofType: input.proofType,
    proofLink: input.proofLink,
    notes: input.notes,
    status: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const ref = await addDoc(collection(getFirestoreDb(), collectionName), payload);
  return {
    id: ref.id,
    ...payload
  } as VerificationRequest;
}

export async function updateVerificationRequest(
  requestId: string,
  status: VerificationStatus,
  reviewerId: string,
  feedback?: string
) {
  await updateDoc(doc(getFirestoreDb(), collectionName, requestId), {
    status,
    reviewerId,
    feedback,
    updatedAt: nowIso()
  });
}

export async function getVerificationRequestById(requestId: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), collectionName, requestId));
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<VerificationRequest, 'id'>)
  } as VerificationRequest;
}

export async function getVerificationRequestsByStudent(studentId: string) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), collectionName), where('studentId', '==', studentId)));

  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<VerificationRequest, 'id'>) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as VerificationRequest[];
}

export async function getVerificationRequestsByOrg(orgId: string) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), collectionName), where('orgId', '==', orgId)));

  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<VerificationRequest, 'id'>) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as VerificationRequest[];
}

export async function getAllVerificationRequests() {
  const snapshot = await getDocs(collection(getFirestoreDb(), collectionName));

  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<VerificationRequest, 'id'>) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as VerificationRequest[];
}
