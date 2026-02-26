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
import type { VerificationProofType } from '@/models/vallox';
import { getProjectsByStudentId } from '@/services/vallox/projectService';
import { createVerificationRequest, getVerificationRequestsByStudent } from '@/services/vallox/verificationService';

const proofTypes: VerificationProofType[] = ['github', 'demo', 'video', 'organization'];

export default function StudentVerificationPage() {
  const { appUser } = useAppAuth();

  const [projects, setProjects] = useState<Awaited<ReturnType<typeof getProjectsByStudentId>>>([]);
  const [requests, setRequests] = useState<Awaited<ReturnType<typeof getVerificationRequestsByStudent>>>([]);
  const [projectId, setProjectId] = useState('');
  const [proofType, setProofType] = useState<VerificationProofType>('github');
  const [proofLink, setProofLink] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const [projectRows, requestRows] = await Promise.all([
        getProjectsByStudentId(appUser.id),
        getVerificationRequestsByStudent(appUser.id)
      ]);

      setProjects(projectRows);
      setRequests(requestRows);
      setProjectId((current) => current || projectRows[0]?.id || '');
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load verification data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const approved = requests.filter((item) => item.status === 'approved').length;
    const pending = requests.filter((item) => item.status === 'pending').length;
    const rejected = requests.filter((item) => item.status === 'rejected').length;

    return {
      approved,
      pending,
      rejected,
      trustScore: Math.min(100, approved * 20 + (projects.length > 0 ? 20 : 0))
    };
  }, [projects.length, requests]);

  const handleSubmit = async () => {
    if (!appUser || !projectId) return;

    setSaving(true);
    setError('');

    try {
      await createVerificationRequest({
        studentId: appUser.id,
        projectId,
        proofType,
        proofLink,
        notes
      });

      setProofLink('');
      setNotes('');
      await loadData();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to submit verification request.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading verification center..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Verified Projects" value={String(stats.approved)} />
        <StatCard label="Pending" value={String(stats.pending)} />
        <StatCard label="Rejected" value={String(stats.rejected)} />
        <StatCard label="Trust Score" value={`${stats.trustScore}/100`} />
        <StatCard label="Projects Available" value={String(projects.length)} />
      </div>

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Submit Verification Request</h2>
        {!projects.length ? (
          <p className="text-sm text-slate-600">Add a project before requesting verification.</p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Project</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Proof Type</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={proofType}
                  onChange={(event) => setProofType(event.target.value as VerificationProofType)}
                >
                  {proofTypes.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <Input label="Proof Link" value={proofLink} onChange={(event) => setProofLink(event.target.value)} placeholder="https://github.com/..." />
            <Textarea label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
            <Button size="sm" onClick={handleSubmit} disabled={saving || !projectId || !proofLink.trim()}>
              {saving ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Verification Requests</h2>
        {!requests.length ? (
          <p className="text-sm text-slate-600">No verification requests yet.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((request) => {
              const project = projects.find((item) => item.id === request.projectId);
              return (
                <div key={request.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{project?.title ?? request.projectId}</p>
                      <p className="text-xs capitalize text-slate-600">
                        {request.proofType} · submitted {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      request.status === 'approved'
                        ? 'bg-brand-100 text-brand-700'
                        : request.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-200 text-slate-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  {request.feedback ? <p className="mt-2 text-sm text-slate-700">Feedback: {request.feedback}</p> : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
