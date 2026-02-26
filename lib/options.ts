import { SUPPORTED_SDGS } from '@/lib/sdg';
import type { OpportunityType, OrganisationType } from '@/models/vallox';

export const COMMON_SKILLS = [
  'React',
  'TypeScript',
  'Next.js',
  'Node.js',
  'Python',
  'TensorFlow',
  'Flutter',
  'Firebase',
  'Data Analysis',
  'UI/UX',
  'Project Management',
  'Community Outreach',
  'Research',
  'Public Speaking',
  'Figma',
  'SQL'
] as const;

export const OPPORTUNITY_TYPES: OpportunityType[] = ['internship', 'project', 'volunteer', 'job'];

export const ORGANISATION_TYPES: OrganisationType[] = ['startup', 'ngo', 'company', 'other'];

export const SDG_OPTIONS = SUPPORTED_SDGS.map((sdg) => ({ label: `SDG ${sdg}`, value: sdg }));

export const STATUS_OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' }
] as const;
