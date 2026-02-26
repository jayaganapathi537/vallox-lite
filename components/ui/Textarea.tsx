'use client';

import clsx from 'clsx';
import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export default function Textarea({ label, hint, error, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;
  return (
    <label className="flex w-full flex-col gap-2 text-sm text-slate-700">
      {label && <span className="font-medium">{label}</span>}
      <textarea
        id={textareaId}
        className={clsx(
          'focus-ring min-h-[120px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400',
          'transition hover:border-slate-400',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
