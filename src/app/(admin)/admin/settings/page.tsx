import { db, safeQuery } from '@/lib/db';
import { saveSettings } from '../actions';
import { AdminCard, AdminHeader, SubmitButton } from '@/components/admin/Fields';

export const dynamic = 'force-dynamic';

const GROUP_TITLES: Record<string, string> = {
  contacts: 'Контакты и карта',
  legal: 'Реквизиты',
  hero: 'Первый экран',
  production: 'Блок «Производство»',
  founder: 'Об основателе',
  custom: 'Индивидуальный проект',
  blocks: 'Блоки сайта',
  integrations: 'Интеграции',
};

const GROUP_ORDER = [
  'contacts',
  'legal',
  'hero',
  'production',
  'founder',
  'custom',
  'blocks',
  'integrations',
];

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;

  const settings = await safeQuery(
    'adminSettings',
    () => db.setting.findMany({ orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { key: 'asc' }] }),
    [],
  );

  const grouped = new Map<string, typeof settings>();
  for (const setting of settings) {
    const list = grouped.get(setting.group) ?? [];
    list.push(setting);
    grouped.set(setting.group, list);
  }

  const groups = GROUP_ORDER.filter((g) => grouped.has(g)).concat(
    [...grouped.keys()].filter((g) => !GROUP_ORDER.includes(g)),
  );

  return (
    <>
      <AdminHeader
        title="Тексты и контакты"
        description="Всё, что здесь меняется, сразу появляется на сайте — пересобирать ничего не нужно."
      />

      {saved && (
        <p className="mb-6 rounded border border-line bg-paperDeep p-4 text-body">Сохранено.</p>
      )}

      <form action={saveSettings} className="flex flex-col gap-6">
        {groups.map((group) => (
          <AdminCard key={group} title={GROUP_TITLES[group] ?? group}>
            <div className="flex flex-col gap-5">
              {(grouped.get(group) ?? []).map((setting) => {
                const fieldName = `setting:${setting.key}`;

                if (setting.valueType === 'BOOL') {
                  return (
                    <div key={setting.key}>
                      {/* Снятый чекбокс не приходит в FormData — передаём ключ отдельно */}
                      <input type="hidden" name="boolKey" value={setting.key} />
                      <div className="flex items-start gap-3">
                        <input
                          id={setting.key}
                          name={fieldName}
                          type="checkbox"
                          defaultChecked={setting.value === 'true'}
                          className="mt-0.5 h-5 w-5 shrink-0 rounded border border-line accent-ember"
                        />
                        <label htmlFor={setting.key} className="text-body text-ink">
                          {setting.label ?? setting.key}
                        </label>
                      </div>
                      {setting.hint && (
                        <p className="ml-8 mt-1 text-badge normal-case text-inkMuted">
                          {setting.hint}
                        </p>
                      )}
                    </div>
                  );
                }

                const isLong = setting.valueType === 'LONGTEXT';

                return (
                  <div key={setting.key}>
                    <label
                      htmlFor={setting.key}
                      className="mb-1.5 block font-sans text-badge uppercase text-inkMuted"
                    >
                      {setting.label ?? setting.key}
                    </label>
                    {isLong ? (
                      <textarea
                        id={setting.key}
                        name={fieldName}
                        rows={setting.value.length > 400 ? 8 : 4}
                        defaultValue={setting.value}
                        className="w-full rounded border border-line bg-paper px-3 py-2.5 text-body leading-relaxed focus:border-ink"
                      />
                    ) : (
                      <input
                        id={setting.key}
                        name={fieldName}
                        type={setting.valueType === 'NUMBER' ? 'text' : 'text'}
                        inputMode={setting.valueType === 'NUMBER' ? 'decimal' : undefined}
                        defaultValue={setting.value}
                        className="w-full rounded border border-line bg-paper px-3 py-2.5 text-body focus:border-ink"
                      />
                    )}
                    {setting.hint && (
                      <p className="mt-1.5 max-w-prose text-badge normal-case text-inkMuted">
                        {setting.hint}
                      </p>
                    )}
                    <p className="mt-1 font-sans text-[0.6875rem] uppercase tracking-wider text-inkMuted/60">
                      {setting.key}
                    </p>
                  </div>
                );
              })}
            </div>
          </AdminCard>
        ))}

        <div className="sticky bottom-4 flex justify-start">
          <div className="rounded border border-line bg-paper p-3 shadow-none">
            <SubmitButton>Сохранить всё</SubmitButton>
          </div>
        </div>
      </form>
    </>
  );
}
