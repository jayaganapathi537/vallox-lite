'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import StatCard from '@/components/panels/StatCard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import type { AchievementType } from '@/models/vallox';
import { createAchievement, deleteAchievement, getAchievementsByStudent } from '@/services/vallox/achievementService';

const achievementTypes: AchievementType[] = ['internship', 'hackathon', 'certification'];

export default function StudentAchievementsPage() {
  const { appUser } = useAppAuth();

  const [type, setType] = useState<AchievementType>('internship');
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [roleOrAward, setRoleOrAward] = useState('');
  const [description, setDescription] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [issuedAt, setIssuedAt] = useState('');

  const [achievements, setAchievements] = useState<Awaited<ReturnType<typeof getAchievementsByStudent>>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const rows = await getAchievementsByStudent(appUser.id);
      setAchievements(rows);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load achievements.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const internships = achievements.filter((item) => item.type === 'internship').length;
    const hackathons = achievements.filter((item) => item.type === 'hackathon').length;
    const certifications = achievements.filter((item) => item.type === 'certification').length;
    const verified = achievements.filter((item) => item.verified).length;

    return {
      total: achievements.length,
      internships,
      hackathons,
      certifications,
      verified
    };
  }, [achievements]);

  const handleCreate = async () => {
    if (!appUser) return;

    setSaving(true);
    setError('');

    try {
      await createAchievement(appUser.id, {
        type,
        title,
        organization,
        roleOrAward,
        description,
        credentialUrl,
        issuedAt,
        verified: false
      });

      setTitle('');
      setOrganization('');
      setRoleOrAward('');
      setDescription('');
      setCredentialUrl('');
      setIssuedAt('');
      await loadData();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Unable to save achievement.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (achievementId: string) => {
    const shouldDelete = window.confirm('Delete this achievement?');
    if (!shouldDelete) return;

    await deleteAchievement(achievementId);
    await loadData();
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading achievements..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Achievements" value={String(stats.total)} />
        <StatCard label="Internships" value={String(stats.internships)} />
        <StatCard label="Hackathons" value={String(stats.hackathons)} />
        <StatCard label="Certifications" value={String(stats.certifications)} />
        <StatCard label="Verified" value={String(stats.verified)} />
      </div>

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Add Achievement</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={type}
              onChange={(event) => setType(event.target.value as AchievementType)}
            >
              {achievementTypes.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input label="Organization" value={organization} onChange={(event) => setOrganization(event.target.value)} />
          <Input label="Role / Award" value={roleOrAward} onChange={(event) => setRoleOrAward(event.target.value)} />
          <Input label="Credential URL" value={credentialUrl} onChange={(event) => setCredentialUrl(event.target.value)} />
          <Input label="Issued Date" type="date" value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} />
        </div>
        <Textarea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
        <Button size="sm" onClick={handleCreate} disabled={saving || !title || !organization || !description || !issuedAt}>
          {saving ? 'Saving...' : 'Add Achievement'}
        </Button>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Achievement Records</h2>
        {!achievements.length ? (
          <p className="text-sm text-slate-600">No achievements added yet.</p>
        ) : (
          <div className="space-y-2">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{achievement.title}</p>
                    <p className="text-sm capitalize text-slate-600">
                      {achievement.type} · {achievement.organization} · {new Date(achievement.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${achievement.verified ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-700'}`}>
                      {achievement.verified ? 'Verified' : 'Pending Verification'}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(achievement.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-700">{achievement.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
