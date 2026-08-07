import Link from 'next/link';
import { db, safeQuery } from '@/lib/db';
import { AdminHeader } from '@/components/admin/Fields';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const [newLeads, totalLeads, projects, works, reviews, stubCount, viewsWeek] = await Promise.all([
    safeQuery('newLeads', () => db.lead.count({ where: { status: 'NEW' } }), 0),
    safeQuery('totalLeads', () => db.lead.count(), 0),
    safeQuery('projectCount', () => db.project.count({ where: { visible: true } }), 0),
    safeQuery('workCount', () => db.work.count({ where: { visible: true } }), 0),
    safeQuery('reviewCount', () => db.review.count({ where: { visible: true } }), 0),
    safeQuery('stubCount', () => db.calcParam.count({ where: { isStub: true } }), 0),
    safeQuery(
      'viewsWeek',
      () =>
        db.pageView.count({
          where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        }),
      0,
    ),
  ]);

  const tiles = [
    { label: 'Новых заявок', value: newLeads, href: '/admin/leads?status=NEW', accent: newLeads > 0 },
    { label: 'Заявок всего', value: totalLeads, href: '/admin/leads' },
    { label: 'Просмотров за 7 дней', value: viewsWeek, href: '/admin/analytics' },
    { label: 'Проектов в каталоге', value: projects, href: '/admin/projects' },
    { label: 'Объектов', value: works, href: '/admin/works' },
    { label: 'Отзывов', value: reviews, href: '/admin/reviews' },
  ];

  return (
    <>
      <AdminHeader title="Обзор" description="Что происходит на сайте прямо сейчас." />

      {stubCount > 0 && (
        <div className="mb-8 rounded border border-ember bg-paperDeep p-5">
          <p className="font-display text-[1.125rem] uppercase tracking-wide text-ember">
            Цены в калькуляторе — заглушки
          </p>
          <p className="mt-2 max-w-prose text-body text-ink">
            {stubCount} из параметров расчёта до сих пор содержат придуманные значения.
            Пока они не заменены, посетителям показывается предупреждение под расчётом.
          </p>
          <Link
            href="/admin/calc"
            className="mt-4 inline-block font-sans text-badge uppercase text-ember underline underline-offset-4"
          >
            Заполнить цены
          </Link>
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Link
              href={tile.href}
              className="block rounded border border-line p-5 transition-colors hover:border-ink"
            >
              <p className="font-sans text-badge uppercase text-inkMuted">{tile.label}</p>
              <p
                className={`mt-3 font-display text-[2.5rem] leading-none tabularNums ${
                  tile.accent ? 'text-ember' : 'text-ink'
                }`}
              >
                {tile.value}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
