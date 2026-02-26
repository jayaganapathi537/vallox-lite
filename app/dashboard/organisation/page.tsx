'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import RoleGate from '@/components/auth/RoleGate';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import SdgChip from '@/components/vallox/SdgChip';
import { useAppAuth } from '@/lib/useAppAuth';
import type { Application, Opportunity, OrganisationProfile } from '@/models/vallox';
import { getApplicationsByOrg } from '@/services/vallox/applicationService';
import { getOpportunitiesByOrgId } from '@/services/vallox/opportunityService';
import { getOrganisationProfile } from '@/services/vallox/organisationService';

export default function OrganisationDashboardPage() {
  return (
    <RoleGate allowedRoles={['organisation']} requireOnboardingComplete>
      <OrganisationDashboardContent />
    </RoleGate>
  );
}

function OrganisationDashboardContent() {
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
      const message = loadError instanceof Error ? loadError.message : 'Failed to load organisation dashboard.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statsByOpportunityId = useMemo(() => {
    return applications.reduce<Record<string, { applied: number; shortlisted: number }>>((acc, item) => {
      if (!acc[item.opportunityId]) {
        acc[item.opportunityId] = { applied: 0, shortlisted: 0 };
      }

      if (item.status === 'applied') {
        acc[item.opportunityId].applied += 1;
      }

      if (item.status === 'shortlisted') {
        acc[item.opportunityId].shortlisted += 1;
      }

      return acc;
    }, {});
  }, [applications]);

  if (loading || !appUser) {
    return <LoadingState message="Loading organisation dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">Organisation Dashboard</h1>
            <p className="text-ink-600">Manage opportunities and shortlist students with explainable match scores.</p>
          </div>
          <Link href="/opportunities/new">
            <Button>Post new opportunity</Button>
          </Link>
        </div>

        {profile ? (
          <div className="space-y-2 rounded-xl border border-ink-100 bg-ink-50 p-4">
            <p className="text-lg font-semibold text-ink-900">{profile.orgName}</p>
            <p className="text-sm text-ink-600">{profile.description}</p>
            <div className="flex flex-wrap gap-2">
              {profile.sdgFocus.map((sdg) => (
                <SdgChip key={`org-sdg-${sdg}`} sdg={sdg} />
              ))}
            </div>
          </div>
        ) : (
          <ErrorState message="Organisation profile missing. Revisit onboarding." />
        )}
      </Card>

      {error && <ErrorState message={error} />}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink-900">My Opportunities</h2>

        {!opportunities.length ? (
          <Card>
            <p className="text-sm text-ink-600">No opportunities yet. Post your first role to start matching students.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opportunity) => {
              const stats = statsByOpportunityId[opportunity.id] ?? { applied: 0, shortlisted: 0 };

              return (
                <Card key={opportunity.id} className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-ink-900">{opportunity.title}</h3>
                      <p className="text-sm text-ink-600">
                        {opportunity.type} • {opportunity.status} • {opportunity.isRemote ? 'Remote' : opportunity.location}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
                        Applied: {stats.applied}
                      </span>
                      <span className="rounded-full bg-sea-50 px-2.5 py-1 text-xs font-semibold text-sea-700">
                        Shortlisted: {stats.shortlisted}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {opportunity.sdgTags.map((sdg) => (
                      <SdgChip key={`${opportunity.id}-${sdg}`} sdg={sdg} />
                    ))}
                  </div>

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
                      <Button size="sm">View matches</Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
