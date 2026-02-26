'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import RoleGate from '@/components/auth/RoleGate';
import MultiSelectChips from '@/components/vallox/MultiSelectChips';
import { COMMON_SKILLS } from '@/lib/options';
import { SDG_META, SUPPORTED_SDGS } from '@/lib/sdg';
import { useAppAuth } from '@/lib/useAppAuth';
import { upsertStudentProfile, getStudentProfile } from '@/services/vallox/studentService';
import { updateUser } from '@/services/vallox/userService';

export default function StudentOnboardingPage() {
  return (
    <RoleGate allowedRoles={['student']} requireOnboardingIncomplete>
      <StudentOnboardingContent />
    </RoleGate>
  );
}

function StudentOnboardingContent() {
  const router = useRouter();
  const { appUser, refreshAppUser } = useAppAuth();

  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [sdgInterests, setSdgInterests] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const skillOptions = useMemo(() => COMMON_SKILLS.map((skill) => ({ value: skill, label: skill })), []);
  const sdgOptions = useMemo(
    () => SUPPORTED_SDGS.map((sdg) => ({ value: sdg, label: `SDG ${sdg} - ${SDG_META[sdg].short}` })),
    []
  );

  useEffect(() => {
    if (!appUser) return;

    getStudentProfile(appUser.id)
      .then((profile) => {
        if (!profile) return;
        setHeadline(profile.headline);
        setBio(profile.bio);
        setSkills(profile.skills);
        setSdgInterests(profile.sdgInterests);
      })
      .catch(() => {
        setError('Unable to load your existing profile. You can still continue.');
      });
  }, [appUser]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!appUser) return;

    setSaving(true);
    setError('');

    try {
      await upsertStudentProfile(appUser.id, {
        headline,
        bio,
        skills,
        sdgInterests
      });

      await updateUser(appUser.id, { onboardingComplete: true });
      await refreshAppUser();
      router.push('/student/dashboard');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save your profile.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink-900">Student Onboarding</h1>
        <p className="mt-2 text-ink-600">Set your skills and SDG interests to unlock recommendations.</p>
      </div>

      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Headline"
            placeholder="ML + Flutter Developer"
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            required
          />

          <Textarea
            label="Bio"
            placeholder="Tell organisations what you build and care about"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            required
          />

          <MultiSelectChips label="Skills" options={skillOptions} values={skills} onChange={setSkills} />
          <MultiSelectChips label="SDG Interests" options={sdgOptions} values={sdgInterests} onChange={setSdgInterests} />

          {error && <p className="text-sm text-sunrise-700">{error}</p>}

          <Button type="submit" disabled={saving || !skills.length || !sdgInterests.length}>
            {saving ? 'Saving...' : 'Complete onboarding'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
