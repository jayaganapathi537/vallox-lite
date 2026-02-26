'use client';

import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import MultiSelectChips from '@/components/vallox/MultiSelectChips';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import { SDG_META, SUPPORTED_SDGS } from '@/lib/sdg';
import { getOrganisationProfile, upsertOrganisationProfile } from '@/services/vallox/organisationService';

export default function OrganizationSettingsPage() {
  const { appUser } = useAppAuth();

  const [orgName, setOrgName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [sdgFocus, setSdgFocus] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadProfile = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const profile = await getOrganisationProfile(appUser.id);
      if (!profile) {
        setLoading(false);
        return;
      }

      setOrgName(profile.orgName);
      setDescription(profile.description);
      setWebsite(profile.website ?? '');
      setSdgFocus(profile.sdgFocus);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load settings.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!appUser) return;

    setSaving(true);
    setError('');
    setStatusMessage('');

    try {
      await upsertOrganisationProfile(appUser.id, {
        orgName,
        type: 'company',
        description,
        sdgFocus,
        website
      });
      setStatusMessage('Organization settings updated.');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save settings.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading organization settings..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}
      {statusMessage ? <Card><p className="text-sm text-brand-700">{statusMessage}</p></Card> : null}

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Organization Settings</h2>
        <Input label="Organization Name" value={orgName} onChange={(event) => setOrgName(event.target.value)} />
        <Textarea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
        <Input label="Website" value={website} onChange={(event) => setWebsite(event.target.value)} />

        <MultiSelectChips
          label="SDG Focus"
          options={SUPPORTED_SDGS.map((sdg) => ({ label: `SDG ${sdg} - ${SDG_META[sdg].short}`, value: sdg }))}
          values={sdgFocus}
          onChange={setSdgFocus}
        />

        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Card>
    </div>
  );
}
