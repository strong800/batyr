/**
 * SQLite не поддерживает enum, поэтому в схеме Prisma эти значения — строки.
 * Здесь они собраны в одном месте, чтобы не разъезжались по коду.
 */

export const PACKAGE_KEYS = ['WALL_KIT', 'UNDER_ROOF', 'WARM_LOOP'] as const;
export type PackageKey = (typeof PACKAGE_KEYS)[number];

export const PROJECT_CATEGORIES = ['HOUSE', 'BANYA', 'AFRAME'] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const MEDIA_KINDS = [
  'PHOTO',
  'INTERIOR',
  'RENDER',
  'PLAN',
  'VIDEO',
  'PRODUCTION',
  'FOUNDER',
  'BRAND',
  'REVIEW',
  'HERO',
] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const LEAD_TYPES = ['CALC', 'PROJECT', 'CUSTOM', 'CALLBACK'] as const;
export type LeadType = (typeof LEAD_TYPES)[number];

export const LEAD_STATUSES = ['NEW', 'IN_PROGRESS', 'CLOSED'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const ANALYTICS_EVENTS = [
  'phoneClick',
  'telegramClick',
  'instagramClick',
  'calcStart',
  'calcResult',
  'formSubmit',
  'projectView',
  'catalogView',
  'lightboxOpen',
  'videoPlay',
  'scrollDepth',
] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

// --- Подписи для интерфейса и админки ---

export const PACKAGE_LABELS: Record<PackageKey, string> = {
  WALL_KIT: 'Стенокомплект',
  UNDER_ROOF: 'Домокомплект под крышу со сборкой',
  WARM_LOOP: 'Тёплый контур',
};

export const PACKAGE_SHORT_LABELS: Record<PackageKey, string> = {
  WALL_KIT: 'Стенокомплект',
  UNDER_ROOF: 'Под крышу',
  WARM_LOOP: 'Тёплый контур',
};

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  HOUSE: 'Дом',
  BANYA: 'Баня',
  AFRAME: 'А-фрейм',
};

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  CALC: 'Калькулятор',
  PROJECT: 'Карточка проекта',
  CUSTOM: 'Индивидуальный проект',
  CALLBACK: 'Обратный звонок',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  CLOSED: 'Закрыта',
};

export function isPackageKey(value: string): value is PackageKey {
  return (PACKAGE_KEYS as readonly string[]).includes(value);
}

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}
