'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import { logAudit } from '@/services/vallox/adminOpsService';
import { getProjectById } from '@/services/vallox/projectService';
import { getUsersByIds } from '@/services/vallox/userService';
import { getAllVerificationRequests, updateVerificationRequest } from '@/services/vallox/verificationService';

export default function AdminVerificationPage() {
  const { appUser } = useAppAuth();

  const [requests, setRequests] = useState<Awaited<ReturnType<typeof getAllVerificationRequests>>>([]);
  const [studentNameById, setStudentNameById] = useState<Record<string, string>>({});
  const [projectTitleById, setProjectTitleById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const rows = await getAllVerificationRequests();
      setRequests(rows);

      const users = await getUsersByIds(rows.map((item) => item.studentId));
      setStudentNameById(Object.fromEntries(users.map((user) => [user.id, user.name])));

      const projects = await Promise.all(rows.map((item) => getProjectById(item.projectId)));
      const projectMap: Record<string, string> = {};
      projects.forEach((project, index) => {
        const request = rows[index];
        projectMap[request.projectId] = project?.title ?? request.projectId;
      });
      setProjectTitleById(projectMap);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load verification queue.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDecision = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!appUser) return;

    setSavingId(requestId);
    try {
      await updateVerificationRequest(requestId, status, appUser.id, status === 'approved' ? 'Approved by admin.' : 'Rejected by admin. Please resubmit additional proof.');
      await logAudit({
        actorId: appUser.id,
        actorRole: appUser.role,
        action: `verification_${status}`,
        targetType: 'verification_request',
        targetId: requestId
      });
      await loadData();
    } catch (decisionError) {
      const message = decisionError instanceof Error ? decisionError.message : 'Unable to update verification request.';
      setError(message);
    } finally {
      setSavingId('');
    }
  };

  if (loading) {
    return <LoadingState message="Loading verification control..." />;
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      {!requests.length ? (
        <Card>
          <p className="text-sm text-slate-600">No verification requests available.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{projectTitleById[request.projectId] ?? request.projectId}</p>
                  <p className="text-sm text-slate-600">Student: {studentNameById[request.studentId] ?? request.studentId}</p>
                  <p className="text-xs capitalize text-slate-500">Proof Type: {request.proofType}</p>
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
