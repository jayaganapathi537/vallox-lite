import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { nowIso } from '@/lib/time';
import type { OrganisationProfile } from '@/models/vallox';

const collectionName = 'organisationProfiles';

export async function getOrganisationProfile(userId: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), collectionName, userId));
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.data() as OrganisationProfile;
}

export async function upsertOrganisationProfile(
  userId: string,
  payload: Pick<OrganisationProfile, 'orgName' | 'type' | 'description' | 'sdgFocus' | 'website'>
) {
  const existing = await getOrganisationProfile(userId);
  const timestamp = nowIso();

  const profile: OrganisationProfile = {
    userId,
    orgName: payload.orgName,
    type: payload.type,
    description: payload.description,
    sdgFocus: payload.sdgFocus,
    website: payload.website,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp
  };

  await setDoc(doc(getFirestoreDb(), collectionName, userId), profile, { merge: true });
  return profile;
}

export async function getOrganisationProfilesByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  const snapshots = await Promise.all(uniqueIds.map((id) => getDoc(doc(getFirestoreDb(), collectionName, id))));

  return snapshots
    .filter((snapshot) => snapshot.exists())
    .map((snapshot) => snapshot.data() as OrganisationProfile);
}

export async function getAllOrganisationProfiles() {
  const snapshot = await getDocs(collection(getFirestoreDb(), collectionName));
  return snapshot.docs.map((item) => item.data() as OrganisationProfile);
}
