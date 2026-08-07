import { db, safeQuery } from './db';
import type { PackageKey } from './enums';

/**
 * Параметры калькулятора живут в таблице CalcParam и редактируются
 * из админки. В коде не зашито ни одной цены — здесь только формула.
 */
export type CalcParams = Record<string, number>;

export type CalcConfig = {
  params: CalcParams;
  /** true — хотя бы одна цена осталась заглушкой */
  hasStubs: boolean;
};

export async function getCalcConfig(): Promise<CalcConfig> {
  const rows = await safeQuery(
    'calcParams',
    () => db.calcParam.findMany({ orderBy: { sortOrder: 'asc' } }),
    [],
  );

  const params: CalcParams = {};
  let hasStubs = false;
  for (const row of rows) {
    params[row.key] = row.value;
    if (row.isStub) hasStubs = true;
  }

  return { params, hasStubs };
}

export type CalcInput = {
  areaM2: number;
  packageKey: PackageKey;
  floors: number;
  hasMansard: boolean;
  isBanya: boolean;
  terraceAreaM2: number;
  /** Свайный фундамент как отдельная опция — актуально для стенокомплекта */
  withFoundation: boolean;
  deliveryKm: number;
};

export type CalcResult = {
  min: number;
  max: number;
  /** Разбивка, чтобы показать, из чего сложилась сумма */
  breakdown: { label: string; value: number }[];
};

/**
 * Предварительный расчёт. Возвращает диапазон, а не точку:
 * точную сумму без выезда на участок назвать нельзя, и делать вид,
 * что можно, — вводить человека в заблуждение.
 */
export function calculate(input: CalcInput, params: CalcParams): CalcResult | null {
  const pricePerM2 = params[`price.${input.packageKey}`];
  if (!pricePerM2 || !Number.isFinite(input.areaM2) || input.areaM2 <= 0) return null;

  const breakdown: { label: string; value: number }[] = [];

  let base = pricePerM2 * input.areaM2;
  breakdown.push({ label: 'Дом по выбранной комплектации', value: Math.round(base) });

  if (input.floors >= 2 && params['coef.secondFloor']) {
    const delta = base * (params['coef.secondFloor'] - 1);
    base += delta;
    breakdown.push({ label: 'Второй этаж', value: Math.round(delta) });
  }

  if (input.hasMansard && params['coef.mansard']) {
    const delta = base * (params['coef.mansard'] - 1);
    base += delta;
    breakdown.push({ label: 'Мансарда', value: Math.round(delta) });
  }

  if (input.isBanya && params['coef.banya']) {
    const delta = base * (params['coef.banya'] - 1);
    base += delta;
    breakdown.push({ label: 'Малая площадь (баня)', value: Math.round(delta) });
  }

  if (input.terraceAreaM2 > 0 && params['coef.terrace']) {
    const delta = pricePerM2 * params['coef.terrace'] * input.terraceAreaM2;
    base += delta;
    breakdown.push({ label: 'Терраса', value: Math.round(delta) });
  }

  if (input.withFoundation && params['option.foundation']) {
    const delta = params['option.foundation'] * input.areaM2;
    base += delta;
    breakdown.push({ label: 'Свайный фундамент', value: Math.round(delta) });
  }

  if (input.deliveryKm > 0 && params['option.deliveryPerKm']) {
    const delta = params['option.deliveryPerKm'] * input.deliveryKm;
    base += delta;
    breakdown.push({ label: `Доставка, ${input.deliveryKm} км`, value: Math.round(delta) });
  }

  const minTotal = params['result.minTotal'] ?? 0;
  const total = Math.max(base, minTotal);
  const spread = params['result.spread'] ?? 0.1;

  // Округляем до десятков тысяч: точность до рубля здесь была бы обманом
  const round = (value: number) => Math.round(value / 10_000) * 10_000;

  return {
    min: round(total * (1 - spread)),
    max: round(total * (1 + spread)),
    breakdown,
  };
}
