import Link from 'next/link';
import { db, safeQuery } from '@/lib/db';
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_TYPES,
  LEAD_TYPE_LABELS,
  PACKAGE_SHORT_LABELS,
  isLeadStatus,
  type LeadStatus,
  type PackageKey,
} from '@/lib/enums';
import { cn, formatPrice } from '@/lib/utils';
import { deleteLead, setLeadStatus } from '../actions';
import { AdminHeader, SubmitButton } from '@/components/admin/Fields';

export const dynamic = 'force-dynamic';

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status && isLeadStatus(params.status) ? params.status : null;
  const typeFilter =
    params.type && (LEAD_TYPES as readonly string[]).includes(params.type) ? params.type : null;

  const [leads, counts] = await Promise.all([
    safeQuery(
      'adminLeads',
      () =>
        db.lead.findMany({
          where: {
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(typeFilter ? { type: typeFilter } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: 300,
          include: { files: true },
        }),
      [],
    ),
    safeQuery(
      'leadCounts',
      () => db.lead.groupBy({ by: ['status'], _count: { _all: true } }),
      [] as { status: string; _count: { _all: number } }[],
    ),
  ]);

  const countByStatus = new Map(counts.map((c) => [c.status, c._count._all]));

  const exportQuery = new URLSearchParams();
  if (statusFilter) exportQuery.set('status', statusFilter);
  if (typeFilter) exportQuery.set('type', typeFilter);

  return (
    <>
      <AdminHeader
        title="Заявки"
        description="Все формы сайта: калькулятор, карточка проекта, индивидуальный проект и обратный звонок."
        action={
          <Link
            href={`/api/admin/leads/export${exportQuery.toString() ? `?${exportQuery}` : ''}`}
            className="inline-flex h-11 items-center rounded border border-line px-5 font-sans text-badge uppercase transition-colors hover:border-ink"
          >
            Выгрузить CSV
          </Link>
        }
      />

      {/* Фильтры */}
      <div className="mb-6 flex flex-wrap gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-badge uppercase text-inkMuted">Статус:</span>
          <FilterLink href="/admin/leads" active={!statusFilter && !typeFilter}>
            Все
          </FilterLink>
          {LEAD_STATUSES.map((status) => (
            <FilterLink
              key={status}
              href={`/admin/leads?status=${status}`}
              active={statusFilter === status}
            >
              {LEAD_STATUS_LABELS[status]}
              <span className="ml-1.5 tabularNums opacity-60">
                {countByStatus.get(status) ?? 0}
              </span>
            </FilterLink>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-badge uppercase text-inkMuted">Источник:</span>
          {LEAD_TYPES.map((type) => (
            <FilterLink key={type} href={`/admin/leads?type=${type}`} active={typeFilter === type}>
              {LEAD_TYPE_LABELS[type]}
            </FilterLink>
          ))}
        </div>
      </div>

      {leads.length === 0 ? (
        <p className="rounded border border-line bg-paperDeep p-6 text-body text-inkMuted">
          Заявок пока нет.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className={cn(
                'rounded border bg-paper p-5',
                lead.status === 'NEW' ? 'border-ember/50' : 'border-line',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-[1.125rem] uppercase tracking-wide">
                      {lead.name}
                    </span>
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-body tabularNums text-ember underline underline-offset-4"
                    >
                      {lead.phone}
                    </a>
                  </div>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-sans text-badge uppercase text-inkMuted">
                    <span>{dateFormat.format(lead.createdAt)}</span>
                    <span>·</span>
                    <span>{LEAD_TYPE_LABELS[lead.type as keyof typeof LEAD_TYPE_LABELS] ?? lead.type}</span>
                    {lead.device && (
                      <>
                        <span>·</span>
                        <span>{lead.device}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Статус переключается тремя кнопками, без выпадающих списков */}
                <div className="flex flex-wrap gap-2">
                  {LEAD_STATUSES.map((status) => (
                    <form key={status} action={setLeadStatus}>
                      <input type="hidden" name="id" value={lead.id} />
                      <input type="hidden" name="status" value={status} />
                      <button
                        type="submit"
                        disabled={lead.status === status}
                        className={cn(
                          'h-9 rounded border px-3 font-sans text-badge uppercase transition-colors',
                          lead.status === status
                            ? 'border-forest bg-forest text-paper'
                            : 'border-line text-inkMuted hover:border-ink hover:text-ink',
                        )}
                      >
                        {LEAD_STATUS_LABELS[status as LeadStatus]}
                      </button>
                    </form>
                  ))}
                </div>
              </div>

              {/* Детали заявки: показываем только заполненные поля */}
              <dl className="mt-4 grid gap-x-8 gap-y-2 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-3">
                {lead.projectTitle && <Detail label="Проект" value={lead.projectTitle} />}
                {lead.areaM2 && <Detail label="Площадь" value={`${lead.areaM2} м²`} />}
                {lead.floors && <Detail label="Этажность" value={String(lead.floors)} />}
                {lead.hasLand !== null && (
                  <Detail label="Участок" value={lead.hasLand ? 'есть' : 'нет'} />
                )}
                {lead.packageKey && (
                  <Detail
                    label="Комплектация"
                    value={PACKAGE_SHORT_LABELS[lead.packageKey as PackageKey] ?? lead.packageKey}
                  />
                )}
                {lead.priceMin !== null && lead.priceMax !== null && (
                  <Detail
                    label="Расчёт"
                    value={`${formatPrice(lead.priceMin)} — ${formatPrice(lead.priceMax)}`}
                  />
                )}
                {lead.email && <Detail label="E-mail" value={lead.email} />}
                {lead.utmSource && (
                  <Detail
                    label="UTM"
                    value={[lead.utmSource, lead.utmMedium, lead.utmCampaign]
                      .filter(Boolean)
                      .join(' / ')}
                  />
                )}
                {lead.referrer && <Detail label="Откуда пришёл" value={lead.referrer} />}
                {lead.landingPath && <Detail label="Страница" value={lead.landingPath} />}
              </dl>

              {lead.comment && (
                <p className="mt-4 max-w-prose whitespace-pre-line border-l-2 border-line pl-4 text-body">
                  {lead.comment}
                </p>
              )}

              {lead.files.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 font-sans text-badge uppercase text-inkMuted">Вложения</p>
                  <ul className="flex flex-wrap gap-3">
                    {lead.files.map((file) => (
                      <li key={file.id}>
                        <a
                          href={file.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded border border-line px-3 py-2 text-badge normal-case transition-colors hover:border-ink"
                        >
                          {file.originalName} · {Math.round(file.sizeBytes / 1024)} КБ ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <form action={deleteLead} className="mt-4 border-t border-line pt-4">
                <input type="hidden" name="id" value={lead.id} />
                <SubmitButton variant="danger">Удалить заявку</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-sans text-badge uppercase text-inkMuted">{label}</dt>
      <dd className="break-words text-body text-ink">{value}</dd>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-9 items-center rounded border px-3 font-sans text-badge uppercase transition-colors',
        active ? 'border-ember text-ember' : 'border-line text-inkMuted hover:border-ink hover:text-ink',
      )}
    >
      {children}
    </Link>
  );
}
