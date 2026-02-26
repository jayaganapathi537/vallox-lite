'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import RoleGate from '@/components/auth/RoleGate';
import MultiSelectChips from '@/components/vallox/MultiSelectChips';
import { ORGANISATION_TYPES } from '@/lib/options';
import { SDG_META, SUPPORTED_SDGS } from '@/lib/sdg';
import { useAppAuth } from '@/lib/useAppAuth';
import { getOrganisationProfile, upsertOrganisationProfile } from '@/services/vallox/organisationService';
import { updateUser } from '@/services/vallox/userService';
import type { OrganisationType } from '@/models/vallox';

export default function OrganisationOnboardingPage() {
  return (
    <RoleGate allowedRoles={['organisation']} requireOnboardingIncomplete>
      <OrganisationOnboardingContent />
    </RoleGate>
  );
}

function OrganisationOnboardingContent() {
  const router = useRouter();
  const { appUser, refreshAppUser } = useAppAuth();

  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<OrganisationType>('startup');
  const [description, setDescription] = useState('');
  const [sdgFocus, setSdgFocus] = useState<number[]>([]);
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const sdgOptions = useMemo(
    () => SUPPORTED_SDGS.map((sdg) => ({ value: sdg, label: `SDG ${sdg} - ${SDG_META[sdg].short}` })),
    []
  );

  useEffect(() => {
    if (!appUser) return;

    getOrganisationProfile(appUser.id)
      .then((profile) => {
        if (!profile) return;

        setOrgName(profile.orgName);
        setOrgType(profile.type);
        setDescription(profile.description);
        setSdgFocus(profile.sdgFocus);
        setWebsite(profile.website ?? '');
      })
      .catch(() => {
        setError('Unable to load existing organisation profile.');
      });
  }, [appUser]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!appUser) return;

    setSaving(true);
    setError('');

    try {
      await upsertOrganisationProfile(appUser.id, {
        orgName,
        type: orgType,
        description,
        sdgFocus,
        website
      });

      await updateUser(appUser.id, { onboardingComplete: true });
      await refreshAppUser();
      router.push('/organization/dashboard');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save organisation profile.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink-900">Organisation Onboarding</h1>
        <p className="mt-2 text-ink-600">Define your SDG focus and start posting opportunities.</p>
      </div>

      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Organisation Name"
            value={orgName}
            onChange={(event) => setOrgName(event.target.value)}
            required
          />

          <div>
            <p className="text-sm font-medium text-ink-700">Organisation Type</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ORGANISATION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrgType(type)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold capitalize ${
                    orgType === type ? 'border-sea-400 bg-sea-50 text-sea-700' : 'border-ink-200 text-ink-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Description"
            placeholder="Describe your mission, projects, and impact goals."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />

          <Input
            label="Website (optional)"
            placeholder="https://example.org"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />

          <MultiSelectChips label="SDG Focus" options={sdgOptions} values={sdgFocus} onChange={setSdgFocus} />

          {error && <p className="text-sm text-sunrise-700">{error}</p>}

          <Button type="submit" disabled={saving || !sdgFocus.length}>
            {saving ? 'Saving...' : 'Complete onboarding'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
