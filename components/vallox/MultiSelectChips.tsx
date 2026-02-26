'use client';

interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface MultiSelectChipsProps<T extends string | number> {
  label: string;
  options: Option<T>[];
  values: T[];
  onChange: (next: T[]) => void;
}

export default function MultiSelectChips<T extends string | number>({
  label,
  options,
  values,
  onChange
}: MultiSelectChipsProps<T>) {
  if (/sdg/i.test(label)) {
    return null;
  }

  const toggle = (value: T) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }

    onChange([...values, value]);
  };

  return (
    <div>
      <p className="text-sm font-medium text-ink-700">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = values.includes(option.value);
          return (
            <button
              key={`${option.value}`}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                isActive
                  ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700'
              }`}
              onClick={() => toggle(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
