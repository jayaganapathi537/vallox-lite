'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import RoleGate from '@/components/auth/RoleGate';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import SdgChip from '@/components/vallox/SdgChip';
import ProjectSummaryCard from '@/components/vallox/ProjectSummaryCard';
import OpportunitySummaryCard from '@/components/vallox/OpportunitySummaryCard';
import { useAppAuth } from '@/lib/useAppAuth';
import { rankOpportunitiesForStudent } from '@/lib/matching';
import type { OpportunityMatch, Project, StudentProfile } from '@/models/vallox';
import { getOrganisationProfilesByIds } from '@/services/vallox/organisationService';
import { getOpenOpportunities } from '@/services/vallox/opportunityService';
import { deleteProject, getProjectsByStudentId } from '@/services/vallox/projectService';
import { getStudentProfile } from '@/services/vallox/studentService';

export default function StudentDashboardPage() {
  return (
    <RoleGate allowedRoles={['student']} requireOnboardingComplete>
      <StudentDashboardContent />
    </RoleGate>
  );
}

function StudentDashboardContent() {
  const { appUser } = useAppAuth();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recommended, setRecommended] = useState<OpportunityMatch[]>([]);
  const [orgNameById, setOrgNameById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const [studentProfile, studentProjects, opportunities] = await Promise.all([
        getStudentProfile(appUser.id),
        getProjectsByStudentId(appUser.id),
        getOpenOpportunities()
      ]);

      setProfile(studentProfile);
      setProjects(studentProjects);

      if (studentProfile) {
        const ranked = rankOpportunitiesForStudent(studentProfile, opportunities).slice(0, 6);
        setRecommended(ranked);

        const orgIds = ranked.map((item) => item.opportunity.orgId);
        const orgProfiles = await getOrganisationProfilesByIds(orgIds);
        const lookup = Object.fromEntries(orgProfiles.map((org) => [org.userId, org.orgName]));
        setOrgNameById(lookup);
      } else {
        setRecommended([]);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load dashboard.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
    await loadData();
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading student dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <h1 className="text-2xl font-semibold text-ink-900">Student Dashboard</h1>
        <p className="text-ink-600">Welcome, {appUser.name}. Keep your profile and projects updated for better matches.</p>
        {profile ? (
          <div className="space-y-3 rounded-xl border border-ink-100 bg-ink-50 p-4">
            <p className="font-semibold text-ink-900">{profile.headline}</p>
            <p className="text-sm text-ink-600">{profile.bio}</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink-700">
                  {skill}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.sdgInterests.map((sdg) => (
                <SdgChip key={`profile-${sdg}`} sdg={sdg} />
              ))}
            </div>
          </div>
        ) : (
          <ErrorState message="No student profile found. Complete onboarding first." />
        )}
      </Card>

      {error && <ErrorState message={error} />}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-ink-900">My Projects</h2>
          <Link href="/projects/new">
            <Button size="sm">Add project</Button>
          </Link>
        </div>

        {!projects.length ? (
          <Card>
            <p className="text-sm text-ink-600">No projects yet. Add one to strengthen your proof-of-work profile.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectSummaryCard
                key={project.id}
                project={project}
                editHref={`/projects/${project.id}/edit`}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-ink-900">Recommended Opportunities</h2>
          <Link href="/opportunities">
            <Button size="sm" variant="outline">
              Browse all
            </Button>
          </Link>
        </div>

        {!recommended.length ? (
          <Card>
            <p className="text-sm text-ink-600">
              No recommendations yet. Add more skills or wait for organisations to post opportunities.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recommended.map((item) => (
              <OpportunitySummaryCard
                key={item.opportunity.id}
                opportunity={item.opportunity}
                orgName={orgNameById[item.opportunity.orgId]}
                matchScore={item.matchScore}
                detailHref={`/opportunities/${item.opportunity.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
