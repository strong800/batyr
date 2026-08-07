'use client';

import { useState } from 'react';
import { Picture } from '@/components/media/Picture';
import { trackEvent } from '@/lib/analyticsClient';
import { cn } from '@/lib/utils';
import type { MediaLite } from '@/lib/media';
import { Lightbox } from './Lightbox';

/**
 * Галерея проекта или объекта.
 *
 * Первый кадр крупный, остальные сеткой — асимметрия вместо ровных плиток.
 * Клик или Enter открывают лайтбокс, дальше листается стрелками.
 */
export function Gallery({
  items,
  title,
  eventMeta,
}: {
  items: MediaLite[];
  title: string;
  eventMeta?: Record<string, string>;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (items.length === 0) return null;

  function open(index: number) {
    setOpenIndex(index);
    trackEvent('lightboxOpen', { ...eventMeta, index });
  }

  const [first, ...rest] = items;

  return (
    <>
      <div className="grid gap-4 md:gap-6">
        <button
          type="button"
          onClick={() => open(0)}
          aria-label={`Открыть фото 1 из ${items.length}: ${first.alt ?? title}`}
          className="group block w-full text-left"
        >
          <Picture
            media={first}
            ratio="plate"
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className={cn(
              'md:aspect-[3/2]',
              'transition-colors duration-hover ease-calm group-hover:border-ink',
            )}
            imageClassName="transition-transform duration-hover ease-calm group-hover:scale-[1.02]"
          />
        </button>

        {rest.length > 0 && (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {rest.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => open(i + 1)}
                  aria-label={`Открыть фото ${i + 2} из ${items.length}: ${item.alt ?? title}`}
                  className="group block w-full text-left"
                >
                  <Picture
                    media={item}
                    ratio="plate"
                    sizes="(max-width: 768px) 50vw, 30vw"
                    className="transition-colors duration-hover ease-calm group-hover:border-ink"
                    imageClassName="transition-transform duration-hover ease-calm group-hover:scale-[1.03]"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Lightbox
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </>
  );
}
