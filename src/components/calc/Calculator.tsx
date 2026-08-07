'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ui } from '@/config/site';
import { PACKAGE_KEYS, PACKAGE_SHORT_LABELS, type PackageKey } from '@/lib/enums';
import { calculate, type CalcParams } from '@/lib/calc';
import { cn, formatPrice } from '@/lib/utils';
import { trackEvent } from '@/lib/analyticsClient';
import { LeadForm } from '@/components/forms/LeadForm';

export type CalcProjectOption = {
  slug: string;
  title: string;
  areaM2: number | null;
  floors: number | null;
  hasMansard: boolean;
  terraceAreaM2: number | null;
  category: string;
};

type CalculatorProps = {
  projects: CalcProjectOption[];
  params: CalcParams;
  hasStubs: boolean;
  telegram: string;
};

const CUSTOM = 'custom';

export function Calculator({ projects, params, hasStubs, telegram }: CalculatorProps) {
  const [projectSlug, setProjectSlug] = useState<string>(projects[0]?.slug ?? CUSTOM);
  const [customArea, setCustomArea] = useState(80);
  const [packageKey, setPackageKey] = useState<PackageKey>('UNDER_ROOF');
  const [withFoundation, setWithFoundation] = useState(false);
  const [deliveryKm, setDeliveryKm] = useState(0);
  const startedRef = useRef(false);
  const resultReportedRef = useRef(false);

  const selected = projects.find((p) => p.slug === projectSlug) ?? null;

  const input = useMemo(() => {
    const areaM2 = selected?.areaM2 ?? customArea;
    return {
      areaM2,
      packageKey,
      floors: selected?.floors ?? 1,
      hasMansard: selected?.hasMansard ?? false,
      isBanya: selected?.category === 'BANYA',
      terraceAreaM2: selected?.terraceAreaM2 ?? 0,
      // Фундамент входит в «под крышу» и «тёплый контур»,
      // отдельной опцией он нужен только для стенокомплекта
      withFoundation: packageKey === 'WALL_KIT' ? withFoundation : false,
      deliveryKm,
    };
  }, [selected, customArea, packageKey, withFoundation, deliveryKm]);

  const result = useMemo(() => calculate(input, params), [input, params]);

  // Запуск калькулятора и доведение до результата — две метрики воронки
  function reportStart() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent('calcStart');
  }

  useEffect(() => {
    if (!result || resultReportedRef.current || !startedRef.current) return;
    resultReportedRef.current = true;
    trackEvent('calcResult', {
      packageKey,
      areaM2: input.areaM2,
      priceMin: result.min,
      priceMax: result.max,
    });
  }, [result, packageKey, input.areaM2]);

  const labelClass = 'mb-3 block font-sans text-badge uppercase text-sand';
  const controlClass =
    'h-12 w-full rounded border border-forestLine bg-transparent px-4 font-sans text-body text-paper transition-colors focus:border-sand';

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      {/* Параметры */}
      <div className="lg:col-span-7" onFocusCapture={reportStart} onPointerDown={reportStart}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="calcProject" className={labelClass}>
              Проект
            </label>
            <select
              id="calcProject"
              value={projectSlug}
              onChange={(event) => setProjectSlug(event.target.value)}
              className={cn(controlClass, 'appearance-none')}
            >
              {projects.map((project) => (
                <option key={project.slug} value={project.slug} className="bg-forest">
                  {project.title}
                  {project.areaM2 ? ` — ${project.areaM2} м²` : ''}
                </option>
              ))}
              <option value={CUSTOM} className="bg-forest">
                Своя площадь
              </option>
            </select>
          </div>

          {projectSlug === CUSTOM && (
            <div className="sm:col-span-2">
              <label htmlFor="calcArea" className={labelClass}>
                Площадь дома: <span className="tabularNums text-paper">{customArea} м²</span>
              </label>
              <input
                id="calcArea"
                type="range"
                min={30}
                max={250}
                step={1}
                value={customArea}
                onChange={(event) => setCustomArea(Number(event.target.value))}
                className="w-full accent-emberOnDark"
              />
              <div className="mt-1 flex justify-between text-badge text-sand/70">
                <span>30 м²</span>
                <span>250 м²</span>
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <span className={labelClass}>Комплектация</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {PACKAGE_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPackageKey(key)}
                  aria-pressed={packageKey === key}
                  className={cn(
                    'h-12 rounded border px-3 font-sans text-badge uppercase transition-colors',
                    packageKey === key
                      ? 'border-emberOnDark text-paper'
                      : 'border-forestLine text-sand hover:border-sand',
                  )}
                >
                  {PACKAGE_SHORT_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          {packageKey === 'WALL_KIT' && (
            <div className="sm:col-span-2">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={withFoundation}
                  onChange={(event) => setWithFoundation(event.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border border-forestLine bg-transparent accent-ember"
                />
                <span className="text-badge normal-case leading-relaxed text-sand">
                  Добавить свайный фундамент — в стенокомплект он не входит
                </span>
              </label>
            </div>
          )}

          <div className="sm:col-span-2">
            <label htmlFor="calcDelivery" className={labelClass}>
              Доставка от Уфы:{' '}
              <span className="tabularNums text-paper">
                {deliveryKm === 0 ? 'по городу' : `${deliveryKm} км`}
              </span>
            </label>
            <input
              id="calcDelivery"
              type="range"
              min={0}
              max={2000}
              step={50}
              value={deliveryKm}
              onChange={(event) => setDeliveryKm(Number(event.target.value))}
              className="w-full accent-emberOnDark"
            />
            <div className="mt-1 flex justify-between text-badge text-sand/70">
              <span>Уфа</span>
              <span>2000 км</span>
            </div>
          </div>
        </div>
      </div>

      {/* Результат */}
      <div className="lg:col-span-5">
        <div className="border border-forestLine bg-forestSoft p-7">
          <p className="font-sans text-nums uppercase text-timberLight">
            {ui.calc.disclaimerShort}
          </p>

          {result ? (
            <>
              <p className="mt-4 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] uppercase leading-none tabularNums text-paper">
                {formatPrice(result.min)}
                <span className="mx-2 text-sand">—</span>
                {formatPrice(result.max)}
              </p>

              <ul className="mt-6 border-t border-forestLine">
                {result.breakdown.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-baseline justify-between gap-4 border-b border-forestLine py-2.5 text-badge normal-case text-sand"
                  >
                    <span>{row.label}</span>
                    <span className="tabularNums">{formatPrice(row.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4 text-body text-sand">
              Не хватает данных для расчёта. Выберите проект или задайте площадь.
            </p>
          )}

          <p className="mt-6 text-badge normal-case leading-relaxed text-sand/80">
            {ui.calc.disclaimer}
          </p>

          {hasStubs && (
            <p className="mt-4 border-t border-forestLine pt-4 text-badge normal-case leading-relaxed text-emberOnDark">
              Внимание: в калькуляторе стоят цены-заглушки. Замените их в админке
              (раздел «Калькулятор») до показа сайта клиентам.
            </p>
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-cardTitle text-paper">Точная смета</h3>
          <p className="mt-3 max-w-prose text-body text-sand">
            Оставьте контакт — посчитаем по вашему участку и пришлём смету.
          </p>
          <LeadForm
            type="CALC"
            onDark
            telegram={telegram}
            projectSlug={selected?.slug}
            projectTitle={selected?.title}
            extra={{
              areaM2: input.areaM2,
              floors: input.floors,
              packageKey,
              priceMin: result?.min,
              priceMax: result?.max,
              options: JSON.stringify({
                withFoundation: input.withFoundation,
                deliveryKm,
              }),
            }}
            submitLabel="Хочу точную смету"
            className="mt-6"
          />
        </div>
      </div>
    </div>
  );
}
