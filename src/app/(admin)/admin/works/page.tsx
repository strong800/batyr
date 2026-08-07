import Link from 'next/link';
import { db, safeQuery } from '@/lib/db';
import { AdminHeader } from '@/components/admin/Fields';

export const dynamic = 'force-dynamic';

export default async function AdminWorksPage() {
  const works = await safeQuery(
    'adminWorks',
    () =>
      db.work.findMany({
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          slug: true,
          title: true,
          location: true,
          year: true,
          facadeColor: true,
          visible: true,
          featured: true,
          sortOrder: true,
          project: { select: { title: true } },
          _count: { select: { media: true } },
        },
      }),
    [],
  );

  return (
    <>
      <AdminHeader
        title="Реализованные объекты"
        description="Построенные дома и бани. Привязка к проекту каталога подставляет в карточку ссылку на него."
        action={
          <Link
            href="/admin/works/new"
            className="inline-flex h-11 items-center rounded bg-forest px-5 font-sans text-badge uppercase text-paper transition-colors hover:bg-forestSoft"
          >
            Добавить объект
          </Link>
        }
      />

      <div className="overflow-x-auto rounded border border-line">
        <table className="w-full min-w-[46rem] border-collapse text-body">
          <thead>
            <tr className="border-b border-line bg-paperDeep text-left font-sans text-badge uppercase text-inkMuted">
              <th className="p-3 font-normal">Объект</th>
              <th className="p-3 font-normal">Проект</th>
              <th className="p-3 font-normal">Где</th>
              <th className="p-3 text-right font-normal">Фото</th>
              <th className="p-3 font-normal">Статус</th>
              <th className="p-3 text-right font-normal">Позиция</th>
            </tr>
          </thead>
          <tbody>
            {works.map((work) => (
              <tr key={work.id} className="border-b border-line last:border-0">
                <td className="p-3">
                  <Link
                    href={`/admin/works/${work.id}`}
                    className="font-display text-[1.0625rem] uppercase tracking-wide hover:text-ember"
                  >
                    {work.title}
                  </Link>
                  <p className="text-badge normal-case text-inkMuted">
                    {work.facadeColor ?? `/${work.slug}`}
                  </p>
                </td>
                <td className="p-3 text-inkMuted">{work.project?.title ?? '—'}</td>
                <td className="p-3 text-inkMuted">
                  {[work.location, work.year].filter(Boolean).join(', ') || '—'}
                </td>
                <td className="p-3 text-right tabularNums">{work._count.media}</td>
                <td className="p-3">
                  <span className="flex flex-wrap gap-2 text-badge uppercase">
                    {!work.visible && <span className="text-ember">Скрыт</span>}
                    {work.featured && <span className="text-ember">На главной</span>}
                    {work.visible && !work.featured && <span className="text-inkMuted">Виден</span>}
                  </span>
                </td>
                <td className="p-3 text-right tabularNums text-inkMuted">{work.sortOrder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {works.length === 0 && <p className="mt-6 text-body text-inkMuted">Объектов пока нет.</p>}
    </>
  );
}
