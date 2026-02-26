'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RoleGate from '@/components/auth/RoleGate';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import Card from '@/components/ui/Card';
import OpportunityForm, { type OpportunityFormValues } from '@/components/vallox/OpportunityForm';
import { useAppAuth } from '@/lib/useAppAuth';
import { getOpportunityById, updateOpportunity } from '@/services/vallox/opportunityService';

export default function EditOpportunityPage() {
  return (
    <RoleGate allowedRoles={['organisation']} requireOnboardingComplete>
      <EditOpportunityContent />
    </RoleGate>
  );
}

function EditOpportunityContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { appUser } = useAppAuth();

  const [initialValues, setInitialValues] = useState<OpportunityFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOpportunity() {
      if (!appUser) return;

      setLoading(true);
      setError('');

      try {
        const opportunity = await getOpportunityById(params.id);

        if (!opportunity || opportunity.orgId !== appUser.id) {
          setError('Opportunity not found.');
          return;
        }

        setInitialValues({
          title: opportunity.title,
          description: opportunity.description,
          requiredSkills: opportunity.requiredSkills,
          sdgTags: opportunity.sdgTags,
          type: opportunity.type,
          location: opportunity.location,
          isRemote: opportunity.isRemote,
          status: opportunity.status
        });
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Unable to load opportunity.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadOpportunity();
  }, [appUser, params.id]);

  const handleSubmit = async (values: OpportunityFormValues) => {
    await updateOpportunity(params.id, values);
    router.push('/organization/dashboard');
  };

  if (loading) {
    return <LoadingState message="Loading opportunity..." />;
  }

  if (!initialValues) {
    return <ErrorState message={error || 'Opportunity not found.'} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Edit Opportunity</h1>
      {error && <ErrorState message={error} />}
      <Card>
        <OpportunityForm initialValues={initialValues} submitLabel="Save changes" onSubmit={handleSubmit} />
      </Card>
    </div>
  );
}
