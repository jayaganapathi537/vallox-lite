'use client';

import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import { createAnnouncement, getAnnouncements, logAudit } from '@/services/vallox/adminOpsService';
import type { Announcement } from '@/models/vallox';

export default function AdminCommunicationsPage() {
  const { appUser } = useAppAuth();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetGroup, setTargetGroup] = useState<Announcement['targetGroup']>('all');
  const [channel, setChannel] = useState<Announcement['channel']>('in_app');
  const [announcements, setAnnouncements] = useState<Awaited<ReturnType<typeof getAnnouncements>>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const rows = await getAnnouncements();
      setAnnouncements(rows);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load communications history.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!appUser) return;

    setSaving(true);
    setError('');

    try {
      const announcement = await createAnnouncement({
        title,
        message,
        targetGroup,
        channel,
        createdBy: appUser.id
      });

      await logAudit({
        actorId: appUser.id,
        actorRole: appUser.role,
        action: 'announcement_created',
        targetType: 'announcement',
        targetId: announcement.id,
        details: `${title} -> ${targetGroup}`
      });

      setTitle('');
      setMessage('');
      setTargetGroup('all');
      setChannel('in_app');
      await loadData();
    } catch (createError) {
      const messageText = createError instanceof Error ? createError.message : 'Unable to create announcement.';
      setError(messageText);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading communication center..." />;
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Broadcast Center</h2>
        <Input label="Announcement Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <Textarea label="Message" value={message} onChange={(event) => setMessage(event.target.value)} />

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Target Group</label>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={targetGroup} onChange={(event) => setTargetGroup(event.target.value as Announcement['targetGroup'])}>
              <option value="all">All Users</option>
              <option value="students">Students</option>
              <option value="organizations">Organizations</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Channel</label>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={channel} onChange={(event) => setChannel(event.target.value as Announcement['channel'])}>
              <option value="in_app">In-App</option>
              <option value="email">Email</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        <Button size="sm" onClick={handleCreate} disabled={saving || !title.trim() || !message.trim()}>
          {saving ? 'Sending...' : 'Send Announcement'}
        </Button>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Communication History</h2>
        {!announcements.length ? (
          <p className="text-sm text-slate-600">No announcements yet.</p>
        ) : (
          <div className="space-y-2">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{announcement.title}</p>
                  <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700 capitalize">
                    {announcement.targetGroup} · {announcement.channel}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{announcement.message}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(announcement.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
