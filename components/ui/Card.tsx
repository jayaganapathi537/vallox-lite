import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: 'default' | 'muted' | 'accent';
};

export default function Card({ tone = 'default', className, ...props }: CardProps) {
  const tones = {
    default: 'bg-white border border-slate-200/90',
    muted: 'bg-slate-50 border border-slate-200/90',
    accent: 'bg-brand-50/60 border border-brand-200/70'
  };

  return <div className={clsx('rounded-2xl p-6 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)]', tones[tone], className)} {...props} />;
}
