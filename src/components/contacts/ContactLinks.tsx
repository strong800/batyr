'use client';

import type { Contacts } from '@/lib/settings';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analyticsClient';

/**
 * Телефон, Telegram и адрес одним блоком.
 * Клики по телефону и Telegram уходят в свою аналитику — это две
 * из целевых метрик воронки.
 */
export function ContactLinks({
  contacts,
  onDark = false,
  place,
  className,
}: {
  contacts: Contacts;
  onDark?: boolean;
  place: string;
  className?: string;
}) {
  // min-h-11 = 44px: строка текста высотой 19px — слишком мелкая цель
  // для пальца, а это главные ссылки сайта
  const linkClass = cn(
    'inline-flex min-h-11 items-center transition-colors',
    onDark ? 'text-paper hover:text-emberOnDark' : 'text-ink hover:text-ember',
  );
  const mutedClass = onDark ? 'text-sand' : 'text-inkMuted';

  return (
    <ul className={cn('flex flex-col gap-2', className)}>
      <li>
        <a
          href={`tel:${contacts.phoneRaw}`}
          onClick={() => trackEvent('phoneClick', { place })}
          className={cn(linkClass, 'font-display text-[1.25rem] tracking-wide')}
        >
          {contacts.phone}
        </a>
        <p className={cn('text-badge uppercase', mutedClass)}>{contacts.phonePerson}</p>
      </li>

      <li>
        <a
          href={contacts.telegram}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('telegramClick', { place })}
          className={cn(linkClass, 'text-body')}
        >
          Telegram · {contacts.telegramLabel}
        </a>
      </li>

      {contacts.instagram && (
        <li>
          <a
            href={contacts.instagram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('instagramClick', { place })}
            className={cn(linkClass, 'text-body')}
          >
            Instagram · {contacts.instagramLabel}
          </a>
        </li>
      )}

      <li className={cn('mt-2 text-body', mutedClass)}>
        <address className="not-italic">{contacts.address}</address>
        <p className="mt-1">{contacts.workHours}</p>
      </li>
    </ul>
  );
}
