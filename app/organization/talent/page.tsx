'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import { rankStudentsForOpportunity } from '@/lib/matching';
import type { Application, Opportunity, StudentMatch, StudentProfile } from '@/models/vallox';
import { getApplicationsByOrg, updateApplicationStatus } from '@/services/vallox/applicationService';
import { getOpportunitiesByOrgId } from '@/services/vallox/opportunityService';
import { getAllStudentProfiles } from '@/services/vallox/studentService';
import { getUsersByIds } from '@/services/vallox/userService';

export default function OrganizationTalentPage() {
  const { appUser } = useAppAuth();

  const [search, setSearch] = useState('');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [studentMatches, setStudentMatches] = useState<StudentMatch[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStudentId, setSavingStudentId] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const [opportunityRows, profileRows, applicationRows] = await Promise.all([
        getOpportunitiesByOrgId(appUser.id),
        getAllStudentProfiles(),
        getApplicationsByOrg(appUser.id)
      ]);

      const users = await getUsersByIds(profileRows.map((profile) => profile.userId));
      const userById = Object.fromEntries(users.map((user) => [user.id, user]));

      const students = profileRows
        .map((profile) => {
          const user = userById[profile.userId];
          if (!user || user.role !== 'student') {
            return null;
          }
          return { user, profile };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      setOpportunities(opportunityRows);
      setStudentProfiles(profileRows);
      setApplications(applicationRows);

      const initialOpportunityId = opportunityRows[0]?.id ?? '';
      setSelectedOpportunityId(initialOpportunityId);

      if (initialOpportunityId) {
        const selectedOpportunity = opportunityRows.find((opportunity) => opportunity.id === initialOpportunityId);
        if (selectedOpportunity) {
          setStudentMatches(rankStudentsForOpportunity(selectedOpportunity, students));
        }
      } else {
        setStudentMatches([]);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load talent data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    async function recomputeMatches() {
      if (!selectedOpportunityId) {
        setStudentMatches([]);
        return;
      }

      const selectedOpportunity = opportunities.find((opportunity) => opportunity.id === selectedOpportunityId);
      if (!selectedOpportunity) {
        setStudentMatches([]);
        return;
      }

      const users = await getUsersByIds(studentProfiles.map((profile) => profile.userId));
      const userById = Object.fromEntries(users.map((user) => [user.id, user]));

      const students = studentProfiles
        .map((profile) => {
          const user = userById[profile.userId];
          if (!user || user.role !== 'student') {
            return null;
          }
          return { user, profile };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      setStudentMatches(rankStudentsForOpportunity(selectedOpportunity, students));
    }

    recomputeMatches();
  }, [opportunities, selectedOpportunityId, studentProfiles]);

  const applicationByStudentId = useMemo(
    () => Object.fromEntries(applications.filter((app) => app.opportunityId === selectedOpportunityId).map((app) => [app.studentId, app])),
    [applications, selectedOpportunityId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return studentMatches;

    return studentMatches.filter((match) => {
      return (
        match.student.name.toLowerCase().includes(q) ||
        match.profile.headline.toLowerCase().includes(q) ||
        match.profile.skills.some((skill) => skill.toLowerCase().includes(q))
      );
    });
  }, [search, studentMatches]);

  const handleShortlist = async (studentId: string) => {
    if (!selectedOpportunityId || !appUser) return;

    setSavingStudentId(studentId);

    try {
      await updateApplicationStatus(selectedOpportunityId, studentId, 'shortlisted', appUser.id);
      await loadData();
    } catch (shortlistError) {
      const message = shortlistError instanceof Error ? shortlistError.message : 'Unable to shortlist student.';
      setError(message);
    } finally {
      setSavingStudentId('');
    }
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading talent discovery..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Talent Discovery</h2>
        <p className="text-sm text-slate-600">Search students and rank by match score for a selected opportunity.</p>

        <div className="flex flex-wrap gap-2">
          <Input
            label="Search"
            placeholder="Name, skill, domain"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-[240px]"
          />
          <div className="min-w-[240px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Opportunity</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={selectedOpportunityId}
              onChange={(event) => setSelectedOpportunityId(event.target.value)}
            >
              {opportunities.map((opportunity) => (
                <option key={opportunity.id} value={opportunity.id}>
                  {opportunity.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {!filtered.length ? (
        <Card>
          <p className="text-sm text-slate-600">No students found for this search/opportunity combination.</p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((match) => {
            const currentStatus = applicationByStudentId[match.student.id]?.status;

            return (
              <Card key={match.student.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{match.student.name}</h3>
                    <p className="text-sm text-slate-600">{match.profile.headline}</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                    {match.matchScore}% match
                  </span>
                </div>

                <p className="text-sm text-slate-600">{match.profile.bio}</p>

                <div className="flex flex-wrap gap-2">
                  {match.profile.skills.slice(0, 8).map((skill) => (
                    <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-500">
                  Skill overlap: {match.skillOverlap.join(', ') || 'None'} · SDG overlap: {match.sdgOverlap.join(', ') || 'None'}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/students/${match.student.id}`}>
                    <Button size="sm" variant="outline">
                      View Profile
                    </Button>
                  </Link>
                  <Button size="sm" onClick={() => handleShortlist(match.student.id)} disabled={savingStudentId === match.student.id}>
                    {savingStudentId === match.student.id ? 'Saving...' : currentStatus === 'shortlisted' ? 'Shortlisted' : 'Shortlist'}
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
