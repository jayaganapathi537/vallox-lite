'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatCard from '@/components/panels/StatCard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import type { Application, Opportunity } from '@/models/vallox';
import { getApplicationsByStudent, updateApplicationStatus } from '@/services/vallox/applicationService';
import { getAllOpportunities } from '@/services/vallox/opportunityService';
import { getOrganisationProfilesByIds } from '@/services/vallox/organisationService';

const stageFlow = ['Applied', 'Under Review', 'Task Assigned', 'Task Submitted', 'Shortlisted', 'Interview', 'Selected / Rejected'];

export default function StudentApplicationsPage() {
  const { appUser } = useAppAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunityById, setOpportunityById] = useState<Record<string, Opportunity>>({});
  const [orgNameById, setOrgNameById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const [applicationRows, opportunities] = await Promise.all([
        getApplicationsByStudent(appUser.id),
        getAllOpportunities()
      ]);

      setApplications(applicationRows);
      const opportunityMap = Object.fromEntries(opportunities.map((opportunity) => [opportunity.id, opportunity]));
      setOpportunityById(opportunityMap);

      const orgProfiles = await getOrganisationProfilesByIds(applicationRows.map((item) => item.orgId));
      setOrgNameById(Object.fromEntries(orgProfiles.map((org) => [org.userId, org.orgName])));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load applications.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const shortlisted = applications.filter((item) => item.status === 'shortlisted').length;
    const underReview = applications.filter((item) => item.status === 'applied').length;
    const rejected = applications.filter((item) => item.status === 'rejected').length;
    const selected = applications.filter((item) => item.status === 'contacted').length;

    return {
      total: applications.length,
      shortlisted,
      underReview,
      rejected,
      selected
    };
  }, [applications]);

  const handleWithdraw = async (application: Application) => {
    const shouldWithdraw = window.confirm('Withdraw this application?');
    if (!shouldWithdraw) return;

    await updateApplicationStatus(application.opportunityId, application.studentId, 'rejected', application.orgId);
    setStatusMessage('Application withdrawn.');
    await loadData();
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading applications..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}
      {statusMessage ? <Card><p className="text-sm text-brand-700">{statusMessage}</p></Card> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Applications" value={String(stats.total)} />
        <StatCard label="Shortlisted" value={String(stats.shortlisted)} />
        <StatCard label="Under Review" value={String(stats.underReview)} />
        <StatCard label="Rejected" value={String(stats.rejected)} />
        <StatCard label="Selected/Contacted" value={String(stats.selected)} />
      </div>

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Application Flow</h2>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
          {stageFlow.map((step) => (
            <span key={step} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              {step}
            </span>
          ))}
        </div>
      </Card>

      {!applications.length ? (
        <Card>
          <p className="text-sm text-slate-600">No applications yet. Apply from the opportunities page.</p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {applications.map((application) => {
            const opportunity = opportunityById[application.opportunityId];

            return (
              <Card key={application.id} className="space-y-3 p-5">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{opportunity?.title ?? 'Opportunity'}</h3>
                  <p className="text-sm text-slate-600">{orgNameById[application.orgId] ?? 'Organization'}</p>
                </div>
                <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p>Applied: {new Date(application.createdAt).toLocaleDateString()}</p>
                  <p>Status: <span className="font-semibold capitalize">{application.status}</span></p>
                  <p>Mode: {opportunity?.isRemote ? 'Remote' : opportunity?.location ?? '-'}</p>
                  <p>Type: {opportunity?.type ?? '-'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/opportunities/${application.opportunityId}`}>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/student/messages?conversation=${application.id}`}>
                    <Button size="sm" variant="outline">
                      Message Recruiter
                    </Button>
                  </Link>
                  {application.status !== 'rejected' ? (
                    <Button size="sm" variant="outline" onClick={() => handleWithdraw(application)}>
                      Withdraw
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
