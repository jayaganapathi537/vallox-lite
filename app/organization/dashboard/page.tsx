'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatCard from '@/components/panels/StatCard';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import SdgChip from '@/components/vallox/SdgChip';
import { useAppAuth } from '@/lib/useAppAuth';
import type { Application, Opportunity, OrganisationProfile } from '@/models/vallox';
import { getApplicationsByOrg } from '@/services/vallox/applicationService';
import { getOpportunitiesByOrgId } from '@/services/vallox/opportunityService';
import { getOrganisationProfile } from '@/services/vallox/organisationService';

export default function OrganizationDashboardPage() {
  const { appUser } = useAppAuth();

  const [profile, setProfile] = useState<OrganisationProfile | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const [orgProfile, orgOpportunities, orgApplications] = await Promise.all([
        getOrganisationProfile(appUser.id),
        getOpportunitiesByOrgId(appUser.id),
        getApplicationsByOrg(appUser.id)
      ]);

      setProfile(orgProfile);
      setOpportunities(orgOpportunities);
      setApplications(orgApplications);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load organization dashboard.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const activeOpportunities = opportunities.filter((item) => item.status === 'open').length;
    const shortlisted = applications.filter((item) => item.status === 'shortlisted').length;
    const contacted = applications.filter((item) => item.status === 'contacted').length;

    return {
      totalOpportunities: opportunities.length,
      activeOpportunities,
      totalApplications: applications.length,
      shortlisted,
      contacted
    };
  }, [applications, opportunities]);

  if (loading || !appUser) {
    return <LoadingState message="Loading organization dashboard..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Opportunities Posted" value={String(stats.totalOpportunities)} />
        <StatCard label="Active Opportunities" value={String(stats.activeOpportunities)} />
        <StatCard label="Applications Received" value={String(stats.totalApplications)} />
        <StatCard label="Shortlisted" value={String(stats.shortlisted)} />
        <StatCard label="Contacted" value={String(stats.contacted)} />
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Organization Summary</h2>
            <p className="text-sm text-slate-600">Live profile and hiring performance snapshot.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/opportunities/new">
              <Button size="sm">Post New Opportunity</Button>
            </Link>
            <Link href="/organization/talent">
              <Button size="sm" variant="outline">
                Search Talent
              </Button>
            </Link>
          </div>
        </div>

        {profile ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-lg font-semibold text-slate-900">{profile.orgName}</p>
            <p className="mt-1 text-sm text-slate-600">{profile.description}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.sdgFocus.map((sdg) => (
                <SdgChip key={`org-sdg-${sdg}`} sdg={sdg} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Organization profile missing. Complete onboarding first.</p>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Recent Opportunities</h2>
        {!opportunities.length ? (
          <p className="text-sm text-slate-600">No opportunities yet. Create one to start receiving applications.</p>
        ) : (
          <div className="space-y-2">
            {opportunities.slice(0, 5).map((opportunity) => (
              <div key={opportunity.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-900">{opportunity.title}</p>
                  <p className="text-sm text-slate-600 capitalize">
                    {opportunity.type} · {opportunity.status} · {opportunity.isRemote ? 'Remote' : opportunity.location}
                  </p>
                </div>
                <Link href={`/opportunities/${opportunity.id}/matches`}>
                  <Button size="sm" variant="outline">
                    View Matches
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
