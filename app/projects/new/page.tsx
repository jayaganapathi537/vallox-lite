'use client';

import { useRouter } from 'next/navigation';
import RoleGate from '@/components/auth/RoleGate';
import Card from '@/components/ui/Card';
import ProjectForm from '@/components/vallox/ProjectForm';
import { useAppAuth } from '@/lib/useAppAuth';
import { createProject } from '@/services/vallox/projectService';

export default function NewProjectPage() {
  return (
    <RoleGate allowedRoles={['student']} requireOnboardingComplete>
      <NewProjectContent />
    </RoleGate>
  );
}

function NewProjectContent() {
  const router = useRouter();
  const { appUser } = useAppAuth();

  const handleSubmit = async (values: Parameters<typeof createProject>[1]) => {
    if (!appUser) return;
    await createProject(appUser.id, values);
    router.push('/student/dashboard');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Add Project</h1>
      <Card>
        <ProjectForm submitLabel="Create project" onSubmit={handleSubmit} />
      </Card>
    </div>
  );
}
