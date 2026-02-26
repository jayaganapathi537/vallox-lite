'use client';

import { useEffect, useMemo, useState } from 'react';
import RoleGate from '@/components/auth/RoleGate';
import Card from '@/components/ui/Card';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import MultiSelectChips from '@/components/vallox/MultiSelectChips';
import OpportunitySummaryCard from '@/components/vallox/OpportunitySummaryCard';
import { COMMON_SKILLS, OPPORTUNITY_TYPES } from '@/lib/options';
import { rankOpportunitiesForStudent } from '@/lib/matching';
import { SDG_META, SUPPORTED_SDGS } from '@/lib/sdg';
import { useAppAuth } from '@/lib/useAppAuth';
import type { Application, OpportunityMatch, OpportunityType } from '@/models/vallox';
import { getApplicationsByStudent } from '@/services/vallox/applicationService';
import { getOrganisationProfilesByIds } from '@/services/vallox/organisationService';
import { getOpenOpportunities } from '@/services/vallox/opportunityService';
import { getStudentProfile } from '@/services/vallox/studentService';

export default function OpportunitiesBrowsePage() {
  return (
    <RoleGate allowedRoles={['student']} requireOnboardingComplete>
      <OpportunitiesBrowseContent />
    </RoleGate>
  );
}

function OpportunitiesBrowseContent() {
  const { appUser } = useAppAuth();

  const [matches, setMatches] = useState<OpportunityMatch[]>([]);
  const [orgNameById, setOrgNameById] = useState<Record<string, string>>({});
  const [applicationsByOpportunityId, setApplicationsByOpportunityId] = useState<Record<string, Application>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [skillFilters, setSkillFilters] = useState<string[]>([]);
  const [sdgFilters, setSdgFilters] = useState<number[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | OpportunityType>('all');
  const [remoteOnly, setRemoteOnly] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!appUser) return;

      setLoading(true);
      setError('');

      try {
        const [profile, opportunities, applications] = await Promise.all([
          getStudentProfile(appUser.id),
          getOpenOpportunities(),
          getApplicationsByStudent(appUser.id)
        ]);

        if (!profile) {
          setError('Student profile not found.');
          setMatches([]);
          return;
        }

        const ranked = rankOpportunitiesForStudent(profile, opportunities);
        setMatches(ranked);

        const orgProfiles = await getOrganisationProfilesByIds(ranked.map((item) => item.opportunity.orgId));
        setOrgNameById(Object.fromEntries(orgProfiles.map((org) => [org.userId, org.orgName])));

        setApplicationsByOpportunityId(
          Object.fromEntries(applications.map((application) => [application.opportunityId, application]))
        );
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Unable to load opportunities.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [appUser]);

  const filteredMatches = useMemo(() => {
    return matches.filter((item) => {
      const opportunity = item.opportunity;

      const skillPass =
        !skillFilters.length || skillFilters.some((skill) => opportunity.requiredSkills.some((candidate) => candidate === skill));
      const sdgPass = !sdgFilters.length || sdgFilters.some((sdg) => opportunity.sdgTags.includes(sdg));
      const typePass = typeFilter === 'all' || opportunity.type === typeFilter;
      const remotePass = !remoteOnly || opportunity.isRemote;

      return skillPass && sdgPass && typePass && remotePass;
    });
  }, [matches, remoteOnly, sdgFilters, skillFilters, typeFilter]);

  if (loading) {
    return <LoadingState message="Loading opportunities..." />;
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h1 className="text-2xl font-semibold text-ink-900">Browse Opportunities</h1>
        <p className="text-ink-600">Filter open opportunities by skills, SDGs, type, and remote preference.</p>

        <MultiSelectChips
          label="Skills"
          options={COMMON_SKILLS.map((skill) => ({ label: skill, value: skill }))}
          values={skillFilters}
          onChange={setSkillFilters}
        />

        <MultiSelectChips
          label="SDGs"
          options={SUPPORTED_SDGS.map((sdg) => ({ label: `SDG ${sdg} - ${SDG_META[sdg].short}`, value: sdg }))}
          values={sdgFilters}
          onChange={setSdgFilters}
        />

        <div>
          <p className="text-sm font-medium text-ink-700">Opportunity Type</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(['all', ...OPPORTUNITY_TYPES] as Array<'all' | OpportunityType>).map((type) => (
              <button
                key={type}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                  typeFilter === type ? 'border-sea-400 bg-sea-50 text-sea-700' : 'border-ink-200 text-ink-700'
                }`}
                onClick={() => setTypeFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} />
          Remote only
        </label>
      </Card>

      {error && <ErrorState message={error} />}

      {!filteredMatches.length ? (
        <Card>
          <p className="text-sm text-ink-600">No opportunities found for the current filters.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredMatches.map((item) => {
            const application = applicationsByOpportunityId[item.opportunity.id];
            return (
              <div key={item.opportunity.id} className="space-y-2">
                <OpportunitySummaryCard
                  opportunity={item.opportunity}
                  orgName={orgNameById[item.opportunity.orgId]}
                  matchScore={item.matchScore}
                  detailHref={`/opportunities/${item.opportunity.id}`}
                />
                {application ? (
                  <p className="text-xs font-semibold text-ink-600">
                    Application status: <span className="capitalize text-sea-700">{application.status}</span>
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
