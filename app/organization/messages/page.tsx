'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import type { Application, ConversationMessage, Opportunity } from '@/models/vallox';
import { getApplicationsByOrg } from '@/services/vallox/applicationService';
import {
  conversationIdForApplication,
  getMessagesByConversation,
  sendMessage,
  subscribeToConversationMessages
} from '@/services/vallox/messageService';
import { getOpportunitiesByOrgId } from '@/services/vallox/opportunityService';
import { getUsersByIds } from '@/services/vallox/userService';

export default function OrganizationMessagesPage() {
  const { appUser } = useAppAuth();
  const searchParams = useSearchParams();

  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunityById, setOpportunityById] = useState<Record<string, Opportunity>>({});
  const [studentNameById, setStudentNameById] = useState<Record<string, string>>({});
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const loadConversations = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const [applicationRows, opportunities] = await Promise.all([
        getApplicationsByOrg(appUser.id),
        getOpportunitiesByOrgId(appUser.id)
      ]);

      setApplications(applicationRows);
      setOpportunityById(Object.fromEntries(opportunities.map((opportunity) => [opportunity.id, opportunity])));

      const users = await getUsersByIds(applicationRows.map((application) => application.studentId));
      setStudentNameById(Object.fromEntries(users.map((user) => [user.id, user.name])));

      const requestedConversation = searchParams.get('conversation') ?? '';
      const validRequested = applicationRows.some((item) => item.id === requestedConversation);
      const firstConversation = applicationRows[0]?.id ?? '';
      setActiveConversationId(validRequested ? requestedConversation : firstConversation);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load conversations.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser, searchParams]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const activeApplication = useMemo(
    () => applications.find((application) => application.id === activeConversationId) ?? null,
    [activeConversationId, applications]
  );

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let unsubscribe = () => {};

    async function bootstrap() {
      const initial = await getMessagesByConversation(activeConversationId);
      setMessages(initial);

      unsubscribe = subscribeToConversationMessages(activeConversationId, setMessages, (snapshotError) => {
        setError(snapshotError.message);
      });
    }

    bootstrap();

    return () => unsubscribe();
  }, [activeConversationId]);

  const handleSend = async () => {
    if (!appUser || !activeApplication) return;

    setSending(true);
    try {
      await sendMessage({
        conversationId: conversationIdForApplication(activeApplication.opportunityId, activeApplication.studentId),
        opportunityId: activeApplication.opportunityId,
        orgId: activeApplication.orgId,
        studentId: activeApplication.studentId,
        senderId: appUser.id,
        senderRole: appUser.role,
        body: draft
      });
      setDraft('');
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Unable to send message.';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading messages..." />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
      {error ? <ErrorState message={error} /> : null}

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Conversations</h2>
        {!applications.length ? (
          <p className="text-sm text-slate-600">No candidate conversations yet.</p>
        ) : (
          applications.map((application) => {
            const active = application.id === activeConversationId;
            const opportunity = opportunityById[application.opportunityId];

            return (
              <button
                key={application.id}
                type="button"
                className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                  active ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
                onClick={() => setActiveConversationId(application.id)}
              >
                <p className="font-semibold">{studentNameById[application.studentId] ?? 'Student'}</p>
                <p>{opportunity?.title ?? 'Opportunity'}</p>
                <p className="mt-1 text-xs capitalize">Status: {application.status}</p>
              </button>
            );
          })
        )}
      </Card>

      <Card className="space-y-3 p-4">
        {!activeApplication ? (
          <p className="text-sm text-slate-600">Select a candidate conversation to continue.</p>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {studentNameById[activeApplication.studentId] ?? 'Student'} · {opportunityById[activeApplication.opportunityId]?.title ?? 'Opportunity'}
              </h2>
              <p className="text-sm text-slate-600">Application status: {activeApplication.status}</p>
            </div>

            <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
              {!messages.length ? (
                <p className="text-sm text-slate-600">No messages yet.</p>
              ) : (
                messages.map((message) => {
                  const mine = message.senderId === appUser.id;
                  return (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-xl p-3 text-sm ${
                        mine ? 'ml-auto bg-brand-100 text-brand-900' : 'bg-white text-slate-700'
                      }`}
                    >
                      <p>{message.body}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(message.createdAt).toLocaleString()}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <Input
                label="Type your message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Send update, request files, or schedule interview."
                className="flex-1"
              />
              <Button size="sm" onClick={handleSend} disabled={sending || !draft.trim()}>
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
