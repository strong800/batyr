'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ui } from '@/config/site';
import { CATEGORY_LABELS, type ProjectCategory } from '@/lib/enums';
import { cn, formatNumber } from '@/lib/utils';
import { trackEvent } from '@/lib/analyticsClient';
import type { CatalogProject } from '@/lib/projects';
import { ProjectCard } from './ProjectCard';
import { Reveal } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/Button';

type SortKey = 'areaAsc' | 'areaDesc' | 'default';

export type FiltersState = {
  areaMin: number;
  areaMax: number;
  floors: number[];
  category: string[];
  terrace: boolean;
  mansard: boolean;
  sort: SortKey;
};

const SORT_LABELS: Record<SortKey, string> = {
  default: 'По умолчанию',
  areaAsc: 'Площадь: по возрастанию',
  areaDesc: 'Площадь: по убыванию',
};

/**
 * Каталог с фильтрами.
 *
 * Фильтрация идёт на клиенте — при десятках проектов это мгновенно,
 * без единого запроса к серверу. Состояние пишется в URL через
 * replaceState, поэтому ссылкой можно поделиться, а история браузера
 * не забивается каждым движением ползунка.
 *
 * Начальное состояние приходит пропсом с сервера, а не читается через
 * useSearchParams: так серверная и клиентская разметка совпадают
 * с первого кадра и не нужна Suspense-граница.
 */
