'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ui } from '@/config/site';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analyticsClient';
import type { LeadType } from '@/lib/enums';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Honeypot, TextArea } from './Field';

type LeadFormProps = {
  type: LeadType;
  onDark?: boolean;
  telegram: string;
  /** Заявка по конкретному проекту — название подставляется автоматически */
  projectSlug?: string;
  projectTitle?: string;
  /** Дополнительные скрытые поля: результат калькулятора и опции */
  extra?: Record<string, string | number | undefined>;
  /** Показывать поля индивидуального проекта */
  withCustomFields?: boolean;
  submitLabel?: string;
  className?: string;
};

type Errors = Record<string, string>;

export function LeadForm({
  type,
  onDark = false,
  telegram,
  projectSlug,
  projectTitle,
  extra,
  withCustomFields = false,
  submitLabel,
  className,
}: LeadFormProps) {
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    setSending(true);
    setErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);

    // Контекст источника — для отчёта в админке
    const params = new URLSearchParams(window.location.search);
    formData.set('type', type);
    formData.set('consent', formData.get('consent') === 'on' ? 'true' : 'false');
    if (withCustomFields) {
      formData.set('hasLand', formData.get('hasLand') === 'on' ? 'true' : 'false');
    }
    if (projectSlug) formData.set('projectSlug', projectSlug);
    if (projectTitle) formData.set('projectTitle', projectTitle);
    for (const [key, value] of Object.entries(extra ?? {})) {
      if (value !== undefined) formData.set(key, String(value));
    }
    formData.set('landingPath', window.location.pathname);
    if (document.referrer) formData.set('referrer', document.referrer);
    for (const key of ['source', 'medium', 'campaign', 'content', 'term'] as const) {
      const value = params.get(`utm_${key}`);
      if (value) {
        const field = `utm${key[0].toUpperCase()}${key.slice(1)}`;
        formData.set(field, value);
      }
    }

    try {
      const response = await fetch('/api/leads', { method: 'POST', body: formData });
      const result = (await response.json()) as { ok: boolean; errors?: Errors };

      if (result.ok) {
        trackEvent('formSubmit', { type, projectSlug: projectSlug ?? null });
        setDone(true);
        form.reset();
      } else {
        setErrors(result.errors ?? { form: ui.forms.genericError });
      }
    } catch (error) {
      console.error('[form] отправка заявки:', error);
      setErrors({ form: ui.forms.genericError });
    } finally {
      setSending(false);
    }
  }

  // Экран благодарности с переходом в Telegram
  if (done) {
    return (
      <div
        className={cn(
          'border p-8',
          onDark ? 'border-forestLine bg-forestSoft' : 'border-line bg-paperDeep',
          className,
        )}
        role="status"
      >
        <h3 className={cn('text-cardTitle', onDark ? 'text-paper' : 'text-ink')}>
          {ui.thanks.title}
        </h3>
        <p className={cn('mt-3 max-w-prose text-body', onDark ? 'text-sand' : 'text-inkMuted')}>
          {ui.thanks.text}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={telegram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('telegramClick', { place: 'thanks' })}
            className={cn(
              'inline-flex h-11 items-center rounded px-5 font-sans text-badge uppercase transition-colors',
              onDark ? 'bg-sand text-ink hover:bg-paperDeep' : 'bg-forest text-paper hover:bg-forestSoft',
            )}
          >
            {ui.cta.telegram}
          </a>
          <Button href="/catalog" variant="outline" onDark={onDark}>
            {ui.cta.catalog}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={cn('relative', className)}>
      <Honeypot />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={ui.forms.name}
          name="name"
          required
          error={errors.name}
          onDark={onDark}
          className="sm:col-span-1"
        />
        <Field
          label={ui.forms.phone}
          name="phone"
          type="tel"
          required
          error={errors.phone}
          onDark={onDark}
          placeholder="+7 999 123-45-67"
          className="sm:col-span-1"
        />

        {withCustomFields && (
          <>
            <Field
              label={ui.forms.areaWanted}
              name="areaM2"
              type="number"
              error={errors.areaM2}
              onDark={onDark}
            />
            <Field
              label={ui.forms.floorsWanted}
              name="floors"
              type="number"
              error={errors.floors}
              onDark={onDark}
            />
            <div className="sm:col-span-2">
              <Checkbox label={ui.forms.hasLand} name="hasLand" onDark={onDark} />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="leadFile"
                className={cn(
                  'mb-2 block font-sans text-badge uppercase',
                  onDark ? 'text-sand' : 'text-inkMuted',
                )}
              >
                {ui.forms.file}
              </label>
              <input
                id="leadFile"
                name="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.dwg,.dxf"
                aria-describedby="leadFileHint"
                className={cn(
                  'w-full rounded border px-4 py-3 text-badge file:mr-4 file:rounded file:border-0 file:px-4 file:py-2 file:font-sans file:text-badge file:uppercase',
                  onDark
                    ? 'border-forestLine text-sand file:bg-forestSoft file:text-sand'
                    : 'border-line text-inkMuted file:bg-sand file:text-ink',
                )}
              />
              <p
                id="leadFileHint"
                className={cn('mt-2 text-badge', onDark ? 'text-sand/70' : 'text-inkMuted')}
              >
                {ui.forms.fileHint}
              </p>
              {errors.file && (
                <p role="alert" className={cn('mt-2 text-badge', onDark ? 'text-emberOnDark' : 'text-ember')}>
                  {errors.file}
                </p>
              )}
            </div>
          </>
        )}

        <TextArea
          label={ui.forms.comment}
          name="comment"
          onDark={onDark}
          className="sm:col-span-2"
        />
      </div>

      {projectTitle && (
        <p className={cn('mt-5 text-badge uppercase', onDark ? 'text-timberLight' : 'text-inkMuted')}>
          Заявка по проекту: {projectTitle}
        </p>
      )}

      <div className="mt-6">
        <Checkbox
          name="consent"
          error={errors.consent}
          onDark={onDark}
          label={
            <>
              {ui.forms.consent}.{' '}
              <Link href="/privacy" className="underline underline-offset-2">
                Политика
              </Link>
            </>
          }
        />
      </div>

      {errors.form && (
        <p role="alert" className={cn('mt-4 text-body', onDark ? 'text-emberOnDark' : 'text-ember')}>
          {errors.form}
        </p>
      )}

      <div className="mt-7">
        <Button
          type="submit"
          disabled={sending}
          variant={onDark ? 'sand' : 'solid'}
          size="lg"
          onDark={onDark}
        >
          {sending ? ui.cta.sending : (submitLabel ?? ui.cta.submit)}
        </Button>
      </div>
    </form>
  );
}
