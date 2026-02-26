'use client';

import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAppAuth } from '@/lib/useAppAuth';
import { getSystemSettings, logAudit, saveSystemSettings } from '@/services/vallox/adminOpsService';

export default function AdminSystemSettingsPage() {
  const { appUser } = useAppAuth();

  const [matchingSkillWeight, setMatchingSkillWeight] = useState(0.7);
  const [matchingSdgWeight, setMatchingSdgWeight] = useState(0.3);
  const [tasksEnabled, setTasksEnabled] = useState(true);
  const [verificationEnabled, setVerificationEnabled] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(120);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const settings = await getSystemSettings();
      setMatchingSkillWeight(settings.matchingSkillWeight);
      setMatchingSdgWeight(settings.matchingSdgWeight);
      setTasksEnabled(settings.tasksEnabled);
      setVerificationEnabled(settings.verificationEnabled);
      setSessionTimeoutMinutes(settings.sessionTimeoutMinutes);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load settings.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!appUser) return;

    const total = matchingSkillWeight + matchingSdgWeight;
    if (Math.abs(total - 1) > 0.001) {
      setError('Matching weights must total 1.0');
      return;
    }

    setSaving(true);
    setError('');
    setStatusMessage('');

    try {
      await saveSystemSettings({
        matchingSkillWeight,
        matchingSdgWeight,
        tasksEnabled,
        verificationEnabled,
        sessionTimeoutMinutes,
        updatedBy: appUser.id
      });

      await logAudit({
        actorId: appUser.id,
        actorRole: appUser.role,
        action: 'system_settings_updated',
        targetType: 'system_settings'
      });

      setStatusMessage('System settings updated successfully.');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save settings.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading system settings..." />;
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}
      {statusMessage ? <Card><p className="text-sm text-brand-700">{statusMessage}</p></Card> : null}

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Scoring Engine Settings</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Skill Weight (0-1)"
            type="number"
            min={0}
            max={1}
            step="0.1"
            value={matchingSkillWeight}
            onChange={(event) => setMatchingSkillWeight(Number(event.target.value))}
          />
          <Input
            label="SDG Weight (0-1)"
            type="number"
            min={0}
            max={1}
            step="0.1"
            value={matchingSdgWeight}
            onChange={(event) => setMatchingSdgWeight(Number(event.target.value))}
          />
          <Input
            label="Session Timeout (minutes)"
            type="number"
            min={15}
            value={sessionTimeoutMinutes}
            onChange={(event) => setSessionTimeoutMinutes(Number(event.target.value))}
          />
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-slate-700">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={tasksEnabled} onChange={(event) => setTasksEnabled(event.target.checked)} />
            Enable Task System
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={verificationEnabled} onChange={(event) => setVerificationEnabled(event.target.checked)} />
            Enable Verification
          </label>
        </div>

        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Card>
    </div>
  );
}
