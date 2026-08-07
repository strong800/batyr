'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

type FieldProps = {
  label: string;
  name: string;
  type?: 'text' | 'tel' | 'email' | 'number';
  required?: boolean;
  error?: string;
  hint?: string;
  onDark?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  className?: string;
};

const inputBase =
  'h-12 w-full rounded border bg-transparent px-4 font-sans text-body transition-colors placeholder:text-inkMuted/60';

export function Field({
  label,
  name,
  type = 'text',
  required,
  error,
  hint,
  onDark = false,
  defaultValue,
  placeholder,
  className,
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          'mb-2 block font-sans text-badge uppercase',
          onDark ? 'text-sand' : 'text-inkMuted',
        )}
      >
        {label}
        {required && (
          <span aria-hidden className={onDark ? 'text-emberOnDark' : 'text-ember'}>
            {' '}
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error && errorId, hint && hintId) || undefined}
        className={cn(
          inputBase,
          onDark
            ? 'border-forestLine text-paper focus:border-sand'
            : 'border-line text-ink focus:border-ink',
          error && (onDark ? 'border-emberOnDark' : 'border-ember'),
        )}
      />
      {hint && !error && (
        <p id={hintId} className={cn('mt-2 text-badge', onDark ? 'text-sand/70' : 'text-inkMuted')}>
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className={cn('mt-2 text-badge', onDark ? 'text-emberOnDark' : 'text-ember')}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function TextArea({
  label,
  name,
  rows = 4,
  onDark = false,
  error,
  className,
}: {
  label: string;
  name: string;
  rows?: number;
  onDark?: boolean;
  error?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          'mb-2 block font-sans text-badge uppercase',
          onDark ? 'text-sand' : 'text-inkMuted',
        )}
      >
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(
          'w-full rounded border bg-transparent px-4 py-3 font-sans text-body transition-colors',
          onDark
            ? 'border-forestLine text-paper focus:border-sand'
            : 'border-line text-ink focus:border-ink',
        )}
      />
      {error && (
        <p role="alert" className={cn('mt-2 text-badge', onDark ? 'text-emberOnDark' : 'text-ember')}>
          {error}
        </p>
      )}
    </div>
  );
}

export function Checkbox({
  label,
  name,
  error,
  onDark = false,
  defaultChecked,
}: {
  label: React.ReactNode;
  name: string;
  error?: string;
  onDark?: boolean;
  defaultChecked?: boolean;
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
          aria-invalid={error ? true : undefined}
          className={cn(
            // 24px — минимальный размер цели по WCAG 2.2 (2.5.8).
            // Это чекбокс согласия: без него форма не отправится.
            'mt-px h-6 w-6 shrink-0 rounded border bg-transparent accent-ember',
            onDark ? 'border-forestLine' : 'border-line',
          )}
        />
        <label
          htmlFor={id}
          className={cn('text-badge normal-case leading-relaxed', onDark ? 'text-sand' : 'text-inkMuted')}
        >
          {label}
        </label>
      </div>
      {error && (
        <p role="alert" className={cn('mt-2 text-badge', onDark ? 'text-emberOnDark' : 'text-ember')}>
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Ловушка для ботов вместо капчи.
 * Скрыта и от глаз, и от скринридеров, и исключена из порядка табуляции —
 * живой человек её не заполнит ни при каких условиях.
 */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="website">Не заполняйте это поле</label>
      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
