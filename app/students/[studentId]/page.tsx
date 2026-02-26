'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import SdgChip from '@/components/vallox/SdgChip';
import type { BaseUser, Project, StudentProfile } from '@/models/vallox';
import { getProjectsByStudentId } from '@/services/vallox/projectService';
import { getStudentProfile } from '@/services/vallox/studentService';
import { getUserById } from '@/services/vallox/userService';

export default function StudentPublicProfilePage() {
  const params = useParams<{ studentId: string }>();

  const [student, setStudent] = useState<BaseUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [userDoc, studentProfile, studentProjects] = await Promise.all([
          getUserById(params.studentId),
          getStudentProfile(params.studentId),
          getProjectsByStudentId(params.studentId)
        ]);

        if (!userDoc || userDoc.role !== 'student' || !studentProfile) {
          setError('Student profile not found.');
          return;
        }

        setStudent(userDoc);
        setProfile(studentProfile);
        setProjects(studentProjects);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Unable to load student profile.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.studentId]);

  if (loading) {
    return <LoadingState message="Loading student profile..." />;
  }

  if (!student || !profile) {
    return <ErrorState message={error || 'Student profile not found.'} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="space-y-3">
        <h1 className="text-3xl font-semibold text-ink-900">{student.name}</h1>
        <p className="text-lg text-ink-700">{profile.headline}</p>
        <p className="text-ink-600">{profile.bio}</p>
        <p className="text-sm text-ink-600">
          Contact: <span className="font-semibold text-ink-800">{student.email}</span>
        </p>

        <div>
          <p className="text-sm font-semibold text-ink-700">Skills</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink-700">SDG Interests</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.sdgInterests.map((sdg) => (
              <SdgChip key={`profile-${sdg}`} sdg={sdg} />
            ))}
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-ink-900">Projects</h2>
        {!projects.length ? (
          <Card>
            <p className="text-sm text-ink-600">No projects added yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <Card key={project.id} className="space-y-3">
                <h3 className="text-lg font-semibold text-ink-900">{project.title}</h3>
                <p className="text-sm text-ink-600">{project.description}</p>

                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <span key={tech} className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {project.sdgTags.map((sdg) => (
                    <SdgChip key={`${project.id}-${sdg}`} sdg={sdg} />
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 text-sm font-semibold text-sea-700">
                  {project.links.github ? (
                    <Link href={project.links.github} target="_blank">
                      GitHub
                    </Link>
                  ) : null}
                  {project.links.demo ? (
                    <Link href={project.links.demo} target="_blank">
                      Demo
                    </Link>
                  ) : null}
                  {project.links.video ? (
                    <Link href={project.links.video} target="_blank">
                      Video
                    </Link>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
