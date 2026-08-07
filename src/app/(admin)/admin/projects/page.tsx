import Link from 'next/link';
import { db, safeQuery } from '@/lib/db';
import { CATEGORY_LABELS, type ProjectCategory } from '@/lib/enums';
import { formatNumber } from '@/lib/utils';
import { AdminHeader } from '@/components/admin/Fields';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  const projects = await safeQuery(
    'adminProjects',
    () =>
      db.project.findMany({
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
          areaM2: true,
          floors: true,
          featured: true,
          visible: true,
          sortOrder: true,
          _count: { select: { media: true } },
        },
      }),
    [],
  );

  return (
    <>
      <AdminHeader
        title="Проекты каталога"
        description="Порядок в каталоге задаётся полем «Позиция»: чем меньше число, тем выше проект."
        action={
          <Link
            href="/admin/projects/new"
            className="inline-flex h-11 items-center rounded bg-forest px-5 font-sans text-badge uppercase text-paper transition-colors hover:bg-forestSoft"
          >
            Добавить проект
          </Link>
        }
      />

      <div className="overflow-x-auto rounded border border-line">
        <table className="w-full min-w-[46rem] border-collapse text-body">
          <thead>
            <tr className="border-b border-line bg-paperDeep text-left font-sans text-badge uppercase text-inkMuted">
              <th className="p-3 font-normal">Название</th>
              <th className="p-3 font-normal">Тип</th>
              <th className="p-3 text-right font-normal">Площадь</th>
              <th className="p-3 text-right font-normal">Этажи</th>
              <th className="p-3 text-right font-normal">Фото</th>
              <th className="p-3 font-normal">Статус</th>
              <th className="p-3 text-right font-normal">Позиция</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-line last:border-0">
                <td className="p-3">
                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="font-display text-[1.0625rem] uppercase tracking-wide hover:text-ember"
                  >
                    {project.title}
                  </Link>
                  <p className="text-badge normal-case text-inkMuted">/{project.slug}</p>
                </td>
                <td className="p-3 text-inkMuted">
                  {CATEGORY_LABELS[project.category as ProjectCategory] ?? project.category}
                </td>
                <td className="p-3 text-right tabularNums">
                  {project.areaM2 ? `${formatNumber(project.areaM2)} м²` : '—'}
                </td>
                <td className="p-3 text-right tabularNums">{project.floors ?? '—'}</td>
                <td className="p-3 text-right tabularNums">{project._count.media}</td>
                <td className="p-3">
                  <span className="flex flex-wrap gap-2 text-badge uppercase">
                    {!project.visible && <span className="text-ember">Скрыт</span>}
                    {project.featured && <span className="text-ember">На главной</span>}
                    {project.visible && !project.featured && (
                      <span className="text-inkMuted">Виден</span>
                    )}
                  </span>
                </td>
                <td className="p-3 text-right tabularNums text-inkMuted">{project.sortOrder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {projects.length === 0 && (
        <p className="mt-6 text-body text-inkMuted">Проектов пока нет.</p>
      )}
    </>
  );
}
