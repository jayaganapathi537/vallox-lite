'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import type { Application, Opportunity } from '@/models/vallox';
import { getApplicationsByOrg } from '@/services/vallox/applicationService';
import {
  deleteOpportunity,
  getOpportunitiesByOrgId,
  updateOpportunity
} from '@/services/vallox/opportunityService';

export default function OrganizationOpportunitiesPage() {
  const { appUser } = useAppAuth();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const [opportunityRows, applicationRows] = await Promise.all([
        getOpportunitiesByOrgId(appUser.id),
        getApplicationsByOrg(appUser.id)
      ]);
      setOpportunities(opportunityRows);
      setApplications(applicationRows);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load opportunities.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statsByOpportunity = useMemo(() => {
    return applications.reduce<Record<string, { applied: number; shortlisted: number }>>((acc, application) => {
      if (!acc[application.opportunityId]) {
        acc[application.opportunityId] = { applied: 0, shortlisted: 0 };
      }

      if (application.status === 'applied') {
        acc[application.opportunityId].applied += 1;
      }
      if (application.status === 'shortlisted') {
        acc[application.opportunityId].shortlisted += 1;
      }

      return acc;
    }, {});
  }, [applications]);

  const handleToggleStatus = async (opportunity: Opportunity) => {
    const nextStatus = opportunity.status === 'open' ? 'closed' : 'open';
    await updateOpportunity(opportunity.id, { status: nextStatus });
    await loadData();
  };

  const handleDelete = async (opportunityId: string) => {
    const shouldDelete = window.confirm('Delete this opportunity? Existing applications will remain for audit.');
    if (!shouldDelete) return;

    await deleteOpportunity(opportunityId);
    await loadData();
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading opportunities..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Opportunity Management</h2>
        <p className="text-sm text-slate-600">Create and manage live opportunities with real applicant stats.</p>
        <Link href="/opportunities/new">
          <Button size="sm">Create Opportunity</Button>
        </Link>
      </Card>

      {!opportunities.length ? (
        <Card>
          <p className="text-sm text-slate-600">No opportunities posted yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {opportunities.map((opportunity) => {
            const stats = statsByOpportunity[opportunity.id] ?? { applied: 0, shortlisted: 0 };

            return (
              <Card key={opportunity.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{opportunity.title}</h3>
                    <p className="text-sm text-slate-600 capitalize">
                      {opportunity.type} · {opportunity.status} · {opportunity.isRemote ? 'Remote' : opportunity.location}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {stats.applied} applied · {stats.shortlisted} shortlisted
                  </span>
                </div>

                <p className="text-sm text-slate-600">{opportunity.description}</p>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/opportunities/${opportunity.id}`}>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </Link>
                  <Link href={`/opportunities/${opportunity.id}/edit`}>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/opportunities/${opportunity.id}/matches`}>
                    <Button size="sm" variant="outline">
                      Matches
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => handleToggleStatus(opportunity)}>
                    {opportunity.status === 'open' ? 'Close' : 'Reopen'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(opportunity.id)}>
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
