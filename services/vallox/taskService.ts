import {
  addDoc,
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
import type { Task, TaskSubmission, TaskSubmissionStatus, TaskType } from '@/models/vallox';

const taskCollection = 'tasks';
const submissionCollection = 'taskSubmissions';

interface CreateTaskInput {
  title: string;
  description: string;
  taskType: TaskType;
  skillsTested: string[];
  deadline: string;
  studentIds: string[];
  opportunityId?: string;
}

function removeUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as T;
}

export async function createTask(orgId: string, input: CreateTaskInput) {
  const timestamp = nowIso();
  const payload = removeUndefined({
    orgId,
    opportunityId: input.opportunityId,
    title: input.title,
    description: input.description,
    taskType: input.taskType,
    skillsTested: input.skillsTested,
    deadline: input.deadline,
    studentIds: [...new Set(input.studentIds)],
    createdAt: timestamp,
    updatedAt: timestamp
  }) as Omit<Task, 'id'>;

  const ref = await addDoc(collection(getFirestoreDb(), taskCollection), payload);
  return {
    id: ref.id,
    ...payload
  } as Task;
}

export async function getTasksByOrg(orgId: string) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), taskCollection), where('orgId', '==', orgId)));

  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<Task, 'id'>) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as Task[];
}

export async function getTasksForStudent(studentId: string) {
  const snapshot = await getDocs(
    query(collection(getFirestoreDb(), taskCollection), where('studentIds', 'array-contains', studentId))
  );

  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<Task, 'id'>) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as Task[];
}

export async function getTaskById(taskId: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), taskCollection, taskId));
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Task, 'id'>)
  } as Task;
}

function submissionId(taskId: string, studentId: string) {
  return `${taskId}_${studentId}`;
}

export async function getTaskSubmissionsByTask(taskId: string) {
  const snapshot = await getDocs(
    query(collection(getFirestoreDb(), submissionCollection), where('taskId', '==', taskId))
  );

  return snapshot.docs
    .map((item) => item.data() as TaskSubmission)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getTaskSubmissionsByStudent(studentId: string) {
  const snapshot = await getDocs(
    query(collection(getFirestoreDb(), submissionCollection), where('studentId', '==', studentId))
  );

  return snapshot.docs
    .map((item) => item.data() as TaskSubmission)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function upsertTaskSubmission(input: {
  taskId: string;
  orgId: string;
  studentId: string;
  status: TaskSubmissionStatus;
  responseText?: string;
  score?: number;
  feedback?: string;
}) {
  const id = submissionId(input.taskId, input.studentId);
  const ref = doc(getFirestoreDb(), submissionCollection, id);
  const existingSnapshot = await getDoc(ref);
  const timestamp = nowIso();

  const payload = removeUndefined({
    id,
    taskId: input.taskId,
    orgId: input.orgId,
    studentId: input.studentId,
    status: input.status,
    responseText: input.responseText,
    score: input.score,
    feedback: input.feedback,
    createdAt: existingSnapshot.exists() ? (existingSnapshot.data() as TaskSubmission).createdAt : timestamp,
    updatedAt: timestamp
  }) as TaskSubmission;

  await setDoc(ref, payload, { merge: true });
  return payload;
}

export async function updateTaskSubmission(input: {
  taskId: string;
  studentId: string;
  status?: TaskSubmissionStatus;
  score?: number;
  feedback?: string;
  responseText?: string;
}) {
  const id = submissionId(input.taskId, input.studentId);
  const ref = doc(getFirestoreDb(), submissionCollection, id);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error('Submission not found.');
  }

  const updates = removeUndefined({
    status: input.status,
    score: input.score,
    feedback: input.feedback,
    responseText: input.responseText,
    updatedAt: nowIso()
  });

  await updateDoc(ref, updates);
}
