'use client';

import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import MultiSelectChips from '@/components/vallox/MultiSelectChips';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { COMMON_SKILLS } from '@/lib/options';
import { SDG_META, SUPPORTED_SDGS } from '@/lib/sdg';
import { useAppAuth } from '@/lib/useAppAuth';
import { getStudentProfile, upsertStudentProfile } from '@/services/vallox/studentService';

export default function StudentSkillsInterestsPage() {
  const { appUser } = useAppAuth();

  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [sdgInterests, setSdgInterests] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadProfile = useCallback(async () => {
    if (!appUser) return;

    setLoading(true);
    setError('');

    try {
      const profile = await getStudentProfile(appUser.id);
      if (!profile) {
        setLoading(false);
        return;
      }

      setHeadline(profile.headline);
      setBio(profile.bio);
      setSkills(profile.skills);
      setSdgInterests(profile.sdgInterests);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load skills profile.';
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
      await upsertStudentProfile(appUser.id, {
        headline,
        bio,
        skills,
        sdgInterests
      });
      setStatusMessage('Skills and interests updated. Matching recommendations are now refreshed.');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save profile.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !appUser) {
    return <LoadingState message="Loading skills and interests..." />;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorState message={error} />}
      {statusMessage ? <Card><p className="text-sm text-brand-700">{statusMessage}</p></Card> : null}

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Skills & Interests</h2>
        <p className="text-sm text-slate-600">This data directly powers your opportunity matches.</p>

        <Input label="Primary Role / Headline" value={headline} onChange={(event) => setHeadline(event.target.value)} />
        <Textarea label="Profile Summary" value={bio} onChange={(event) => setBio(event.target.value)} />

        <MultiSelectChips
          label="Technical Skills"
          options={COMMON_SKILLS.map((skill) => ({ label: skill, value: skill }))}
          values={skills}
          onChange={setSkills}
        />

        <MultiSelectChips
          label="SDG / Domain Interests"
          options={SUPPORTED_SDGS.map((sdg) => ({ label: `SDG ${sdg} - ${SDG_META[sdg].short}`, value: sdg }))}
          values={sdgInterests}
          onChange={setSdgInterests}
        />

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
