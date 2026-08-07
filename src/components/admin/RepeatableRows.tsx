'use client';

import { useState } from 'react';

export type RowField = {
  name: string;
  label: string;
  type?: 'text' | 'number';
  /** Ширина колонки во фракциях grid */
  span?: number;
  multiline?: boolean;
  placeholder?: string;
};

/**
 * Список повторяющихся полей: помещения проекта, состав комплектации, этапы.
 *
 * Все строки уходят на сервер параллельными массивами с одинаковыми
 * именами полей — порядок в форме и есть порядок вывода на сайте.
 */
export function RepeatableRows({
  fields,
  initialRows,
  addLabel,
  emptyRow,
}: {
  fields: RowField[];
  initialRows: Record<string, string>[];
  addLabel: string;
  emptyRow?: Record<string, string>;
}) {
  const blank = emptyRow ?? Object.fromEntries(fields.map((f) => [f.name, '']));
  const [rows, setRows] = useState<Record<string, string>[]>(
    initialRows.length ? initialRows : [blank],
  );

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row, index) => (
        <div
          key={index}
          className="rounded border border-line p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="font-sans text-nums uppercase tabularNums text-inkMuted">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Выше"
                className="text-badge uppercase text-inkMuted disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === rows.length - 1}
                aria-label="Ниже"
                className="text-badge uppercase text-inkMuted disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => setRows(rows.filter((_, i) => i !== index))}
                className="text-badge uppercase text-ember underline"
              >
                Удалить
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-12">
            {fields.map((field) => (
              <label
                key={field.name}
                className="block"
                style={{ gridColumn: `span ${field.span ?? 12} / span ${field.span ?? 12}` }}
              >
                <span className="mb-1.5 block font-sans text-badge uppercase text-inkMuted">
                  {field.label}
                </span>
                {field.multiline ? (
                  <textarea
                    name={field.name}
                    rows={2}
                    defaultValue={row[field.name] ?? ''}
                    placeholder={field.placeholder}
                    className="w-full rounded border border-line bg-paper px-3 py-2 text-body leading-relaxed focus:border-ink"
                  />
                ) : (
                  <input
                    name={field.name}
                    type={field.type ?? 'text'}
                    step={field.type === 'number' ? '0.01' : undefined}
                    defaultValue={row[field.name] ?? ''}
                    placeholder={field.placeholder}
                    className="w-full rounded border border-line bg-paper px-3 py-2 text-body focus:border-ink"
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setRows([...rows, blank])}
        className="self-start rounded border border-line px-4 py-2.5 font-sans text-badge uppercase transition-colors hover:border-ink"
      >
        {addLabel}
      </button>
    </div>
  );
}
