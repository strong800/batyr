import { db, safeQuery } from './db';

export type Period = { from: Date; to: Date; days: number; label: string };

/** Разбор периода из адресной строки: 7 / 30 / 90 дней или свой диапазон. */
export function resolvePeriod(params: {
  period?: string;
  from?: string;
  to?: string;
}): Period {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (params.from && params.to) {
    const from = new Date(params.from);
    const to = new Date(params.to);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from <= to) {
      to.setHours(23, 59, 59, 999);
      const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000));
      return { from, to, days, label: 'Свой период' };
    }
  }

  const preset = Number(params.period);
  const days = [7, 30, 90].includes(preset) ? preset : 30;
  const from = new Date(endOfToday);
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);

  return { from, to: endOfToday, days, label: `${days} дней` };
}

export type DayPoint = { date: string; views: number; visitors: number };

export type AnalyticsData = {
  totalViews: number;
  uniqueVisitors: number;
  byDay: DayPoint[];
  topPages: { path: string; views: number }[];
  topProjects: { slug: string; views: number }[];
  sources: { source: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
  funnel: { catalogView: number; projectView: number; formSubmit: number };
  events: Record<string, number>;
  scrollDepth: Record<string, number>;
};

const EMPTY: AnalyticsData = {
  totalViews: 0,
  uniqueVisitors: 0,
  byDay: [],
  topPages: [],
  topProjects: [],
  sources: [],
  devices: [],
  funnel: { catalogView: 0, projectView: 0, formSubmit: 0 },
  events: {},
  scrollDepth: {},
};

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

/**
 * Все цифры считаются из локальной SQLite — внешних сервисов нет.
 * Собираем одним проходом по нужным таблицам, без сырых SQL-запросов,
 * чтобы не зависеть от диалекта.
 */
export async function getAnalytics(period: Period): Promise<AnalyticsData> {
  const range = { gte: period.from, lte: period.to };

  const [pageViews, events, visitors] = await Promise.all([
    safeQuery(
      'analytics:pageViews',
      () =>
        db.pageView.findMany({
          where: { createdAt: range },
          select: { path: true, visitorId: true, createdAt: true, device: true },
        }),
      [],
    ),
    safeQuery(
      'analytics:events',
      () =>
        db.event.findMany({
          where: { createdAt: range },
          select: { name: true, meta: true, visitorId: true, path: true },
        }),
      [],
    ),
    safeQuery(
      'analytics:visitors',
      () =>
        db.visitor.findMany({
          where: { firstSeen: range },
          select: { id: true, device: true, utmSource: true, referrer: true },
        }),
      [],
    ),
  ]);

  if (pageViews.length === 0 && events.length === 0 && visitors.length === 0) {
    return { ...EMPTY, byDay: buildEmptyDays(period) };
  }

  // Посещаемость по дням
  const dayMap = new Map<string, { views: number; visitors: Set<string> }>();
  const cursor = new Date(period.from);
  while (cursor <= period.to) {
    dayMap.set(dayKey(cursor), { views: 0, visitors: new Set() });
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const view of pageViews) {
    const key = dayKey(view.createdAt);
    const bucket = dayMap.get(key);
    if (!bucket) continue;
    bucket.views += 1;
    bucket.visitors.add(view.visitorId);
  }

  const byDay: DayPoint[] = [...dayMap.entries()].map(([date, bucket]) => ({
    date,
    views: bucket.views,
    visitors: bucket.visitors.size,
  }));

  // Популярные страницы
  const pathCounts = new Map<string, number>();
  for (const view of pageViews) {
    pathCounts.set(view.path, (pathCounts.get(view.path) ?? 0) + 1);
  }
  const topPages = [...pathCounts.entries()]
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Самые просматриваемые проекты — из событий projectView
  const projectCounts = new Map<string, number>();
  for (const event of events) {
    if (event.name !== 'projectView' || !event.meta) continue;
    try {
      const meta = JSON.parse(event.meta) as { slug?: string; place?: string };
      // Считаем только открытия страницы, не показы карточки в сетке
      if (meta.place !== 'page' || !meta.slug) continue;
      projectCounts.set(meta.slug, (projectCounts.get(meta.slug) ?? 0) + 1);
    } catch {
      /* повреждённая запись — пропускаем */
    }
  }
  const topProjects = [...projectCounts.entries()]
    .map(([slug, views]) => ({ slug, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Источники: utm важнее реферера, прямые заходы отдельно
  const sourceCounts = new Map<string, number>();
  for (const visitor of visitors) {
    let source = visitor.utmSource?.trim() || '';
    if (!source && visitor.referrer) {
      try {
        source = new URL(visitor.referrer).hostname.replace(/^www\./, '');
      } catch {
        source = visitor.referrer.slice(0, 60);
      }
    }
    if (!source) source = 'Прямые заходы';
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
  }
  const sources = [...sourceCounts.entries()]
    .map(([source, count]) => ({ source, visitors: count }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 10);

  // Устройства
  const deviceCounts = new Map<string, number>();
  for (const visitor of visitors) {
    const device = visitor.device ?? 'неизвестно';
    deviceCounts.set(device, (deviceCounts.get(device) ?? 0) + 1);
  }
  const devices = [...deviceCounts.entries()]
    .map(([device, count]) => ({ device, visitors: count }))
    .sort((a, b) => b.visitors - a.visitors);

  // Воронка: считаем уникальных посетителей на каждом шаге,
  // иначе один человек с десятью просмотрами исказит конверсию
  const stepVisitors = {
    catalogView: new Set<string>(),
    projectView: new Set<string>(),
    formSubmit: new Set<string>(),
  };
  const eventCounts: Record<string, number> = {};
  const scrollDepth: Record<string, number> = {};

  for (const event of events) {
    eventCounts[event.name] = (eventCounts[event.name] ?? 0) + 1;

    if (event.name === 'catalogView') stepVisitors.catalogView.add(event.visitorId);
    if (event.name === 'projectView') stepVisitors.projectView.add(event.visitorId);
    if (event.name === 'formSubmit') stepVisitors.formSubmit.add(event.visitorId);

    if (event.name === 'scrollDepth' && event.meta) {
      try {
        const meta = JSON.parse(event.meta) as { depth?: number };
        if (meta.depth) {
          const key = String(meta.depth);
          scrollDepth[key] = (scrollDepth[key] ?? 0) + 1;
        }
      } catch {
        /* пропускаем */
      }
    }
  }

  return {
    totalViews: pageViews.length,
    uniqueVisitors: new Set(pageViews.map((v) => v.visitorId)).size,
    byDay,
    topPages,
    topProjects,
    sources,
    devices,
    funnel: {
      catalogView: stepVisitors.catalogView.size,
      projectView: stepVisitors.projectView.size,
      formSubmit: stepVisitors.formSubmit.size,
    },
    events: eventCounts,
    scrollDepth,
  };
}

function buildEmptyDays(period: Period): DayPoint[] {
  const days: DayPoint[] = [];
  const cursor = new Date(period.from);
  while (cursor <= period.to) {
    days.push({ date: dayKey(cursor), views: 0, visitors: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
