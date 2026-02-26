'use client';

import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import { getUserById, updateUser } from '@/services/vallox/userService';

export default function StudentSettingsPage() {
  const { appUser, refreshAppUser } = useAppAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadUser = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const user = await getUserById(appUser.id);
      if (!user) {
        setError('Unable to load account settings.');
        return;
      }
      setName(user.name);
      setEmail(user.email);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load settings.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleSave = async () => {
    if (!appUser) return;

    setSaving(true);
    setError('');
    setStatusMessage('');

    try {
      await updateUser(appUser.id, {
        name,
        email
      });
      await refreshAppUser();
      setStatusMessage('Account settings updated successfully.');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save settings.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading settings..." />;
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}
      {statusMessage ? <Card><p className="text-sm text-brand-700">{statusMessage}</p></Card> : null}

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Account Settings</h2>
        <p className="text-sm text-slate-600">Update basic account details used across your profile and panel.</p>
        <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} />
        <Input label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Card>
    </div>
  );
}
