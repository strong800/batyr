'use client';

import { useId, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMotionPreference } from '@/hooks/useMotionPreference';

export type PackageData = {
  key: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  items: { id: string; title: string; note: string | null }[];
};

/**
 * Переключатель комплектаций с переезжающим индикатором.
 *
 * На мобильном таблица из трёх уровней по 6–10 строк нечитаема,
 * поэтому там же, ниже, тот же контент разворачивается аккордеоном —
 * это не «адаптив сжатием», а другой способ подачи.
 */
export function PackagesTabs({ packages, onDark = true }: { packages: PackageData[]; onDark?: boolean }) {
  const [activeKey, setActiveKey] = useState(packages[1]?.key ?? packages[0]?.key ?? '');
  const { animate } = useMotionPreference();
  const groupId = useId();

  if (packages.length === 0) return null;

  const active = packages.find((p) => p.key === activeKey) ?? packages[0];

  const mutedText = onDark ? 'text-sand' : 'text-inkMuted';
  const lineColor = onDark ? 'border-forestLine' : 'border-line';

  return (
    <div>
      {/* Вкладки: на мобильном горизонтальная лента со скроллом */}
      <div
        role="tablist"
        aria-label="Уровни комплектации"
        className={cn('scrollRail -mx-gutterSm flex overflow-x-auto border-b px-gutterSm md:mx-0 md:px-0', lineColor)}
      >
        {packages.map((pack) => {
          const isActive = pack.key === active.key;
          return (
            <button
              key={pack.key}
              role="tab"
              id={`${groupId}-tab-${pack.key}`}
              aria-selected={isActive}
              aria-controls={`${groupId}-panel-${pack.key}`}
              onClick={() => setActiveKey(pack.key)}
              className={cn(
                'relative shrink-0 whitespace-nowrap px-1 py-4 pr-8 text-left font-display text-[1.125rem] uppercase tracking-wide transition-colors md:pr-12',
                isActive
                  ? onDark
                    ? 'text-paper'
                    : 'text-ink'
                  : cn(mutedText, onDark ? 'hover:text-paper' : 'hover:text-ink'),
              )}
            >
              {pack.title}
              {isActive &&
                (animate ? (
                  <motion.span
                    layoutId={`${groupId}-indicator`}
                    aria-hidden
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      'absolute inset-x-0 -bottom-px h-0.5',
                      onDark ? 'bg-emberOnDark' : 'bg-ember',
                    )}
                  />
                ) : (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-x-0 -bottom-px h-0.5',
                      onDark ? 'bg-emberOnDark' : 'bg-ember',
                    )}
                  />
                ))}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${groupId}-panel-${active.key}`}
        aria-labelledby={`${groupId}-tab-${active.key}`}
        className="pt-10"
      >
        {(active.subtitle || active.summary) && (
          <div className="mb-10 grid gap-4 lg:grid-cols-12">
            {active.subtitle && (
              <p
                className={cn(
                  'font-sans text-nums uppercase lg:col-span-3',
                  onDark ? 'text-timberLight' : 'text-inkMuted',
                )}
              >
                {active.subtitle}
              </p>
            )}
            {active.summary && (
              <p className={cn('max-w-prose text-lead lg:col-span-8', mutedText)}>{active.summary}</p>
            )}
          </div>
        )}

        {/* Состав: каждая строка с пояснением простым языком */}
        <ul>
          {active.items.map((item) => (
            <li
              key={item.id}
              className={cn('grid gap-2 border-t py-5 lg:grid-cols-12 lg:gap-8', lineColor)}
            >
              {/* h3, а не h4: заголовок секции — h2, и пропуск уровня
                  ломает навигацию по заголовкам в скринридере */}
              <h3
                className={cn(
                  'font-display text-[1.0625rem] uppercase tracking-wide lg:col-span-5',
                  onDark ? 'text-paper' : 'text-ink',
                )}
              >
                {item.title}
              </h3>
              {item.note && (
                <p className={cn('max-w-prose text-body lg:col-span-7', mutedText)}>{item.note}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
