'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ui } from '@/config/site';
import { cn, formatFloors, formatNumber, formatSize } from '@/lib/utils';
import { trackEvent } from '@/lib/analyticsClient';
import type { PictureMedia } from '@/components/media/Picture';

export type ProjectCardData = {
  slug: string;
  title: string;
  areaM2: number | null;
  floors: number | null;
  widthMm: number | null;
  lengthMm: number | null;
  hasTerrace: boolean;
  hasMansard: boolean;
  cover: PictureMedia | null;
};

/**
 * Карточка проекта.
 *
 * Характеристики стоят ПОД фотографией на песочной полосе, а не поверх кадра:
 * на снимках компании уже напечатана площадь, и вторая цифра поверх первой
 * читалась бы как ошибка вёрстки.
 */
export function ProjectCard({
  project,
  index = 0,
  priority = false,
  // Последнее значение в пикселях: контейнер шире 1440px не растёт,
  // поэтому проценты на широких экранах запрашивают лишнее
  sizes = '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, (max-width: 1600px) 30vw, 440px',
}: {
  project: ProjectCardData;
  index?: number;
  priority?: boolean;
  sizes?: string;
}) {
  const badges = [
    project.areaM2 ? `${formatNumber(project.areaM2)} ${ui.units.m2}` : null,
    formatFloors(project.floors),
    formatSize(project.widthMm, project.lengthMm),
    project.hasTerrace ? ui.labels.terrace : null,
    project.hasMansard ? ui.labels.mansard : null,
  ].filter((b): b is string => Boolean(b));

  return (
    <Link
      href={`/catalog/${project.slug}`}
      onClick={() => trackEvent('projectView', { slug: project.slug, place: 'card', index })}
      className="group block focus-visible:outline-offset-4"
    >
      <article>
        <div className="plate aspect-plate transition-colors duration-hover ease-calm group-hover:border-ink">
          {project.cover?.src && (
            <Image
              src={project.cover.src}
              alt={project.cover.alt ?? project.title}
              fill
              sizes={sizes}
              priority={priority}
              placeholder={project.cover.blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={project.cover.blurDataUrl ?? undefined}
              className="object-cover transition-transform duration-hover ease-calm group-hover:scale-[1.03]"
            />
          )}
        </div>

        {badges.length > 0 && (
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-sand px-4 py-3 font-sans text-badge uppercase tabularNums text-ink">
            {badges.map((badge, i) => (
              <li key={badge} className="flex items-center gap-4">
                {i > 0 && <span aria-hidden className="h-3 w-px bg-ink/25" />}
                {badge}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-baseline justify-between gap-4">
          <h3 className={cn('text-cardTitle text-ink transition-colors group-hover:text-ember')}>
            {project.title}
          </h3>
          <span
            aria-hidden
            className="shrink-0 font-sans text-badge uppercase text-inkMuted transition-transform duration-hover ease-calm group-hover:translate-x-1"
          >
            →
          </span>
        </div>
      </article>
    </Link>
  );
}
