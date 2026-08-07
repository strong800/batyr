import { db, safeQuery } from '@/lib/db';
import { savePackage } from '../actions';
import {
  AdminCard,
  AdminCheckbox,
  AdminField,
  AdminHeader,
  AdminTextArea,
  SubmitButton,
} from '@/components/admin/Fields';
import { RepeatableRows } from '@/components/admin/RepeatableRows';

export const dynamic = 'force-dynamic';

export default async function AdminPackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;

  const packages = await safeQuery(
    'adminPackages',
    () =>
      db.package.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      }),
    [],
  );

  return (
    <>
      <AdminHeader
        title="Комплектации"
        description="Пояснение к каждому пункту — то, что клиент читает вместо технического списка. Пишите просто: зачем эта штука нужна."
      />

      {saved && (
        <p className="mb-6 rounded border border-line bg-paperDeep p-4 text-body">Сохранено.</p>
      )}

      <div className="flex flex-col gap-8">
        {packages.map((pack) => (
          <form key={pack.id} action={savePackage}>
            <input type="hidden" name="id" value={pack.id} />

            <AdminCard title={pack.title}>
              <div className="grid gap-5 sm:grid-cols-2">
                <AdminField label="Название" name="title" defaultValue={pack.title} required />
                <AdminField label="Подзаголовок" name="subtitle" defaultValue={pack.subtitle} />
                <AdminTextArea
                  label="Короткое описание уровня"
                  name="summary"
                  defaultValue={pack.summary}
                  rows={3}
                  className="sm:col-span-2"
                />
                <AdminField
                  label="Позиция"
                  name="sortOrder"
                  type="number"
                  defaultValue={pack.sortOrder}
                />
                <div className="flex items-end">
                  <AdminCheckbox
                    label="Показывать на сайте"
                    name="visible"
                    defaultChecked={pack.visible}
                  />
                </div>
              </div>

              <h3 className="mb-4 mt-8 font-sans text-nums uppercase text-inkMuted">Состав</h3>
              <RepeatableRows
                addLabel="Добавить пункт"
                fields={[
                  { name: 'itemTitle', label: 'Что входит', span: 5 },
                  {
                    name: 'itemNote',
                    label: 'Пояснение простым языком',
                    span: 7,
                    multiline: true,
                    placeholder: 'Зачем это нужно и что даёт',
                  },
                ]}
                initialRows={pack.items.map((item) => ({
                  itemTitle: item.title,
                  itemNote: item.note ?? '',
                }))}
              />

              <div className="mt-6">
                <SubmitButton>Сохранить «{pack.title}»</SubmitButton>
              </div>
            </AdminCard>
          </form>
        ))}
      </div>
    </>
  );
}
