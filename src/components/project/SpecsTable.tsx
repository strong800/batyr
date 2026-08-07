import { ui } from '@/config/site';
import { formatFloors, formatNumber, formatSize, mmToM } from '@/lib/utils';
import { PACKAGE_LABELS, type PackageKey } from '@/lib/enums';

export type SpecsProject = {
  areaM2: number | null;
  floors: number | null;
  widthMm: number | null;
  lengthMm: number | null;
  ceilingMm: number | null;
  hasTerrace: boolean;
  terraceAreaM2: number | null;
  hasMansard: boolean;
  hasBalcony: boolean;
  foundation: string | null;
  basePackage: string | null;
  rooms: { id: string; title: string; areaM2: number | null }[];
};

/**
 * Характеристики таблицей.
 *
 * Строка, для которой нет данных, не выводится вовсе — вместо прочерков
 * и пустых ячеек. Так карточка неполного проекта выглядит цельной,
 * а не наполовину заполненной анкетой.
 */
export function SpecsTable({ project }: { project: SpecsProject }) {
  const rows: { label: string; value: string }[] = [];

  if (project.areaM2) {
    rows.push({ label: ui.labels.area, value: `${formatNumber(project.areaM2)} ${ui.units.m2}` });
  }
  const floors = formatFloors(project.floors);
  if (floors) rows.push({ label: ui.labels.floors, value: floors });

  const size = formatSize(project.widthMm, project.lengthMm);
  if (size) rows.push({ label: ui.labels.size, value: size });

  if (project.ceilingMm) {
    rows.push({ label: ui.labels.ceiling, value: `${mmToM(project.ceilingMm)} ${ui.units.m}` });
  }
  if (project.hasTerrace) {
    rows.push({
      label: ui.labels.terrace,
      value: project.terraceAreaM2
        ? `${formatNumber(project.terraceAreaM2)} ${ui.units.m2}`
        : 'есть',
    });
  }
  if (project.hasMansard) rows.push({ label: ui.labels.mansard, value: 'есть' });
  if (project.hasBalcony) rows.push({ label: ui.labels.balcony, value: 'есть' });
  if (project.foundation) rows.push({ label: ui.labels.foundation, value: project.foundation });
  if (project.basePackage && PACKAGE_LABELS[project.basePackage as PackageKey]) {
    rows.push({
      label: 'Базовая комплектация',
      value: PACKAGE_LABELS[project.basePackage as PackageKey],
    });
  }

  if (rows.length === 0 && project.rooms.length === 0) return null;

  return (
    <section>
      <h2 className="mb-6 font-sans text-nums uppercase text-inkMuted">{ui.labels.specs}</h2>

      {rows.length > 0 && (
        <dl className="border-t border-line">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-6 border-b border-line py-3.5"
            >
              <dt className="text-body text-inkMuted">{row.label}</dt>
              <dd className="text-right text-body tabularNums text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {project.rooms.length > 0 && (
        <>
          <h3 className="mb-4 mt-10 font-sans text-nums uppercase text-inkMuted">
            {ui.labels.rooms}
          </h3>
          <dl className="border-t border-line">
            {project.rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-baseline justify-between gap-6 border-b border-line py-3"
              >
                <dt className="text-body text-ink">{room.title}</dt>
                {room.areaM2 && (
                  <dd className="text-right text-body tabularNums text-inkMuted">
                    {formatNumber(room.areaM2)} {ui.units.m2}
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}
