'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import MultiSelectChips from '@/components/vallox/MultiSelectChips';
import SdgChip from '@/components/vallox/SdgChip';
import { COMMON_SKILLS, OPPORTUNITY_TYPES } from '@/lib/options';
import { rankOpportunitiesForStudent } from '@/lib/matching';
import { useAppAuth } from '@/lib/useAppAuth';
import { SDG_META, SUPPORTED_SDGS } from '@/lib/sdg';
import type { Application, OpportunityMatch, OpportunityType } from '@/models/vallox';
import { applyToOpportunity, getApplicationsByStudent } from '@/services/vallox/applicationService';
import { getOrganisationProfilesByIds } from '@/services/vallox/organisationService';
import { getOpenOpportunities } from '@/services/vallox/opportunityService';
import { getSavedOpportunityIds, toggleSavedOpportunity } from '@/services/vallox/savedOpportunityService';
import { getStudentProfile } from '@/services/vallox/studentService';

export default function StudentOpportunitiesPage() {
  const { appUser } = useAppAuth();

  const [matches, setMatches] = useState<OpportunityMatch[]>([]);
  const [orgNameById, setOrgNameById] = useState<Record<string, string>>({});
  const [applicationsByOpportunityId, setApplicationsByOpportunityId] = useState<Record<string, Application>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilters, setSkillFilters] = useState<string[]>([]);
  const [sdgFilters, setSdgFilters] = useState<number[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | OpportunityType>('all');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const [profile, opportunities, applications, initialSaved] = await Promise.all([
        getStudentProfile(appUser.id),
        getOpenOpportunities(),
        getApplicationsByStudent(appUser.id),
        getSavedOpportunityIds(appUser.id)
      ]);

      if (!profile) {
        setError('Complete onboarding to unlock matched opportunities.');
        setMatches([]);
        return;
      }

      const ranked = rankOpportunitiesForStudent(profile, opportunities);
      setMatches(ranked);
      setSavedIds(initialSaved);

      const orgProfiles = await getOrganisationProfilesByIds(ranked.map((item) => item.opportunity.orgId));
      setOrgNameById(Object.fromEntries(orgProfiles.map((org) => [org.userId, org.orgName])));

      setApplicationsByOpportunityId(Object.fromEntries(applications.map((application) => [application.opportunityId, application])));
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

  const filteredMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return matches.filter((item) => {
      const opportunity = item.opportunity;
      const orgName = orgNameById[opportunity.orgId] ?? '';
      const searchable = [
        opportunity.title,
        opportunity.description,
        orgName,
        ...opportunity.requiredSkills,
        opportunity.type,
        opportunity.location
      ]
        .join(' ')
        .toLowerCase();

      const searchPass = !query || searchable.includes(query);
      const skillPass =
        !skillFilters.length || skillFilters.some((skill) => opportunity.requiredSkills.some((candidate) => candidate === skill));
      const sdgPass = !sdgFilters.length || sdgFilters.some((sdg) => opportunity.sdgTags.includes(sdg));
      const typePass = typeFilter === 'all' || opportunity.type === typeFilter;
      const remotePass = !remoteOnly || opportunity.isRemote;

      return searchPass && skillPass && sdgPass && typePass && remotePass;
    });
  }, [matches, orgNameById, remoteOnly, sdgFilters, searchQuery, skillFilters, typeFilter]);

  const handleApply = async (match: OpportunityMatch) => {
    if (!appUser) return;

    try {
      const result = await applyToOpportunity(match.opportunity.id, match.opportunity.orgId, appUser.id);
      setApplicationsByOpportunityId((current) => ({
        ...current,
        [match.opportunity.id]: result
      }));
      setStatusMessage(`Applied to ${match.opportunity.title}.`);
    } catch (applyError) {
      const message = applyError instanceof Error ? applyError.message : 'Unable to apply.';
      setStatusMessage(message);
    }
  };

  const handleToggleSave = async (match: OpportunityMatch) => {
    if (!appUser) return;

    const currentlySaved = savedIds.has(match.opportunity.id);
    const nextSaved = await toggleSavedOpportunity(
      appUser.id,
      match.opportunity.id,
      match.opportunity.orgId,
      currentlySaved
    );

    setSavedIds((current) => {
      const updated = new Set(current);
      if (nextSaved) {
        updated.add(match.opportunity.id);
      } else {
        updated.delete(match.opportunity.id);
      }
      return updated;
    });
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading opportunities..." />;
  }

  return (
    <div className="space-y-4">
      <Card tone="accent" className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Recommended for You</p>
            <h2 className="text-xl font-semibold text-slate-900">Smart Match Overview</h2>
            <p className="text-sm text-slate-600">Live ranking based on your skills and SDG interests.</p>
          </div>
          <span className="rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
            Total Matches: {filteredMatches.length}
          </span>
        </div>

        <Input
          label="Search Opportunities"
          placeholder="Search by role, organization, skill, or domain"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />

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

        <div className="flex flex-wrap gap-2">
          {(['all', ...OPPORTUNITY_TYPES] as Array<'all' | OpportunityType>).map((type) => (
            <button
              key={type}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                typeFilter === type ? 'border-brand-500 bg-white text-brand-700' : 'border-brand-200 text-brand-700'
              }`}
              onClick={() => setTypeFilter(type)}
            >
              {type}
            </button>
          ))}
          <label className="ml-2 inline-flex items-center gap-2 rounded-full border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-700">
            <input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} />
            Remote only
          </label>
        </div>
      </Card>

      {statusMessage ? <Card><p className="text-sm text-brand-700">{statusMessage}</p></Card> : null}
      {error && <ErrorState message={error} />}

      {!filteredMatches.length ? (
        <Card>
          <p className="text-sm text-slate-600">No opportunities found for current filters.</p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredMatches.map((match) => {
            const opportunity = match.opportunity;
            const application = applicationsByOpportunityId[opportunity.id];
            const saved = savedIds.has(opportunity.id);

            return (
              <Card key={opportunity.id} className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{orgNameById[opportunity.orgId] ?? 'Organization'}</p>
                    <h3 className="text-lg font-semibold text-slate-900">{opportunity.title}</h3>
                    <p className="text-sm text-slate-600">
                      {opportunity.isRemote ? 'Remote' : opportunity.location} · {opportunity.type}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{match.matchScore}% match</span>
                </div>

                <p className="text-sm text-slate-600">{opportunity.description}</p>

                <div className="flex flex-wrap gap-2">
                  {opportunity.requiredSkills.map((skill) => (
                    <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {opportunity.sdgTags.map((sdg) => (
                    <SdgChip key={`${opportunity.id}-${sdg}`} sdg={sdg} />
                  ))}
                </div>

                <p className="text-xs text-slate-500">
                  Why this matches: {match.skillScore} skill overlaps and {match.sdgScore} SDG overlaps.
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleApply(match)} disabled={Boolean(application)}>
                    {application ? `Applied (${application.status})` : 'Apply'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggleSave(match)}>
                    {saved ? 'Unsave' : 'Save'}
                  </Button>
                  <Link href={`/opportunities/${opportunity.id}`}>
                    <Button size="sm" variant="outline">
                      View Details
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
