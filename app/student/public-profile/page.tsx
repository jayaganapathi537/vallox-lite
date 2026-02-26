'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import SdgChip from '@/components/vallox/SdgChip';
import { useAppAuth } from '@/lib/useAppAuth';
import type { Project, StudentProfile } from '@/models/vallox';
import { getProjectsByStudentId } from '@/services/vallox/projectService';
import { getStudentProfile } from '@/services/vallox/studentService';

function profileStrength(profile: StudentProfile | null, projects: Project[]) {
  if (!profile) return 25;

  const score = [
    profile.headline.trim().length > 5,
    profile.bio.trim().length > 20,
    profile.skills.length >= 3,
    projects.length >= 2,
    projects.some((project) => Boolean(project.links.github)),
    projects.some((project) => Boolean(project.links.demo))
  ].filter(Boolean).length;

  return Math.round((score / 6) * 100);
}

export default function StudentPublicProfilePage() {
  const { appUser } = useAppAuth();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const [studentProfile, studentProjects] = await Promise.all([
        getStudentProfile(appUser.id),
        getProjectsByStudentId(appUser.id)
      ]);

      setProfile(studentProfile);
      setProjects(studentProjects);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load profile.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const strength = useMemo(() => profileStrength(profile, projects), [profile, projects]);
  const featured = useMemo(() => projects.slice(0, 4), [projects]);

  if (loading || !appUser) {
    return <LoadingState message="Loading public profile..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}

      <Card className="space-y-4 bg-gradient-to-r from-brand-600 to-brand-700 p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Public Profile</p>
            <h2 className="text-3xl font-semibold">{appUser.name}</h2>
            <p className="text-white/90">{profile?.headline ?? 'Complete your profile headline to improve visibility.'}</p>
            <p className="text-sm text-white/80">{appUser.email} · Open to Opportunities</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Profile Strength</p>
            <p className="text-4xl font-semibold">{strength}%</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/students/${appUser.id}`}>
            <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              Open Public View
            </Button>
          </Link>
          <Link href="/onboarding/student">
            <Button size="sm" className="bg-white text-brand-700 hover:bg-slate-100">
              Edit Profile
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-lg font-semibold text-slate-900">Proof-of-Work Summary</h3>
        <p className="text-sm text-slate-600">Projects and skills shown below are pulled from your live data.</p>
        {profile ? (
          <>
            <p className="text-sm text-slate-700">{profile.bio}</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {skill}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.sdgInterests.map((sdg) => (
                <SdgChip key={`profile-sdg-${sdg}`} sdg={sdg} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600">No profile data yet. Complete onboarding.</p>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-lg font-semibold text-slate-900">Featured Projects</h3>
        {!featured.length ? (
          <p className="text-sm text-slate-600">Add projects to showcase your proof-of-work.</p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {featured.map((project) => (
              <div key={project.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">{project.title}</p>
                <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.techStack.map((skill) => (
                    <span key={skill} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
