import Link from 'next/link';
import { notFound } from 'next/navigation';

import { db, safeQuery } from '@/lib/db';
import { PACKAGE_KEYS, PACKAGE_LABELS, PROJECT_CATEGORIES, CATEGORY_LABELS } from '@/lib/enums';
import { deleteProject, saveProject } from '../../actions';
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
import { RepeatableRows } from '@/components/admin/RepeatableRows';

export const dynamic = 'force-dynamic';

export default async function AdminProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const isNew = id === 'new';

  const project = isNew
    ? null
    : await safeQuery(
        `adminProject:${id}`,
        () =>
          db.project.findUnique({
            where: { id },
            include: {
              rooms: { orderBy: { sortOrder: 'asc' } },
              media: { orderBy: { sortOrder: 'asc' } },
            },
          }),
        null,
      );

  if (!isNew && !project) notFound();

  return (
    <>
      <AdminHeader
        title={isNew ? 'Новый проект' : (project?.title ?? '')}
        description={
          isNew
            ? 'Заполните хотя бы название — остальное можно дописать позже.'
            : 'Поля, которые вы оставите пустыми, на сайте просто не выводятся. Прочерков не будет.'
        }
        action={
          !isNew && project ? (
            <Link
              href={`/catalog/${project.slug}`}
              target="_blank"
              className="inline-flex h-11 items-center rounded border border-line px-5 font-sans text-badge uppercase transition-colors hover:border-ink"
            >
              Смотреть на сайте ↗
            </Link>
          ) : null
        }
      />

      {saved && (
        <p className="mb-6 rounded border border-line bg-paperDeep p-4 text-body text-ink">
          Сохранено.
        </p>
      )}

      <form action={saveProject} className="flex flex-col gap-6">
        {!isNew && <input type="hidden" name="id" value={project!.id} />}

        <AdminCard title="Основное">
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField label="Название" name="title" defaultValue={project?.title} required />
            <AdminField
              label="Слаг (адрес страницы)"
              name="slug"
              defaultValue={project?.slug}
              hint="Оставьте пустым — соберём из названия"
            />
            <AdminSelect
              label="Тип"
              name="category"
              defaultValue={project?.category ?? 'HOUSE'}
              options={PROJECT_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
            />
            <AdminSelect
              label="Базовая комплектация"
              name="basePackage"
              defaultValue={project?.basePackage ?? ''}
              options={[
                { value: '', label: 'Не указана' },
                ...PACKAGE_KEYS.map((k) => ({ value: k, label: PACKAGE_LABELS[k] })),
              ]}
            />
            <AdminField
              label="Короткая строка над описанием"
              name="tagline"
              defaultValue={project?.tagline}
              className="sm:col-span-2"
              placeholder="Дом, где у каждого есть своё пространство"
            />
            <AdminTextArea
              label="Описание"
              name="description"
              defaultValue={project?.description}
              rows={5}
              className="sm:col-span-2"
            />
          </div>
        </AdminCard>

        <AdminCard title="Характеристики">
          <div className="grid gap-5 sm:grid-cols-3">
            <AdminField label="Площадь, м²" name="areaM2" type="number" step="0.1" defaultValue={project?.areaM2} />
            <AdminField label="Этажность" name="floors" type="number" defaultValue={project?.floors} />
            <AdminField label="Высота потолков, мм" name="ceilingMm" type="number" defaultValue={project?.ceilingMm} />
            <AdminField label="Ширина, мм" name="widthMm" type="number" defaultValue={project?.widthMm} />
            <AdminField label="Длина, мм" name="lengthMm" type="number" defaultValue={project?.lengthMm} />
            <AdminField
              label="Площадь террасы, м²"
              name="terraceAreaM2"
              type="number"
              step="0.1"
              defaultValue={project?.terraceAreaM2}
            />
            <AdminField
              label="Фундамент"
              name="foundation"
              defaultValue={project?.foundation}
              className="sm:col-span-3"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-6">
            <AdminCheckbox label="Есть терраса" name="hasTerrace" defaultChecked={project?.hasTerrace} />
            <AdminCheckbox label="Есть мансарда" name="hasMansard" defaultChecked={project?.hasMansard} />
            <AdminCheckbox label="Есть балкон" name="hasBalcony" defaultChecked={project?.hasBalcony} />
          </div>
        </AdminCard>

        <AdminCard title="Помещения">
          <p className="mb-4 text-badge normal-case text-inkMuted">
            Выводятся списком в характеристиках. Строки без названия не сохраняются.
          </p>
          <RepeatableRows
            addLabel="Добавить помещение"
            fields={[
              { name: 'roomTitle', label: 'Название', span: 8 },
              { name: 'roomArea', label: 'Площадь, м²', type: 'number', span: 4 },
            ]}
            initialRows={(project?.rooms ?? []).map((room) => ({
              roomTitle: room.title,
              roomArea: room.areaM2 !== null ? String(room.areaM2) : '',
            }))}
          />
        </AdminCard>

        <AdminCard title="Публикация">
          <div className="grid gap-5 sm:grid-cols-3">
            <AdminField
              label="Позиция"
              name="sortOrder"
              type="number"
              defaultValue={project?.sortOrder ?? 0}
              hint="Меньше — выше в каталоге"
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-6">
            <AdminCheckbox
              label="Виден на сайте"
              name="visible"
              defaultChecked={project?.visible ?? true}
            />
            <AdminCheckbox
              label="Показывать на главной"
              name="featured"
              defaultChecked={project?.featured ?? false}
            />
          </div>
        </AdminCard>

        <AdminCard title="Поисковая выдача">
          <div className="grid gap-5">
            <AdminField
              label="Title"
              name="seoTitle"
              defaultValue={project?.seoTitle}
              hint="Пусто — соберём из названия и площади"
            />
            <AdminTextArea
              label="Description"
              name="seoDescription"
              defaultValue={project?.seoDescription}
              rows={2}
              hint="Пусто — возьмём описание проекта"
            />
          </div>
        </AdminCard>

        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>{isNew ? 'Создать проект' : 'Сохранить'}</SubmitButton>
          <Link href="/admin/projects" className="font-sans text-badge uppercase text-inkMuted underline">
            К списку
          </Link>
        </div>
      </form>

      {!isNew && project && (
        <>
          <AdminCard title="Фотографии и планировки" className="mt-6">
            <MediaManager
              projectId={project.id}
              media={project.media.map((m) => ({
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
            <p className="mb-4 max-w-prose text-body text-inkMuted">
              Удаление проекта уберёт его страницу и все привязанные фотографии из базы.
              Исходные файлы в папке uploads останутся.
            </p>
            <form action={deleteProject}>
              <input type="hidden" name="id" value={project.id} />
              <SubmitButton variant="danger">Удалить проект</SubmitButton>
            </form>
          </AdminCard>
        </>
      )}
    </>
  );
}
