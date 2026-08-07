import { z } from 'zod';
import { LEAD_TYPES } from './enums';
import { normalizePhone } from './utils';

/**
 * Схема заявки. Используется и на клиенте (мгновенная подсказка),
 * и на сервере (настоящая проверка) — правила не расходятся.
 */
export const leadSchema = z.object({
  type: z.enum(LEAD_TYPES),

  name: z
    .string()
    .trim()
    .min(2, 'Напишите, как к вам обращаться')
    .max(120, 'Слишком длинное имя'),

  phone: z
    .string()
    .trim()
    .refine((value) => normalizePhone(value) !== null, {
      message: 'Проверьте номер: нужно 11 цифр, например +7 999 123-45-67',
    })
    .transform((value) => normalizePhone(value) as string),

  email: z.string().trim().email('Проверьте адрес').max(200).optional().or(z.literal('')),

  comment: z.string().trim().max(2000).optional().or(z.literal('')),

  consent: z.literal(true, {
    errorMap: () => ({ message: 'Без согласия на обработку данных мы не сможем принять заявку' }),
  }),

  /**
   * Ловушка для ботов: поле спрятано от людей стилями и aria-hidden.
   * Живой человек его не заполнит, простой спам-бот — заполнит.
   * Капчу не ставим намеренно, она бьёт по конверсии сильнее спама.
   */
  website: z.string().max(0, 'spam').optional().or(z.literal('')),

  // Контекст заявки
  projectSlug: z.string().max(120).optional().or(z.literal('')),
  projectTitle: z.string().max(200).optional().or(z.literal('')),
  areaM2: z.coerce.number().min(10).max(1000).optional(),
  floors: z.coerce.number().int().min(1).max(3).optional(),
  hasLand: z.boolean().optional(),
  packageKey: z.string().max(40).optional().or(z.literal('')),
  options: z.string().max(1000).optional().or(z.literal('')),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),

  // Источник
  utmSource: z.string().max(120).optional().or(z.literal('')),
  utmMedium: z.string().max(120).optional().or(z.literal('')),
  utmCampaign: z.string().max(120).optional().or(z.literal('')),
  utmContent: z.string().max(120).optional().or(z.literal('')),
  utmTerm: z.string().max(120).optional().or(z.literal('')),
  referrer: z.string().max(500).optional().or(z.literal('')),
  landingPath: z.string().max(300).optional().or(z.literal('')),
});

export type LeadInput = z.input<typeof leadSchema>;
export type LeadParsed = z.output<typeof leadSchema>;

/** Разрешённые типы вложений для индивидуального проекта. */
export const ALLOWED_UPLOAD_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/acad',
  'image/vnd.dwg',
  'application/octet-stream',
] as const;

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 МБ

export function isAllowedUpload(file: { type: string; size: number; name: string }): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'Файл больше 20 МБ. Сожмите его или пришлите ссылку в комментарии.';
  }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'dwg', 'dxf'];
  if (!allowedExtensions.includes(extension)) {
    return 'Подойдут PDF, JPG, PNG или DWG.';
  }
  return null;
}
