'use client';

import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export default function Input({ label, hint, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex w-full flex-col gap-2 text-sm text-slate-700">
      {label && <span className="font-medium">{label}</span>}
      <input
        id={inputId}
        className={clsx(
          'focus-ring w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400',
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
