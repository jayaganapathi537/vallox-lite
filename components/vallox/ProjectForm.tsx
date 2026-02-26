'use client';

import { type FormEvent, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import MultiSelectChips from '@/components/vallox/MultiSelectChips';
import { COMMON_SKILLS } from '@/lib/options';
import type { ProjectLinks } from '@/models/vallox';

export interface ProjectFormValues {
  title: string;
  description: string;
  techStack: string[];
  links: ProjectLinks;
  sdgTags: number[];
}

interface ProjectFormProps {
  initialValues?: ProjectFormValues;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  submitLabel: string;
}

const defaultValues: ProjectFormValues = {
  title: '',
  description: '',
  techStack: [],
  links: {},
  sdgTags: []
};

export default function ProjectForm({ initialValues, onSubmit, submitLabel }: ProjectFormProps) {
  const values = initialValues ?? defaultValues;

  const [title, setTitle] = useState(values.title);
  const [description, setDescription] = useState(values.description);
  const [techStack, setTechStack] = useState<string[]>(values.techStack);
  const [github, setGithub] = useState(values.links.github ?? '');
  const [demo, setDemo] = useState(values.links.demo ?? '');
  const [video, setVideo] = useState(values.links.video ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const skillOptions = useMemo(() => COMMON_SKILLS.map((skill) => ({ label: skill, value: skill })), []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await onSubmit({
        title,
        description,
        techStack,
        sdgTags: values.sdgTags ?? [],
        links: {
          github: github || undefined,
          demo: demo || undefined,
          video: video || undefined
        }
      });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to save project.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input label="Project Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
      <Textarea
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        required
      />

      <MultiSelectChips label="Tech Stack" options={skillOptions} values={techStack} onChange={setTechStack} />

      <Input label="GitHub URL" placeholder="https://github.com/..." value={github} onChange={(event) => setGithub(event.target.value)} />
      <Input label="Demo URL" placeholder="https://..." value={demo} onChange={(event) => setDemo(event.target.value)} />
      <Input label="Video URL" placeholder="https://..." value={video} onChange={(event) => setVideo(event.target.value)} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting || !techStack.length}>
        {submitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}
