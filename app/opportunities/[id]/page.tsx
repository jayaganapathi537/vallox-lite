'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import { calculateMatch } from '@/lib/matching';
import type { Application, Opportunity, OrganisationProfile, StudentProfile } from '@/models/vallox';
import { applyToOpportunity, getApplication } from '@/services/vallox/applicationService';
import { getOpportunityById } from '@/services/vallox/opportunityService';
import { getOrganisationProfile } from '@/services/vallox/organisationService';
import { getStudentProfile } from '@/services/vallox/studentService';

export default function OpportunityDetailPage() {
  const params = useParams<{ id: string }>();
  const { appUser } = useAppAuth();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [orgProfile, setOrgProfile] = useState<OrganisationProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const foundOpportunity = await getOpportunityById(params.id);
        if (!foundOpportunity) {
          setError('Opportunity not found.');
          return;
        }

        setOpportunity(foundOpportunity);

        const [organisation, maybeStudentProfile, maybeApplication] = await Promise.all([
          getOrganisationProfile(foundOpportunity.orgId),
          appUser?.role === 'student' ? getStudentProfile(appUser.id) : Promise.resolve(null),
          appUser?.role === 'student' ? getApplication(foundOpportunity.id, appUser.id) : Promise.resolve(null)
        ]);

        setOrgProfile(organisation);
        setStudentProfile(maybeStudentProfile);
        setApplication(maybeApplication);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Unable to load opportunity.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [appUser, params.id]);

  const match = useMemo(() => {
    if (!studentProfile || !opportunity) return null;
    return calculateMatch(studentProfile, opportunity);
  }, [studentProfile, opportunity]);

  const handleApply = async () => {
    if (!appUser || appUser.role !== 'student' || !opportunity) return;

    setApplyLoading(true);
    setToast('');

    try {
      const result = await applyToOpportunity(opportunity.id, opportunity.orgId, appUser.id);
      setApplication(result);
      setToast('Applied successfully.');
    } catch (applyError) {
      const message = applyError instanceof Error ? applyError.message : 'Unable to apply.';
      setToast(message);
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading opportunity details..." />;
  }

  if (!opportunity) {
    return <ErrorState message={error || 'Opportunity not found.'} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-ink-900">{opportunity.title}</h1>
            <p className="text-sm text-ink-600">
              {orgProfile?.orgName ?? 'Organisation'} • {opportunity.type} •{' '}
              {opportunity.isRemote ? 'Remote' : opportunity.location}
            </p>
          </div>

          <span className="rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-700 capitalize">
            {opportunity.status}
          </span>
        </div>

        <p className="text-ink-700">{opportunity.description}</p>

        <div>
          <p className="text-sm font-semibold text-ink-700">Required Skills</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {opportunity.requiredSkills.map((skill) => (
              <span key={skill} className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {orgProfile ? (
          <div className="rounded-xl border border-ink-100 bg-ink-50 p-4 text-sm text-ink-700">
            <p className="font-semibold text-ink-900">About {orgProfile.orgName}</p>
            <p className="mt-1">{orgProfile.description}</p>
            {orgProfile.website ? (
              <Link href={orgProfile.website} target="_blank" className="mt-2 inline-block font-semibold text-sea-700">
                Visit website
              </Link>
            ) : null}
          </div>
        ) : null}

        {match ? (
          <div className="rounded-xl border border-sea-100 bg-sea-50 p-4 text-sm text-sea-800">
            <p className="font-semibold">Your match score: {match.matchScore}%</p>
            <p>Skills overlap: {match.skillScore}</p>
          </div>
        ) : null}

        {appUser?.role === 'student' ? (
          <div className="space-y-2">
            <Button onClick={handleApply} disabled={applyLoading || opportunity.status !== 'open'}>
              {application ? `Applied (${application.status})` : applyLoading ? 'Applying...' : 'Apply'}
            </Button>
            {toast && <p className="text-sm text-sea-700">{toast}</p>}
          </div>
        ) : null}

        {appUser?.role === 'organisation' && appUser.id === opportunity.orgId ? (
          <div className="flex flex-wrap gap-2">
            <Link href={`/opportunities/${opportunity.id}/edit`}>
              <Button variant="outline" size="sm">
                Edit opportunity
              </Button>
            </Link>
            <Link href={`/opportunities/${opportunity.id}/matches`}>
              <Button size="sm">View matches</Button>
            </Link>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
