'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import { getApplicationsByOrg } from '@/services/vallox/applicationService';
import { getProjectById } from '@/services/vallox/projectService';
import { getUsersByIds } from '@/services/vallox/userService';
import { getAllVerificationRequests, updateVerificationRequest } from '@/services/vallox/verificationService';

export default function OrganizationVerificationPage() {
  const { appUser } = useAppAuth();

  const [requests, setRequests] = useState<Awaited<ReturnType<typeof getAllVerificationRequests>>>([]);
  const [studentNameById, setStudentNameById] = useState<Record<string, string>>({});
  const [projectTitleById, setProjectTitleById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const orgApplications = await getApplicationsByOrg(appUser.id);
      const eligibleStudents = new Set(orgApplications.map((item) => item.studentId));

      const allRequests = await getAllVerificationRequests();
      const filtered = allRequests.filter((request) => eligibleStudents.has(request.studentId));
      setRequests(filtered);

      const users = await getUsersByIds(filtered.map((item) => item.studentId));
      setStudentNameById(Object.fromEntries(users.map((user) => [user.id, user.name])));

      const projectRows = await Promise.all(filtered.map((item) => getProjectById(item.projectId)));
      const titleMap: Record<string, string> = {};
      projectRows.forEach((project, index) => {
        const request = filtered[index];
        titleMap[request.projectId] = project?.title ?? request.projectId;
      });
      setProjectTitleById(titleMap);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load verification requests.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingCount = useMemo(() => requests.filter((item) => item.status === 'pending').length, [requests]);

  const handleDecision = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!appUser) return;

    setSavingId(requestId);
    try {
      await updateVerificationRequest(requestId, status, appUser.id, status === 'approved' ? 'Approved by organization reviewer.' : 'Rejected by organization reviewer. Please resubmit stronger proof.');
      await loadData();
    } catch (decisionError) {
      const message = decisionError instanceof Error ? decisionError.message : 'Unable to update verification status.';
      setError(message);
    } finally {
      setSavingId('');
    }
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading verification queue..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}

      <Card className="space-y-2 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Organization Verification Queue</h2>
        <p className="text-sm text-slate-600">Pending requests linked to your applicants: {pendingCount}</p>
      </Card>

      {!requests.length ? (
        <Card>
          <p className="text-sm text-slate-600">No verification requests from your current applicants.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{projectTitleById[request.projectId] ?? request.projectId}</p>
                  <p className="text-sm text-slate-600">Student: {studentNameById[request.studentId] ?? request.studentId}</p>
                  <p className="text-xs capitalize text-slate-500">Proof: {request.proofType}</p>
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

              <div className="flex flex-wrap gap-2">
                <Link href={request.proofLink} target="_blank" className="inline-flex">
                  <Button size="sm" variant="outline">View Proof</Button>
                </Link>
                <Button size="sm" onClick={() => handleDecision(request.id, 'approved')} disabled={savingId === request.id || request.status !== 'pending'}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDecision(request.id, 'rejected')} disabled={savingId === request.id || request.status !== 'pending'}>
                  Reject
                </Button>
              </div>

              {request.notes ? <p className="text-sm text-slate-700">Notes: {request.notes}</p> : null}
              {request.feedback ? <p className="text-sm text-slate-700">Feedback: {request.feedback}</p> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
