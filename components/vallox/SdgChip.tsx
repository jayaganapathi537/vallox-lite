import clsx from 'clsx';
import { SDG_META, getSdgLabel, isSupportedSdg } from '@/lib/sdg';

interface SdgChipProps {
  sdg: number;
}

export default function SdgChip({ sdg }: SdgChipProps) {
  const colorClass = isSupportedSdg(sdg) ? SDG_META[sdg].color : 'bg-ink-100 text-ink-700 border-ink-200';

  return (
    <span
      title={getSdgLabel(sdg)}
      className={clsx('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', colorClass)}
    >
      {getSdgLabel(sdg)}
    </span>
  );
}
