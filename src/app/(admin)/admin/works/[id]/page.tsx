import Link from 'next/link';
import { notFound } from 'next/navigation';

import { db, safeQuery } from '@/lib/db';
import { PACKAGE_KEYS, PACKAGE_LABELS } from '@/lib/enums';
import { deleteWork, saveWork } from '../../actions';
import {
  AdminCard,
  AdminCheckbox,
  AdminField,
  AdminHeader,
  AdminSelect,
  AdminTextArea,
  SubmitButton,
} from '@/components/admin/Fields';
import { MediaManager } from '@/components/admin/MediaManager';

export const dynamic = 'force-dynamic';

export default async function AdminWorkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const isNew = id === 'new';

  const [work, projects] = await Promise.all([
    isNew
      ? null
      : safeQuery(
          `adminWork:${id}`,
          () =>
            db.work.findUnique({
              where: { id },
              include: { media: { orderBy: { sortOrder: 'asc' } } },
            }),
          null,
        ),
    safeQuery(
      'projectOptions',
      () => db.project.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, title: true } }),
      [],
    ),
  ]);

  if (!isNew && !work) notFound();

  return (
    <>
      <AdminHeader
        title={isNew ? 'Новый объект' : (work?.title ?? '')}
        action={
          !isNew && work ? (
            <Link
              href={`/works/${work.slug}`}
              target="_blank"
              className="inline-flex h-11 items-center rounded border border-line px-5 font-sans text-badge uppercase transition-colors hover:border-ink"
            >
              Смотреть на сайте ↗
            </Link>
          ) : null
        }
      />

      {saved && (
        <p className="mb-6 rounded border border-line bg-paperDeep p-4 text-body">Сохранено.</p>
      )}

      <form action={saveWork} className="flex flex-col gap-6">
        {!isNew && <input type="hidden" name="id" value={work!.id} />}

        <AdminCard title="Основное">
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField label="Название" name="title" defaultValue={work?.title} required />
            <AdminField
              label="Слаг"
              name="slug"
              defaultValue={work?.slug}
              hint="Пусто — соберём из названия"
            />
            <AdminSelect
              label="Проект каталога"
              name="projectId"
              defaultValue={work?.projectId ?? ''}
              options={[
                { value: '', label: 'Не привязан' },
                ...projects.map((p) => ({ value: p.id, label: p.title })),
              ]}
              hint="На странице объекта появится ссылка на проект"
            />
            <AdminSelect
              label="Комплектация"
              name="packageKey"
              defaultValue={work?.packageKey ?? ''}
              options={[
                { value: '', label: 'Не указана' },
                ...PACKAGE_KEYS.map((k) => ({ value: k, label: PACKAGE_LABELS[k] })),
              ]}
            />
            <AdminField label="Населённый пункт" name="location" defaultValue={work?.location} />
            <AdminField label="Год постройки" name="year" type="number" defaultValue={work?.year} />
            <AdminField
              label="Цвет фасада"
              name="facadeColor"
              defaultValue={work?.facadeColor}
              placeholder="Тёмный графит"
            />
            <AdminField
              label="Срок работ"
              name="durationText"
              defaultValue={work?.durationText}
              placeholder="Под крышу за 3 недели"
            />
            <AdminTextArea
              label="Описание"
              name="description"
              defaultValue={work?.description}
              rows={5}
              className="sm:col-span-2"
            />
          </div>
        </AdminCard>

        <AdminCard title="Публикация">
          <AdminField
            label="Позиция"
            name="sortOrder"
            type="number"
            defaultValue={work?.sortOrder ?? 0}
            className="max-w-[12rem]"
          />
          <div className="mt-6 flex flex-wrap gap-6">
            <AdminCheckbox label="Виден на сайте" name="visible" defaultChecked={work?.visible ?? true} />
            <AdminCheckbox
              label="Показывать на главной"
              name="featured"
              defaultChecked={work?.featured ?? false}
            />
          </div>
        </AdminCard>

        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>{isNew ? 'Создать объект' : 'Сохранить'}</SubmitButton>
          <Link href="/admin/works" className="font-sans text-badge uppercase text-inkMuted underline">
            К списку
          </Link>
        </div>
      </form>

      {!isNew && work && (
        <>
          <AdminCard title="Фотографии и видео" className="mt-6">
            <MediaManager
              workId={work.id}
              media={work.media.map((m) => ({
                id: m.id,
                src: m.src,
                alt: m.alt,
                caption: m.caption,
                kind: m.kind,
                isCover: m.isCover,
                width: m.width,
                height: m.height,
              }))}
            />
          </AdminCard>

          <AdminCard title="Опасная зона" className="mt-6 border-ember/40">
            <form action={deleteWork}>
              <input type="hidden" name="id" value={work.id} />
              <SubmitButton variant="danger">Удалить объект</SubmitButton>
            </form>
          </AdminCard>
        </>
      )}
    </>
  );
}
