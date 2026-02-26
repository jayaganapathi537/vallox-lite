'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RoleGate from '@/components/auth/RoleGate';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import ProjectForm, { type ProjectFormValues } from '@/components/vallox/ProjectForm';
import { useAppAuth } from '@/lib/useAppAuth';
import { getProjectById, updateProject } from '@/services/vallox/projectService';

export default function EditProjectPage() {
  return (
    <RoleGate allowedRoles={['student']} requireOnboardingComplete>
      <EditProjectContent />
    </RoleGate>
  );
}

function EditProjectContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { appUser } = useAppAuth();

  const [initialValues, setInitialValues] = useState<ProjectFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProject() {
      if (!params.id || !appUser) return;

      setLoading(true);
      setError('');

      try {
        const project = await getProjectById(params.id);
        if (!project || project.userId !== appUser.id) {
          setError('Project not found.');
          return;
        }

        setInitialValues({
          title: project.title,
          description: project.description,
          techStack: project.techStack,
          sdgTags: project.sdgTags,
          links: project.links
        });
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Unable to load project.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [appUser, params.id]);

  const handleSubmit = async (values: ProjectFormValues) => {
    await updateProject(params.id, values);
    router.push('/student/dashboard');
  };

  if (loading) {
    return <LoadingState message="Loading project..." />;
  }

  if (!initialValues) {
    return <ErrorState message={error || 'Project was not found.'} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Edit Project</h1>
      {error && <ErrorState message={error} />}
      <Card>
        <ProjectForm initialValues={initialValues} submitLabel="Save changes" onSubmit={handleSubmit} />
      </Card>
    </div>
  );
}
