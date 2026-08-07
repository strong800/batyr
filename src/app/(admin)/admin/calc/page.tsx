import { db, safeQuery } from '@/lib/db';
import { saveCalcParams } from '../actions';
import { AdminCard, AdminHeader, SubmitButton } from '@/components/admin/Fields';

export const dynamic = 'force-dynamic';

const GROUP_TITLES: Record<string, string> = {
  base: 'Базовые цены за квадратный метр',
  coef: 'Коэффициенты',
  options: 'Дополнительные опции',
  result: 'Итог',
};

export default async function AdminCalcPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;

  const params = await safeQuery(
    'adminCalc',
    () => db.calcParam.findMany({ orderBy: { sortOrder: 'asc' } }),
    [],
  );

  const stubs = params.filter((p) => p.isStub).length;

  const grouped = new Map<string, typeof params>();
  for (const param of params) {
    const list = grouped.get(param.group) ?? [];
    list.push(param);
    grouped.set(param.group, list);
  }

  return (
    <>
      <AdminHeader
        title="Калькулятор"
        description="В коде не зашито ни одной цены — расчёт целиком построен на этих значениях."
      />

      {saved && (
        <p className="mb-6 rounded border border-line bg-paperDeep p-4 text-body">Сохранено.</p>
      )}

      {stubs > 0 && (
        <div className="mb-6 rounded border border-ember bg-paperDeep p-5">
          <p className="font-display text-[1.125rem] uppercase tracking-wide text-ember">
            {stubs} значений — заглушки
          </p>
          <p className="mt-2 max-w-prose text-body text-ink">
            Эти цифры придуманы при разработке, потому что реальных цен в материалах не было.
            Пока хоть одна заглушка осталась, под расчётом на сайте висит предупреждение.
            Как только вы исправите значение вручную, пометка с него снимается.
          </p>
        </div>
      )}

      <form action={saveCalcParams} className="flex flex-col gap-6">
        {[...grouped.entries()].map(([group, items]) => (
          <AdminCard key={group} title={GROUP_TITLES[group] ?? group}>
            <div className="flex flex-col gap-5">
              {items.map((param) => (
                <div key={param.key} className="grid gap-3 sm:grid-cols-12 sm:items-start">
                  <div className="sm:col-span-7">
                    <label
                      htmlFor={param.key}
                      className="block text-body text-ink"
                    >
                      {param.label}
                      {param.isStub && (
                        <span className="ml-2 rounded border border-ember px-1.5 py-0.5 font-sans text-[0.6875rem] uppercase text-ember">
                          заглушка
                        </span>
                      )}
                    </label>
                    {param.hint && (
                      <p className="mt-1 max-w-prose text-badge normal-case text-inkMuted">
                        {param.hint}
                      </p>
                    )}
                    <p className="mt-1 font-sans text-[0.6875rem] uppercase tracking-wider text-inkMuted/60">
                      {param.key}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:col-span-5">
                    <input
                      id={param.key}
                      name={`calc:${param.key}`}
                      type="text"
                      inputMode="decimal"
                      defaultValue={String(param.value)}
                      className="w-full rounded border border-line bg-paper px-3 py-2.5 text-body tabularNums focus:border-ink"
                    />
                    {param.unit && (
                      <span className="shrink-0 font-sans text-badge uppercase text-inkMuted">
                        {param.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        ))}

        <div className="sticky bottom-4 flex justify-start">
          <div className="rounded border border-line bg-paper p-3">
            <SubmitButton>Сохранить цены</SubmitButton>
          </div>
        </div>
      </form>
    </>
  );
}
