import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 67.6 → «67,6», 116 → «116». Русская запятая вместо точки. */
export function formatNumber(value: number, maxFractionDigits = 1): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

/** 1250000 → «1 250 000 ₽» */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

/** 12700 → «12,7» (мм в метры для подписи габаритов) */
export function mmToM(mm: number): string {
  return formatNumber(mm / 1000, 2);
}

/** «12,7 × 8,54 м» либо null, если размеров нет */
export function formatSize(widthMm?: number | null, lengthMm?: number | null): string | null {
  if (!widthMm || !lengthMm) return null;
  return `${mmToM(widthMm)} × ${mmToM(lengthMm)} м`;
}

export function formatFloors(floors?: number | null): string | null {
  if (!floors) return null;
  if (floors === 1) return '1 этаж';
  if (floors < 5) return `${floors} этажа`;
  return `${floors} этажей`;
}

/**
 * Разбор строк вида «Заголовок::Текст» из настроек.
 * Используется в блоках производства и индивидуального проекта.
 */
export function parsePairs(raw?: string | null): { title: string; text: string }[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...rest] = line.split('::');
      return { title: title.trim(), text: rest.join('::').trim() };
    })
    .filter((pair) => pair.title.length > 0);
}

/** Разбор строк, разделённых вертикальной чертой. */
export function parseList(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Российский телефон: принимаем любой формат ввода, требуем 11 цифр
 * и первую 7 или 8. Возвращаем нормализованный +7XXXXXXXXXX или null.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length !== 11) return null;
  if (digits[0] !== '7' && digits[0] !== '8') return null;
  return `+7${digits.slice(1)}`;
}

/** Разбивает текст на абзацы по пустой строке. */
export function toParagraphs(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function slugify(input: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return input
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
