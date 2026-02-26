'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import OpportunitySummaryCard from '@/components/vallox/OpportunitySummaryCard';
import StatCard from '@/components/panels/StatCard';
import { useAppAuth } from '@/lib/useAppAuth';
import { rankOpportunitiesForStudent } from '@/lib/matching';
import type { Application, Opportunity, OpportunityMatch, Project, StudentProfile } from '@/models/vallox';
import { getApplicationsByStudent } from '@/services/vallox/applicationService';
import { getOrganisationProfilesByIds } from '@/services/vallox/organisationService';
import { getOpenOpportunities } from '@/services/vallox/opportunityService';
import { getProjectsByStudentId } from '@/services/vallox/projectService';
import { getStudentProfile } from '@/services/vallox/studentService';

function profileCompletion(profile: StudentProfile | null, projectsCount: number) {
  if (!profile) return 20;
  const score = [
    profile.headline.trim().length > 3,
    profile.bio.trim().length > 20,
    profile.skills.length > 0,
    projectsCount > 0
  ].filter(Boolean).length;
  return Math.round((score / 4) * 100);
}

export default function StudentDashboardPage() {
  const { appUser } = useAppAuth();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [recommended, setRecommended] = useState<OpportunityMatch[]>([]);
  const [orgNameById, setOrgNameById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotice, setShowNotice] = useState(true);

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const [studentProfile, projectRows, applicationRows, openOpportunities] = await Promise.all([
        getStudentProfile(appUser.id),
        getProjectsByStudentId(appUser.id),
        getApplicationsByStudent(appUser.id),
        getOpenOpportunities()
      ]);

      setProfile(studentProfile);
      setProjects(projectRows);
      setApplications(applicationRows);
      setOpportunities(openOpportunities);

      if (studentProfile) {
        const ranked = rankOpportunitiesForStudent(studentProfile, openOpportunities).slice(0, 6);
        setRecommended(ranked);

        const orgProfiles = await getOrganisationProfilesByIds(ranked.map((item) => item.opportunity.orgId));
        setOrgNameById(Object.fromEntries(orgProfiles.map((org) => [org.userId, org.orgName])));
      } else {
        setRecommended([]);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load student dashboard.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completion = useMemo(() => profileCompletion(profile, projects.length), [profile, projects.length]);
  const shortlisted = useMemo(() => applications.filter((item) => item.status === 'shortlisted').length, [applications]);
  const contacted = useMemo(() => applications.filter((item) => item.status === 'contacted').length, [applications]);

  if (loading || !appUser) {
    return <LoadingState message="Loading student dashboard..." />;
  }

  return (
    <div className="space-y-4">
      {showNotice && completion < 100 ? (
        <Card tone="accent" className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold text-brand-800">Complete your profile to improve visibility</p>
            <p className="text-sm text-slate-700">Add project links, skill tags, and profile details for better matching.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowNotice(false)}>
            Close
          </Button>
        </Card>
      ) : null}

      {error && <ErrorState message={error} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Profile Completion" value={`${completion}%`} note="Calculated from profile + projects" />
        <StatCard label="Total Projects" value={String(projects.length)} note="Proof-of-work portfolio" />
        <StatCard label="Applications" value={String(applications.length)} note={`Shortlisted: ${shortlisted}`} />
        <StatCard label="Messages Ready" value={String(contacted)} note="Recruiter contacted" />
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Profile Snapshot</h2>
            <p className="text-sm text-slate-600">Real-time profile data used by the matching engine.</p>
          </div>
          <Link href="/onboarding/student">
            <Button size="sm" variant="outline">
              Edit Profile
            </Button>
          </Link>
        </div>

        {profile ? (
          <>
            <p className="font-semibold text-slate-900">{profile.headline}</p>
            <p className="text-sm text-slate-600">{profile.bio}</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {skill}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600">Profile missing. Complete onboarding to unlock recommendations.</p>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Projects Overview</h2>
            <p className="text-sm text-slate-600">Manage your projects and keep your portfolio active.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/projects/new">
              <Button size="sm">Add New Project</Button>
            </Link>
            <Link href="/student/projects">
              <Button size="sm" variant="outline">
                Manage All
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Recommended Opportunities</h2>
          <Link href="/student/opportunities">
            <Button size="sm" variant="outline">
              Browse Opportunities ({opportunities.length})
            </Button>
          </Link>
        </div>

        {!recommended.length ? (
          <Card>
            <p className="text-sm text-slate-600">No recommendations yet. Add profile skills or wait for new postings.</p>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {recommended.map((match) => (
              <OpportunitySummaryCard
                key={match.opportunity.id}
                opportunity={match.opportunity}
                orgName={orgNameById[match.opportunity.orgId]}
                matchScore={match.matchScore}
                detailHref={`/opportunities/${match.opportunity.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
