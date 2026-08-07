import { db, safeQuery } from '@/lib/db';
import { saveStages } from '../actions';
import { AdminCard, AdminHeader, SubmitButton } from '@/components/admin/Fields';
import { RepeatableRows } from '@/components/admin/RepeatableRows';

export const dynamic = 'force-dynamic';

export default async function AdminStagesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;

  const stages = await safeQuery(
    'adminStages',
    () => db.stage.findMany({ orderBy: { sortOrder: 'asc' } }),
    [],
  );

  const hasDrafts = stages.some((s) => s.durationText === 'уточняется');

  return (
    <>
      <AdminHeader
        title="Этапы работы"
        description="Выводятся горизонтальным таймлайном на главной. Порядок задаётся стрелками."
      />

      {saved && (
        <p className="mb-6 rounded border border-line bg-paperDeep p-4 text-body">Сохранено.</p>
      )}

      {hasDrafts && (
        <p className="mb-6 rounded border border-ember bg-paperDeep p-4 text-body">
          У части этапов вместо срока стоит «уточняется» — это черновик, написанный при
          разработке. Замените реальными сроками.
        </p>
      )}

      <form action={saveStages}>
        <AdminCard>
          <RepeatableRows
            addLabel="Добавить этап"
            fields={[
              { name: 'stageTitle', label: 'Название этапа', span: 4 },
              { name: 'stageText', label: 'Что происходит', span: 5, multiline: true },
              { name: 'stageDuration', label: 'Срок', span: 3 },
            ]}
            initialRows={stages.map((stage) => ({
              stageTitle: stage.title,
              stageText: stage.text ?? '',
              stageDuration: stage.durationText ?? '',
            }))}
          />

          <div className="mt-6">
            <SubmitButton>Сохранить этапы</SubmitButton>
          </div>
        </AdminCard>
      </form>
    </>
  );
}
