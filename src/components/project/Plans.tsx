'use client';

import { useState } from 'react';
import { ui } from '@/config/site';
import { Picture } from '@/components/media/Picture';
import { trackEvent } from '@/lib/analyticsClient';
import type { MediaLite } from '@/lib/media';
import { Lightbox } from './Lightbox';

/**
 * Планировки: кликабельные, открываются в лайтбоксе с полным размером —
 * размеры на чертеже иначе не прочитать.
 */
export function Plans({ items, projectSlug }: { items: MediaLite[]; projectSlug: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-6 font-sans text-nums uppercase text-inkMuted">{ui.labels.plans}</h2>
      <ul className="grid gap-6 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                setOpenIndex(i);
                trackEvent('lightboxOpen', { slug: projectSlug, kind: 'plan' });
              }}
              aria-label={`Открыть планировку: ${item.caption ?? item.alt ?? 'план'}`}
              className="group block w-full text-left"
            >
              <Picture
                media={item}
                ratio="plate"
                sizes="(max-width: 640px) 100vw, 45vw"
                className="transition-colors duration-hover ease-calm group-hover:border-ink"
              />
              <p className="mt-3 flex items-center gap-2 font-sans text-badge uppercase text-inkMuted">
                {item.caption ?? 'Планировка'}
                <span
                  aria-hidden
                  className="transition-transform duration-hover ease-calm group-hover:translate-x-1"
                >
                  ↗
                </span>
              </p>
            </button>
          </li>
        ))}
      </ul>

      <Lightbox
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </section>
  );
}
