import { addDoc, collection, getDocs, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { nowIso } from '@/lib/time';
import type { ConversationMessage, MessageSenderRole } from '@/models/vallox';

const collectionName = 'messages';

export function conversationIdForApplication(opportunityId: string, studentId: string) {
  return `${opportunityId}_${studentId}`;
}

interface SendMessageInput {
  conversationId: string;
  opportunityId: string;
  orgId: string;
  studentId: string;
  senderId: string;
  senderRole: MessageSenderRole;
  body: string;
}

export async function sendMessage(input: SendMessageInput) {
  const trimmedBody = input.body.trim();
  if (!trimmedBody) {
    throw new Error('Message cannot be empty.');
  }

  const payload: Omit<ConversationMessage, 'id'> = {
    conversationId: input.conversationId,
    opportunityId: input.opportunityId,
    orgId: input.orgId,
    studentId: input.studentId,
    senderId: input.senderId,
    senderRole: input.senderRole,
    body: trimmedBody,
    createdAt: nowIso()
  };

  const ref = await addDoc(collection(getFirestoreDb(), collectionName), payload);
  return {
    id: ref.id,
    ...payload
  } as ConversationMessage;
}

export async function getMessagesByConversation(conversationId: string) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), collectionName), where('conversationId', '==', conversationId)));

  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<ConversationMessage, 'id'>) }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt)) as ConversationMessage[];
}

export async function getConversationPreviewsByStudent(studentId: string) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), collectionName), where('studentId', '==', studentId)));

  const grouped = new Map<string, ConversationMessage>();
  snapshot.docs.forEach((item) => {
    const message = { id: item.id, ...(item.data() as Omit<ConversationMessage, 'id'>) } as ConversationMessage;
    const existing = grouped.get(message.conversationId);
    if (!existing || existing.createdAt < message.createdAt) {
      grouped.set(message.conversationId, message);
    }
  });

  return [...grouped.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getConversationPreviewsByOrg(orgId: string) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), collectionName), where('orgId', '==', orgId)));

  const grouped = new Map<string, ConversationMessage>();
  snapshot.docs.forEach((item) => {
    const message = { id: item.id, ...(item.data() as Omit<ConversationMessage, 'id'>) } as ConversationMessage;
    const existing = grouped.get(message.conversationId);
    if (!existing || existing.createdAt < message.createdAt) {
      grouped.set(message.conversationId, message);
    }
  });

  return [...grouped.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function subscribeToConversationMessages(
  conversationId: string,
  callback: (messages: ConversationMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(getFirestoreDb(), collectionName), where('conversationId', '==', conversationId));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs
        .map((item) => ({ id: item.id, ...(item.data() as Omit<ConversationMessage, 'id'>) }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)) as ConversationMessage[];
      callback(messages);
    },
    (error) => {
      if (onError) {
        onError(error as Error);
      }
    }
  );
}
