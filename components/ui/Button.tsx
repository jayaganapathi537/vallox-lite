'use client';

import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-300',
  secondary: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-400',
  outline: 'border border-slate-300 bg-white text-slate-800 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50/60',
  ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base'
};

export default function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