export function CatalogClient({
  projects,
  initialFilters,
}: {
  projects: CatalogProject[];
  initialFilters: FiltersState;
}) {
  // Границы слайдера считаем по реальным данным, а не задаём константами
  const bounds = useMemo(() => {
    const areas = projects.map((p) => p.areaM2 ?? 0).filter((a) => a > 0);
    return {
      min: areas.length ? Math.floor(Math.min(...areas)) : 0,
      max: areas.length ? Math.ceil(Math.max(...areas)) : 200,
    };
  }, [projects]);

  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    trackEvent('catalogView');
  }, []);

  // Синхронизация с адресной строкой
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.areaMin > bounds.min) params.set('areaMin', String(filters.areaMin));
    if (filters.areaMax < bounds.max) params.set('areaMax', String(filters.areaMax));
    if (filters.floors.length) params.set('floors', filters.floors.join(','));
    if (filters.category.length) params.set('category', filters.category.join(','));
    if (filters.terrace) params.set('terrace', '1');
    if (filters.mansard) params.set('mansard', '1');
    if (filters.sort !== 'default') params.set('sort', filters.sort);

    const query = params.toString();
    // replaceState вместо push: иначе «Назад» будет отматывать каждое
    // изменение фильтра по одному
    window.history.replaceState(null, '', query ? `/catalog?${query}` : '/catalog');
  }, [filters, bounds]);

  const visible = useMemo(() => {
    const result = projects.filter((p) => {
      const area = p.areaM2 ?? 0;
      if (area && (area < filters.areaMin || area > filters.areaMax)) return false;
      if (filters.floors.length && !filters.floors.includes(p.floors ?? 0)) return false;
      if (filters.category.length && !filters.category.includes(p.category)) return false;
      if (filters.terrace && !p.hasTerrace) return false;
      if (filters.mansard && !p.hasMansard) return false;
      return true;
    });

    if (filters.sort === 'areaAsc') result.sort((a, b) => (a.areaM2 ?? 0) - (b.areaM2 ?? 0));
    if (filters.sort === 'areaDesc') result.sort((a, b) => (b.areaM2 ?? 0) - (a.areaM2 ?? 0));
    return result;
  }, [projects, filters]);

  const activeCount =
    (filters.areaMin > bounds.min || filters.areaMax < bounds.max ? 1 : 0) +
    (filters.floors.length ? 1 : 0) +
    (filters.category.length ? 1 : 0) +
    (filters.terrace ? 1 : 0) +
    (filters.mansard ? 1 : 0);

  const reset = useCallback(() => {
    setFilters({
      areaMin: bounds.min,
      areaMax: bounds.max,
      floors: [],
      category: [],
      terrace: false,
      mansard: false,
      sort: 'default',
    });
  }, [bounds]);

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  const availableFloors = useMemo(
    () => Array.from(new Set(projects.map((p) => p.floors).filter((f): f is number => !!f))).sort(),
    [projects],
  );
  const availableCategories = useMemo(
    () => Array.from(new Set(projects.map((p) => p.category))),
    [projects],
  );

  const filterPanel = (
    <div className="flex flex-col gap-8">
      {/* Площадь */}
      <fieldset>
        <legend className="mb-4 font-sans text-nums uppercase text-inkMuted">
          {ui.labels.area}
        </legend>
        <div className="flex items-baseline justify-between font-display text-[1.125rem] tabularNums">
          <span>{filters.areaMin} м²</span>
          <span className="text-inkMuted">—</span>
          <span>{filters.areaMax} м²</span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <label className="sr-only" htmlFor="areaMin">
            Минимальная площадь
          </label>
          <input
            id="areaMin"
            type="range"
            min={bounds.min}
            max={bounds.max}
            value={filters.areaMin}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                areaMin: Math.min(Number(e.target.value), f.areaMax),
              }))
            }
            className="w-full accent-ember"
          />
          <label className="sr-only" htmlFor="areaMax">
            Максимальная площадь
          </label>
          <input
            id="areaMax"
            type="range"
            min={bounds.min}
            max={bounds.max}
            value={filters.areaMax}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                areaMax: Math.max(Number(e.target.value), f.areaMin),
              }))
            }
            className="w-full accent-ember"
          />
        </div>
      </fieldset>

      {/* Этажность */}
      {availableFloors.length > 1 && (
        <fieldset>
          <legend className="mb-4 font-sans text-nums uppercase text-inkMuted">
            {ui.labels.floors}
          </legend>
          <div className="flex flex-wrap gap-2">
            {availableFloors.map((floor) => (
              <button
                key={floor}
                type="button"
                aria-pressed={filters.floors.includes(floor)}
                onClick={() => setFilters((f) => ({ ...f, floors: toggle(f.floors, floor) }))}
                className={cn(
                  'h-10 rounded border px-4 font-sans text-badge uppercase transition-colors',
                  filters.floors.includes(floor)
                    ? 'border-ember text-ember'
                    : 'border-line text-inkMuted hover:border-ink hover:text-ink',
                )}
              >
                {floor === 1 ? '1 этаж' : `${floor} этажа`}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* Тип */}
      {availableCategories.length > 1 && (
        <fieldset>
          <legend className="mb-4 font-sans text-nums uppercase text-inkMuted">Тип</legend>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={filters.category.includes(category)}
                onClick={() =>
                  setFilters((f) => ({ ...f, category: toggle(f.category, category) }))
                }
                className={cn(
                  'h-10 rounded border px-4 font-sans text-badge uppercase transition-colors',
                  filters.category.includes(category)
                    ? 'border-ember text-ember'
                    : 'border-line text-inkMuted hover:border-ink hover:text-ink',
                )}
              >
                {CATEGORY_LABELS[category as ProjectCategory] ?? category}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* Что есть в доме */}
      <fieldset>
        <legend className="mb-4 font-sans text-nums uppercase text-inkMuted">Особенности</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['terrace', ui.labels.terrace],
              ['mansard', ui.labels.mansard],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filters[key]}
              onClick={() => setFilters((f) => ({ ...f, [key]: !f[key] }))}
              className={cn(
                'h-10 rounded border px-4 font-sans text-badge uppercase transition-colors',
                filters[key]
                  ? 'border-ember text-ember'
                  : 'border-line text-inkMuted hover:border-ink hover:text-ink',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Сортировка */}
      <div>
        <label htmlFor="sort" className="mb-4 block font-sans text-nums uppercase text-inkMuted">
          Сортировка
        </label>
        <select
          id="sort"
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as SortKey }))}
          className="h-11 w-full appearance-none rounded border border-line bg-transparent px-4 font-sans text-body text-ink"
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={reset}
          className="self-start font-sans text-badge uppercase text-ember underline underline-offset-4"
        >
          {ui.cta.reset}
        </button>
      )}
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      {/* Фильтры: сбоку на десктопе, в шторке на мобильном */}
      <aside className="hidden lg:col-span-3 lg:block">
        <div className="sticky top-28">{filterPanel}</div>
      </aside>

      <div className="lg:col-span-9">
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="font-sans text-badge uppercase text-inkMuted tabularNums">
            {visible.length === 0
              ? 'Ничего не найдено'
              : `${visible.length} ${visible.length === 1 ? 'проект' : visible.length < 5 ? 'проекта' : 'проектов'}`}
          </p>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="h-10 rounded border border-line px-4 font-sans text-badge uppercase lg:hidden"
          >
            {ui.cta.filters}
            {activeCount > 0 && <span className="ml-2 text-ember">{activeCount}</span>}
          </button>
        </div>

        {visible.length === 0 ? (
          <div className="border border-line bg-paperDeep p-10">
            <p className="max-w-prose text-lead text-inkMuted">{ui.empty.projects}</p>
            <Button className="mt-6" variant="outline" onClick={reset}>
              {ui.cta.reset}
            </Button>
          </div>
        ) : (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {/* Заголовки карточек — h3. Без этого h2 получился бы пропуск
                уровня h1 → h3, и скринридер терял бы структуру страницы */}
            <h2 className="sr-only">Список проектов</h2>
            {visible.map((project, i) => (
              <Reveal key={project.slug} index={i}>
                <ProjectCard
                  project={project}
                  index={i}
                  priority={i < 3}
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, (max-width: 1600px) 28vw, 400px"
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {/* Мобильная шторка фильтров */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-paper lg:hidden">
          <div className="flex items-center justify-between border-b border-line px-gutterSm py-5">
            <p className="font-display text-[1.25rem] uppercase">{ui.cta.filters}</p>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="h-11 px-2 font-sans text-badge uppercase text-inkMuted"
            >
              {ui.cta.close}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-gutterSm py-8">{filterPanel}</div>
          <div className="border-t border-line px-gutterSm py-5">
            <Button onClick={() => setMobileOpen(false)} size="lg" className="w-full">
              {ui.cta.apply}
              {visible.length > 0 && (
                <span className="tabularNums"> · {formatNumber(visible.length, 0)}</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
