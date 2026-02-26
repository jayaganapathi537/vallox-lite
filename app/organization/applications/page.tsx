'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import type { Application, ApplicationStatus, Opportunity, StudentProfile } from '@/models/vallox';
import { getApplicationsByOrg, updateApplicationStatus } from '@/services/vallox/applicationService';
import { getOpportunitiesByOrgId } from '@/services/vallox/opportunityService';
import { getAllStudentProfiles } from '@/services/vallox/studentService';
import { getUsersByIds } from '@/services/vallox/userService';

const statuses: ApplicationStatus[] = ['applied', 'shortlisted', 'contacted', 'rejected'];

export default function OrganizationApplicationsPage() {
  const { appUser } = useAppAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [studentNameById, setStudentNameById] = useState<Record<string, string>>({});
  const [studentProfileById, setStudentProfileById] = useState<Record<string, StudentProfile>>({});
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string>('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const [applicationRows, opportunityRows, allProfiles] = await Promise.all([
        getApplicationsByOrg(appUser.id),
        getOpportunitiesByOrgId(appUser.id),
        getAllStudentProfiles()
      ]);

      setApplications(applicationRows);
      setOpportunities(opportunityRows);

      const studentIds = applicationRows.map((item) => item.studentId);
      const users = await getUsersByIds(studentIds);
      setStudentNameById(Object.fromEntries(users.map((user) => [user.id, user.name])));

      const relevantProfiles = allProfiles.filter((profile) => studentIds.includes(profile.userId));
      setStudentProfileById(Object.fromEntries(relevantProfiles.map((profile) => [profile.userId, profile])));
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

  const opportunityById = useMemo(
    () => Object.fromEntries(opportunities.map((opportunity) => [opportunity.id, opportunity])),
    [opportunities]
  );

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const opportunityPass = selectedOpportunityId === 'all' || application.opportunityId === selectedOpportunityId;
      const statusPass = statusFilter === 'all' || application.status === statusFilter;
      return opportunityPass && statusPass;
    });
  }, [applications, selectedOpportunityId, statusFilter]);

  const handleUpdateStatus = async (application: Application, status: ApplicationStatus) => {
    setSavingId(application.id);
    try {
      await updateApplicationStatus(application.opportunityId, application.studentId, status, application.orgId);
      await loadData();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update status.';
      setError(message);
    } finally {
      setSavingId('');
    }
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading organization applications..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Applications Pipeline</h2>
        <p className="text-sm text-slate-600">Applied → Shortlisted → Contacted/Interview → Rejected.</p>

        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={selectedOpportunityId}
            onChange={(event) => setSelectedOpportunityId(event.target.value)}
          >
            <option value="all">All Opportunities</option>
            {opportunities.map((opportunity) => (
              <option key={opportunity.id} value={opportunity.id}>
                {opportunity.title}
              </option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | ApplicationStatus)}
          >
            <option value="all">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {!filteredApplications.length ? (
        <Card>
          <p className="text-sm text-slate-600">No applications found for the selected filters.</p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredApplications.map((application) => {
            const opportunity = opportunityById[application.opportunityId];
            const studentProfile = studentProfileById[application.studentId];

            return (
              <Card key={application.id} className="space-y-3 p-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{studentNameById[application.studentId] ?? 'Student'}</h3>
                  <p className="text-sm text-slate-600">{studentProfile?.headline ?? 'Student profile headline unavailable'}</p>
                  <p className="text-sm text-slate-600">Role: {opportunity?.title ?? 'Opportunity'}</p>
                </div>

                <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p>Applied: {new Date(application.createdAt).toLocaleDateString()}</p>
                  <p>Status: <span className="font-semibold capitalize">{application.status}</span></p>
                  <p>Mode: {opportunity?.isRemote ? 'Remote' : opportunity?.location ?? '-'}</p>
                  <p>Type: {opportunity?.type ?? '-'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {statuses.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={application.status === status ? 'primary' : 'outline'}
                      onClick={() => handleUpdateStatus(application, status)}
                      disabled={savingId === application.id}
                    >
                      {status}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/students/${application.studentId}`}>
                    <Button size="sm" variant="outline">
                      View Profile
                    </Button>
                  </Link>
                  <Link href={`/organization/messages?conversation=${application.id}`}>
                    <Button size="sm" variant="outline">
                      Message
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
