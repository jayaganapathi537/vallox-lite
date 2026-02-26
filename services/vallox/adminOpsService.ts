import { addDoc, collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { nowIso } from '@/lib/time';
import type { Announcement, AuditLog, BillingRecord, PlatformReport, ReportStatus, SystemSetting, UserRole } from '@/models/vallox';

const reportsCollection = 'reports';
const announcementsCollection = 'announcements';
const settingsCollection = 'systemSettings';
const billingCollection = 'billingRecords';
const auditCollection = 'auditLogs';
const defaultSettingsId = 'default';

export async function createReport(input: {
  reporterId: string;
  reportedUserId?: string;
  type: string;
  evidence: string;
}) {
  const timestamp = nowIso();
  const payload: Omit<PlatformReport, 'id'> = {
    reporterId: input.reporterId,
    reportedUserId: input.reportedUserId,
    type: input.type,
    evidence: input.evidence,
    status: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const ref = await addDoc(collection(getFirestoreDb(), reportsCollection), payload);
  return {
    id: ref.id,
    ...payload
  } as PlatformReport;
}

export async function updateReportStatus(reportId: string, status: ReportStatus, resolutionNote?: string) {
  await updateDoc(doc(getFirestoreDb(), reportsCollection, reportId), {
    status,
    resolutionNote,
    updatedAt: nowIso()
  });
}

export async function getAllReports() {
  const snapshot = await getDocs(collection(getFirestoreDb(), reportsCollection));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<PlatformReport, 'id'>) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as PlatformReport[];
}

export async function createAnnouncement(input: {
  title: string;
  message: string;
  targetGroup: Announcement['targetGroup'];
  channel: Announcement['channel'];
  createdBy: string;
}) {
  const payload: Omit<Announcement, 'id'> = {
    title: input.title,
    message: input.message,
    targetGroup: input.targetGroup,
    channel: input.channel,
    createdBy: input.createdBy,
    createdAt: nowIso()
  };

  const ref = await addDoc(collection(getFirestoreDb(), announcementsCollection), payload);
  return {
    id: ref.id,
    ...payload
  } as Announcement;
}

export async function getAnnouncements() {
  const snapshot = await getDocs(collection(getFirestoreDb(), announcementsCollection));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<Announcement, 'id'>) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as Announcement[];
}

export async function getSystemSettings() {
  const snapshot = await getDoc(doc(getFirestoreDb(), settingsCollection, defaultSettingsId));
  if (!snapshot.exists()) {
    const defaults: SystemSetting = {
      id: defaultSettingsId,
      matchingSkillWeight: 0.7,
      matchingSdgWeight: 0.3,
      tasksEnabled: true,
      verificationEnabled: true,
      sessionTimeoutMinutes: 120,
      updatedBy: 'system',
      updatedAt: nowIso()
    };

    await setDoc(doc(getFirestoreDb(), settingsCollection, defaultSettingsId), defaults, { merge: true });
    return defaults;
  }

  return snapshot.data() as SystemSetting;
}

export async function saveSystemSettings(input: Omit<SystemSetting, 'id' | 'updatedAt'>) {
  const payload: SystemSetting = {
    id: defaultSettingsId,
    ...input,
    updatedAt: nowIso()
  };

  await setDoc(doc(getFirestoreDb(), settingsCollection, defaultSettingsId), payload, { merge: true });
  return payload;
}

export async function addBillingRecord(input: {
  orgId: string;
  planName: string;
  amount: number;
  cycle: string;
  status: BillingRecord['status'];
}) {
  const payload: Omit<BillingRecord, 'id'> = {
    orgId: input.orgId,
    planName: input.planName,
    amount: input.amount,
    cycle: input.cycle,
    status: input.status,
    createdAt: nowIso()
  };

  const ref = await addDoc(collection(getFirestoreDb(), billingCollection), payload);
  return {
    id: ref.id,
    ...payload
  } as BillingRecord;
}

export async function getBillingRecords() {
  const snapshot = await getDocs(collection(getFirestoreDb(), billingCollection));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<BillingRecord, 'id'>) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as BillingRecord[];
}

export async function logAudit(input: {
  actorId: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
}) {
  const payload: Omit<AuditLog, 'id'> = {
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    details: input.details,
    createdAt: nowIso()
  };

  const ref = await addDoc(collection(getFirestoreDb(), auditCollection), payload);
  return {
    id: ref.id,
    ...payload
  } as AuditLog;
}

export async function getAuditLogs() {
  const snapshot = await getDocs(collection(getFirestoreDb(), auditCollection));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<AuditLog, 'id'>) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as AuditLog[];
}
