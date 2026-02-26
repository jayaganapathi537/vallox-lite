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
import type { Project, ProjectLinks } from '@/models/vallox';

const collectionName = 'projects';

interface SaveProjectInput {
  title: string;
  description: string;
  techStack: string[];
  links: ProjectLinks;
  sdgTags: number[];
}

export async function createProject(userId: string, input: SaveProjectInput) {
  const timestamp = nowIso();
  const payload = {
    userId,
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const docRef = await addDoc(collection(getFirestoreDb(), collectionName), payload);
  return {
    id: docRef.id,
    ...payload
  } as Project;
}

export async function updateProject(projectId: string, input: SaveProjectInput) {
  await updateDoc(doc(getFirestoreDb(), collectionName, projectId), {
    ...input,
    updatedAt: nowIso()
  });
}

export async function deleteProject(projectId: string) {
  await deleteDoc(doc(getFirestoreDb(), collectionName, projectId));
}

export async function getProjectById(projectId: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), collectionName, projectId));
  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Project, 'id'>)
  } as Project;
}

export async function getProjectsByStudentId(userId: string) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), collectionName), where('userId', '==', userId)));

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...(item.data() as Omit<Project, 'id'>)
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as Project[];
}
