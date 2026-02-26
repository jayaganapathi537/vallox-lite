'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import RoleGate from '@/components/auth/RoleGate';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import { rankStudentsForOpportunity } from '@/lib/matching';
import type { Application, Opportunity, StudentMatch } from '@/models/vallox';
import { getApplicationsByOpportunity, updateApplicationStatus } from '@/services/vallox/applicationService';
import { getOpportunityById } from '@/services/vallox/opportunityService';
import { getAllStudentProfiles } from '@/services/vallox/studentService';
import { getUsersByIds } from '@/services/vallox/userService';

export default function OpportunityMatchesPage() {
  return (
    <RoleGate allowedRoles={['organisation']} requireOnboardingComplete>
      <OpportunityMatchesContent />
    </RoleGate>
  );
}

function OpportunityMatchesContent() {
  const params = useParams<{ id: string }>();
  const { appUser } = useAppAuth();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [matches, setMatches] = useState<StudentMatch[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const applicationByStudentId = useMemo(
    () => Object.fromEntries(applications.map((application) => [application.studentId, application])),
    [applications]
  );

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const selectedOpportunity = await getOpportunityById(params.id);

      if (!selectedOpportunity || selectedOpportunity.orgId !== appUser.id) {
        setError('Opportunity not found.');
        return;
      }

      const [profiles, appRows] = await Promise.all([getAllStudentProfiles(), getApplicationsByOpportunity(params.id)]);

      const users = await getUsersByIds(profiles.map((profile) => profile.userId));
      const userById = Object.fromEntries(users.map((user) => [user.id, user]));

      const students = profiles
        .map((profile) => {
          const user = userById[profile.userId];
          if (!user || user.role !== 'student') {
            return null;
          }

          return { user, profile };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      const ranked = rankStudentsForOpportunity(selectedOpportunity, students);

      setOpportunity(selectedOpportunity);
      setMatches(ranked);
      setApplications(appRows);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load matches.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser, params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleShortlist = async (studentId: string) => {
    if (!opportunity) return;

    await updateApplicationStatus(opportunity.id, studentId, 'shortlisted', opportunity.orgId);
    await loadData();
  };

  if (loading) {
    return <LoadingState message="Computing matches..." />;
  }

  if (!opportunity) {
    return <ErrorState message={error || 'Opportunity not found.'} />;
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <h1 className="text-2xl font-semibold text-ink-900">Matches for: {opportunity.title}</h1>
        <p className="text-ink-600">Ranking is deterministic based on skill overlap.</p>
      </Card>

      {error && <ErrorState message={error} />}

      {!matches.length ? (
        <Card>
          <p className="text-sm text-ink-600">No student profiles are currently available to match.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const application = applicationByStudentId[match.student.id];

            return (
              <Card key={match.student.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-ink-900">{match.student.name}</h3>
                    <p className="text-sm text-ink-600">{match.profile.headline}</p>
                    <p className="text-xs text-ink-500">{match.student.email}</p>
                  </div>
                  <span className="rounded-full bg-sea-50 px-3 py-1 text-xs font-semibold text-sea-700">
                    {match.matchScore}% match
                  </span>
                </div>

                <div className="grid gap-2 text-sm text-ink-600 md:grid-cols-2">
                  <p>Skill overlap: {match.skillOverlap.join(', ') || 'None'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/students/${match.student.id}`}>
                    <Button size="sm" variant="outline">
                      View profile
                    </Button>
                  </Link>
                  <Button size="sm" onClick={() => handleShortlist(match.student.id)}>
                    Shortlist
                  </Button>
                  {application ? (
                    <span className="text-xs font-semibold text-ink-600 capitalize">Current status: {application.status}</span>
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
