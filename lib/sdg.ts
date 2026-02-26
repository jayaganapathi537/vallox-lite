export const SUPPORTED_SDGS = [4, 8, 10, 17] as const;

export type SupportedSdg = (typeof SUPPORTED_SDGS)[number];

export const SDG_META: Record<SupportedSdg, { title: string; short: string; description: string; color: string }> = {
  4: {
    title: 'Quality Education',
    short: 'Skills for Employment',
    description: 'Target 4.4: increase relevant skills for decent jobs and entrepreneurship.',
    color: 'bg-sky-100 text-sky-800 border-sky-200'
  },
  8: {
    title: 'Decent Work and Economic Growth',
    short: 'Decent Work',
    description: 'Promote youth access to decent and productive work opportunities.',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  10: {
    title: 'Reduced Inequalities',
    short: 'Reduced Inequalities',
    description: 'Enable fair, skills-based access to opportunities.',
    color: 'bg-rose-100 text-rose-800 border-rose-200'
  },
  17: {
    title: 'Partnerships for the Goals',
    short: 'Partnerships',
    description: 'Connect students, startups, and NGOs for shared SDG impact.',
    color: 'bg-violet-100 text-violet-800 border-violet-200'
  }
};

export function isSupportedSdg(value: number): value is SupportedSdg {
  return SUPPORTED_SDGS.includes(value as SupportedSdg);
}

export function normalizeSdgList(values: number[]): SupportedSdg[] {
  return values.filter(isSupportedSdg);
}

export function getSdgLabel(sdg: number) {
  if (!isSupportedSdg(sdg)) {
    return `SDG ${sdg}`;
  }
  return `SDG ${sdg} - ${SDG_META[sdg].short}`;
}

export function getSdgDescription(sdg: number) {
  if (!isSupportedSdg(sdg)) {
    return 'Unsupported SDG';
  }
  return SDG_META[sdg].description;
}
