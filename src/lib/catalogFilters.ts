import type { FiltersState } from '@/components/catalog/CatalogClient';

/** Значения по умолчанию, когда в адресе нет параметров. */
export const DEFAULT_AREA_BOUNDS = { min: 0, max: 1000 };

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

/**
 * Разбор фильтров из адресной строки на сервере.
 *
 * Делается до рендера, чтобы клиентский компонент получил готовое
 * состояние пропсом: разметка сервера и клиента совпадают,
 * ссылкой с фильтрами можно делиться, мигания при загрузке нет.
 */
export function parseCatalogFilters(
  params: RawSearchParams,
  bounds: { min: number; max: number },
): FiltersState {
  const areaMinRaw = Number(first(params.areaMin));
  const areaMaxRaw = Number(first(params.areaMax));

  const areaMin = Number.isFinite(areaMinRaw) && areaMinRaw > 0 ? areaMinRaw : bounds.min;
  const areaMax = Number.isFinite(areaMaxRaw) && areaMaxRaw > 0 ? areaMaxRaw : bounds.max;

  const sortRaw = first(params.sort);
  const sort =
    sortRaw === 'areaAsc' || sortRaw === 'areaDesc' ? sortRaw : ('default' as const);

  return {
    // Защита от перепутанных местами границ в чужой ссылке
    areaMin: Math.min(areaMin, areaMax),
    areaMax: Math.max(areaMin, areaMax),
    floors: first(params.floors)
      .split(',')
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n)),
    category: first(params.category).split(',').filter(Boolean),
    terrace: first(params.terrace) === '1',
    mansard: first(params.mansard) === '1',
    sort,
  };
}

/** Границы слайдера площади по реальным данным каталога. */
export function areaBounds(projects: { areaM2: number | null }[]) {
  const areas = projects.map((p) => p.areaM2 ?? 0).filter((a) => a > 0);
  if (areas.length === 0) return DEFAULT_AREA_BOUNDS;
  return { min: Math.floor(Math.min(...areas)), max: Math.ceil(Math.max(...areas)) };
}
