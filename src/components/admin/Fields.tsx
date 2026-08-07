'use client';

import { useFormStatus } from 'react-dom';
import { useId } from 'react';
import { cn } from '@/lib/utils';

const controlBase =
  'w-full rounded border border-line bg-paper px-3 py-2.5 text-body text-ink transition-colors focus:border-ink';

export function AdminField({
  label,
  name,
  type = 'text',
  defaultValue,
  hint,
  required,
  step,
  min,
  max,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'url' | 'email' | 'tel';
  defaultValue?: string | number | null;
  hint?: string;
  required?: boolean;
  step?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-sans text-badge uppercase text-inkMuted">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        step={step}
        min={min}
        max={max}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ''}
        className={controlBase}
      />
      {hint && <p className="mt-1.5 text-badge normal-case text-inkMuted">{hint}</p>}
    </div>
  );
}

export function AdminTextArea({
  label,
  name,
  defaultValue,
  rows = 4,
  hint,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  hint?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-sans text-badge uppercase text-inkMuted">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ''}
        className={cn(controlBase, 'leading-relaxed')}
      />
      {hint && <p className="mt-1.5 text-badge normal-case text-inkMuted">{hint}</p>}
    </div>
  );
}

export function AdminSelect({
  label,
  name,
  options,
  defaultValue,
  hint,
  className,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
  hint?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-sans text-badge uppercase text-inkMuted">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? ''}
        className={cn(controlBase, 'appearance-none')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1.5 text-badge normal-case text-inkMuted">{hint}</p>}
    </div>
  );
}

export function AdminCheckbox({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          className="mt-0.5 h-6 w-6 shrink-0 rounded border border-line accent-ember"
        />
        <label htmlFor={id} className="text-body text-ink">
          {label}
        </label>
      </div>
      {hint && <p className="ml-8 mt-1 text-badge normal-case text-inkMuted">{hint}</p>}
    </div>
  );
}

/** Кнопка сохранения со статусом отправки формы. */
export function SubmitButton({
  children = 'Сохранить',
  variant = 'solid',
}: {
  children?: React.ReactNode;
  variant?: 'solid' | 'outline' | 'danger';
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'h-11 rounded px-5 font-sans text-badge uppercase transition-colors disabled:opacity-50',
        variant === 'solid' && 'bg-forest text-paper hover:bg-forestSoft',
        variant === 'outline' && 'border border-line text-ink hover:border-ink',
        variant === 'danger' && 'border border-ember text-ember hover:bg-ember hover:text-paper',
      )}
    >
      {pending ? 'Сохраняем…' : children}
    </button>
  );
}

/** Заголовок раздела админки с действием справа. */
export function AdminHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[1.75rem] uppercase tracking-wide">{title}</h1>
        {description && <p className="mt-2 max-w-prose text-body text-inkMuted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

/** Карточка-секция внутри страницы админки. */
export function AdminCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded border border-line bg-paper p-5 lg:p-6', className)}>
      {title && (
        <h2 className="mb-5 font-sans text-nums uppercase text-inkMuted">{title}</h2>
      )}
      {children}
    </section>
  );
}
