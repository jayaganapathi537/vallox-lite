'use client';

import { type FormEvent, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import MultiSelectChips from '@/components/vallox/MultiSelectChips';
import { COMMON_SKILLS, OPPORTUNITY_TYPES } from '@/lib/options';
import { SDG_META, SUPPORTED_SDGS } from '@/lib/sdg';
import type { OpportunityStatus, OpportunityType } from '@/models/vallox';

export interface OpportunityFormValues {
  title: string;
  description: string;
  requiredSkills: string[];
  sdgTags: number[];
  type: OpportunityType;
  location: string;
  isRemote: boolean;
  status: OpportunityStatus;
}

interface OpportunityFormProps {
  initialValues?: OpportunityFormValues;
  submitLabel: string;
  onSubmit: (values: OpportunityFormValues) => Promise<void>;
}

const defaultValues: OpportunityFormValues = {
  title: '',
  description: '',
  requiredSkills: [],
  sdgTags: [],
  type: 'internship',
  location: '',
  isRemote: true,
  status: 'open'
};

export default function OpportunityForm({ initialValues, submitLabel, onSubmit }: OpportunityFormProps) {
  const values = initialValues ?? defaultValues;

  const [title, setTitle] = useState(values.title);
  const [description, setDescription] = useState(values.description);
  const [requiredSkills, setRequiredSkills] = useState<string[]>(values.requiredSkills);
  const [sdgTags, setSdgTags] = useState<number[]>(values.sdgTags);
  const [type, setType] = useState<OpportunityType>(values.type);
  const [location, setLocation] = useState(values.location);
  const [isRemote, setIsRemote] = useState(values.isRemote);
  const [status, setStatus] = useState<OpportunityStatus>(values.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const skillOptions = useMemo(() => COMMON_SKILLS.map((skill) => ({ label: skill, value: skill })), []);
  const sdgOptions = useMemo(
    () => SUPPORTED_SDGS.map((sdg) => ({ value: sdg, label: `SDG ${sdg} - ${SDG_META[sdg].short}` })),
    []
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await onSubmit({
        title,
        description,
        requiredSkills,
        sdgTags,
        type,
        location,
        isRemote,
        status
      });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to save opportunity.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input label="Opportunity Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
      <Textarea
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        required
      />

      <div>
        <p className="text-sm font-medium text-ink-700">Type</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OPPORTUNITY_TYPES.map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-xl border px-3 py-2 text-sm font-semibold capitalize ${
                item === type
                  ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                  : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700'
              }`}
              onClick={() => setType(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Location"
        placeholder="City, Country"
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        required={!isRemote}
      />

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" checked={isRemote} onChange={(event) => setIsRemote(event.target.checked)} />
        Remote friendly
      </label>

      <div>
        <p className="text-sm font-medium text-ink-700">Status</p>
        <div className="mt-2 flex gap-2">
          {(['open', 'closed'] as OpportunityStatus[]).map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded-xl border px-3 py-2 text-sm font-semibold capitalize ${
                item === status
                  ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                  : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700'
              }`}
              onClick={() => setStatus(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <MultiSelectChips
        label="Required Skills"
        options={skillOptions}
        values={requiredSkills}
        onChange={setRequiredSkills}
      />
      <MultiSelectChips label="SDG Tags" options={sdgOptions} values={sdgTags} onChange={setSdgTags} />

      {error && <p className="text-sm text-sunrise-700">{error}</p>}

      <Button type="submit" disabled={submitting || !requiredSkills.length || !sdgTags.length}>
        {submitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}
