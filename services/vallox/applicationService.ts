import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { nowIso } from '@/lib/time';
import type { Application, ApplicationStatus } from '@/models/vallox';

const collectionName = 'applications';

function applicationId(opportunityId: string, studentId: string) {
  return `${opportunityId}_${studentId}`;
}

interface UpsertApplicationInput {
  opportunityId: string;
  orgId: string;
  studentId: string;
  status: ApplicationStatus;
}

export async function getApplication(opportunityId: string, studentId: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), collectionName, applicationId(opportunityId, studentId)));
  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as Application;
}

export async function upsertApplication(input: UpsertApplicationInput) {
  const id = applicationId(input.opportunityId, input.studentId);
  const ref = doc(getFirestoreDb(), collectionName, id);
  const existingSnapshot = await getDoc(ref);
  const timestamp = nowIso();

  const payload: Application = {
    id,
    opportunityId: input.opportunityId,
    orgId: input.orgId,
    studentId: input.studentId,
    status: input.status,
    createdAt: existingSnapshot.exists() ? (existingSnapshot.data() as Application).createdAt : timestamp,
    updatedAt: timestamp
  };

  await setDoc(ref, payload, { merge: true });
  return payload;
}

export async function applyToOpportunity(opportunityId: string, orgId: string, studentId: string) {
  const existing = await getApplication(opportunityId, studentId);

  if (existing && (existing.status === 'shortlisted' || existing.status === 'contacted')) {
    return existing;
  }

  return upsertApplication({
    opportunityId,
    orgId,
    studentId,
    status: 'applied'
  });
}

export async function updateApplicationStatus(
  opportunityId: string,
  studentId: string,
  status: ApplicationStatus,
  orgId?: string
) {
  const id = applicationId(opportunityId, studentId);
  const ref = doc(getFirestoreDb(), collectionName, id);
  const existingSnapshot = await getDoc(ref);

  if (!existingSnapshot.exists()) {
    if (!orgId) {
      throw new Error('orgId is required when creating a new application status');
    }

    return upsertApplication({
      opportunityId,
      orgId,
      studentId,
      status
    });
  }

  await updateDoc(ref, {
    status,
    updatedAt: nowIso()
  });

  return {
    ...(existingSnapshot.data() as Application),
    status
  };
}

export async function getApplicationsByOpportunity(opportunityId: string) {
  const snapshot = await getDocs(
    query(collection(getFirestoreDb(), collectionName), where('opportunityId', '==', opportunityId))
  );

  return snapshot.docs
    .map((item) => item.data() as Application)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getApplicationsByOrg(orgId: string) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), collectionName), where('orgId', '==', orgId)));

  return snapshot.docs
    .map((item) => item.data() as Application)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getApplicationsByStudent(studentId: string) {
  const snapshot = await getDocs(
    query(collection(getFirestoreDb(), collectionName), where('studentId', '==', studentId))
  );

  return snapshot.docs
    .map((item) => item.data() as Application)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllApplications() {
  const snapshot = await getDocs(collection(getFirestoreDb(), collectionName));
  return snapshot.docs.map((item) => item.data() as Application);
}
