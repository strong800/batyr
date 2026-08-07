import Link from 'next/link';
import { db, safeQuery } from '@/lib/db';
import { getAnalytics, resolvePeriod } from '@/lib/analyticsQueries';
import { cn } from '@/lib/utils';
import { AdminCard, AdminHeader } from '@/components/admin/Fields';
import { TrafficChart } from '@/components/admin/TrafficChart';

export const dynamic = 'force-dynamic';

const EVENT_LABELS: Record<string, string> = {
  phoneClick: 'Клики по телефону',
  telegramClick: 'Клики по Telegram',
  instagramClick: 'Клики по Instagram',
  calcStart: 'Запуски калькулятора',
  calcResult: 'Доведено до результата',
  formSubmit: 'Отправки форм',
  lightboxOpen: 'Открытия фото',
  videoPlay: 'Запуски видео',
  catalogView: 'Просмотры каталога',
  projectView: 'Открытия проектов',
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const period = resolvePeriod(params);

  const [data, projects] = await Promise.all([
    getAnalytics(period),
    safeQuery(
      'projectTitles',
      () => db.project.findMany({ select: { slug: true, title: true } }),
      [],
    ),
  ]);

  const titleBySlug = new Map(projects.map((p) => [p.slug, p.title]));

  const conversion =
    data.funnel.catalogView > 0
      ? ((data.funnel.formSubmit / data.funnel.catalogView) * 100).toFixed(1)
      : '0';

  const calcConversion =
    (data.events.calcStart ?? 0) > 0
      ? (((data.events.calcResult ?? 0) / data.events.calcStart) * 100).toFixed(0)
      : '0';

  const tiles = [
    { label: 'Просмотров страниц', value: data.totalViews },
    { label: 'Уникальных посетителей', value: data.uniqueVisitors },
    { label: 'Отправок форм', value: data.events.formSubmit ?? 0 },
    { label: 'Конверсия каталог → заявка', value: `${conversion}%` },
  ];

  return (
    <>
      <AdminHeader
        title="Аналитика"
        description="Считается своими силами из локальной базы. Никакие данные никуда не уходят."
      />

      {/* Период */}
      <div className="mb-6 flex flex-wrap items-end gap-6">
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90].map((days) => (
            <Link
              key={days}
              href={`/admin/analytics?period=${days}`}
              className={cn(
                'inline-flex h-9 items-center rounded border px-3 font-sans text-badge uppercase transition-colors',
                period.days === days && !params.from
                  ? 'border-ember text-ember'
                  : 'border-line text-inkMuted hover:border-ink hover:text-ink',
              )}
            >
              {days} дней
            </Link>
          ))}
        </div>

        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1.5 block font-sans text-badge uppercase text-inkMuted">С</span>
            <input
              type="date"
              name="from"
              defaultValue={params.from}
              className="h-9 rounded border border-line bg-paper px-3 text-body"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-sans text-badge uppercase text-inkMuted">По</span>
            <input
              type="date"
              name="to"
              defaultValue={params.to}
              className="h-9 rounded border border-line bg-paper px-3 text-body"
            />
          </label>
          <button
            type="submit"
            className="h-9 rounded border border-line px-4 font-sans text-badge uppercase transition-colors hover:border-ink"
          >
            Показать
          </button>
        </form>
      </div>

      <ul className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label} className="rounded border border-line p-5">
            <p className="font-sans text-badge uppercase text-inkMuted">{tile.label}</p>
            <p className="mt-3 font-display text-[2.25rem] leading-none tabularNums">{tile.value}</p>
          </li>
        ))}
      </ul>

      <AdminCard title="Посещаемость по дням" className="mb-6">
        <TrafficChart data={data.byDay} />
      </AdminCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Воронка">
          <ol className="flex flex-col gap-3">
            {[
              { label: 'Просмотр каталога', value: data.funnel.catalogView },
              { label: 'Открытие проекта', value: data.funnel.projectView },
              { label: 'Отправка заявки', value: data.funnel.formSubmit },
            ].map((step, index, all) => {
              const base = all[0].value || 1;
              const share = Math.round((step.value / base) * 100);
              return (
                <li key={step.label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-body">{step.label}</span>
                    <span className="tabularNums text-body">
                      {step.value}
                      {index > 0 && (
                        <span className="ml-2 text-badge text-inkMuted">{share}%</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full bg-paperDeep">
                    <div
                      className="h-full bg-timber"
                      style={{ width: `${Math.min(100, share)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-badge normal-case text-inkMuted">
            Считается по уникальным посетителям, а не по событиям: иначе один человек
            с десятью просмотрами исказил бы конверсию.
          </p>
        </AdminCard>

        <AdminCard title="Калькулятор">
          <dl className="flex flex-col gap-3">
            <Row label="Запусков" value={data.events.calcStart ?? 0} />
            <Row label="Доведено до результата" value={data.events.calcResult ?? 0} />
            <Row label="Доходимость" value={`${calcConversion}%`} />
          </dl>
        </AdminCard>

        <AdminCard title="Самые просматриваемые проекты">
          {data.topProjects.length === 0 ? (
            <p className="text-body text-inkMuted">Пока никто не открывал карточки проектов.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {data.topProjects.map((project) => (
                <li key={project.slug} className="flex items-baseline justify-between gap-4">
                  <span className="text-body">
                    {titleBySlug.get(project.slug) ?? project.slug}
                  </span>
                  <span className="tabularNums text-body text-inkMuted">{project.views}</span>
                </li>
              ))}
            </ol>
          )}
        </AdminCard>

        <AdminCard title="Источники">
          {data.sources.length === 0 ? (
            <p className="text-body text-inkMuted">Новых посетителей за период не было.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {data.sources.map((source) => (
                <li key={source.source} className="flex items-baseline justify-between gap-4">
                  <span className="break-all text-body">{source.source}</span>
                  <span className="tabularNums text-body text-inkMuted">{source.visitors}</span>
                </li>
              ))}
            </ol>
          )}
        </AdminCard>

        <AdminCard title="Действия на сайте">
          <dl className="flex flex-col gap-3">
            {Object.entries(EVENT_LABELS).map(([key, label]) => (
              <Row key={key} label={label} value={data.events[key] ?? 0} />
            ))}
          </dl>
        </AdminCard>

        <AdminCard title="Устройства и глубина скролла">
          <dl className="flex flex-col gap-3">
            {data.devices.map((device) => (
              <Row key={device.device} label={device.device} value={device.visitors} />
            ))}
          </dl>

          <h3 className="mb-3 mt-6 font-sans text-nums uppercase text-inkMuted">
            Дочитали до
          </h3>
          <dl className="flex flex-col gap-3">
            {['25', '50', '75', '100'].map((depth) => (
              <Row key={depth} label={`${depth}%`} value={data.scrollDepth[depth] ?? 0} />
            ))}
          </dl>
        </AdminCard>

        <AdminCard title="Популярные страницы" className="lg:col-span-2">
          {data.topPages.length === 0 ? (
            <p className="text-body text-inkMuted">Просмотров за период не было.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {data.topPages.map((page) => (
                <li key={page.path} className="flex items-baseline justify-between gap-4">
                  <span className="break-all text-body">{page.path}</span>
                  <span className="tabularNums text-body text-inkMuted">{page.views}</span>
                </li>
              ))}
            </ol>
          )}
        </AdminCard>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-body">{label}</dt>
      <dd className="tabularNums text-body text-inkMuted">{value}</dd>
    </div>
  );
}
