'use client';

import { useRouter } from 'next/navigation';
import RoleGate from '@/components/auth/RoleGate';
import Card from '@/components/ui/Card';
import OpportunityForm from '@/components/vallox/OpportunityForm';
import { useAppAuth } from '@/lib/useAppAuth';
import { createOpportunity } from '@/services/vallox/opportunityService';

export default function NewOpportunityPage() {
  return (
    <RoleGate allowedRoles={['organisation']} requireOnboardingComplete>
      <NewOpportunityContent />
    </RoleGate>
  );
}

function NewOpportunityContent() {
  const router = useRouter();
  const { appUser } = useAppAuth();

  const handleSubmit = async (values: Parameters<typeof createOpportunity>[1]) => {
    if (!appUser) return;
    const created = await createOpportunity(appUser.id, values);
    router.push(`/opportunities/${created.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Post Opportunity</h1>
      <Card>
        <OpportunityForm submitLabel="Create opportunity" onSubmit={handleSubmit} />
      </Card>
    </div>
  );
}
