import { db, safeQuery } from './db';
import { contactDefaults, legalDefaults } from '@/config/site';

/**
 * Чтение настроек одним запросом. Возвращает Map, чтобы страница
 * не ходила в базу по разу на каждый ключ.
 */
export async function getSettings(): Promise<Map<string, string>> {
  const rows = await safeQuery('settings', () => db.setting.findMany(), []);
  return new Map(rows.map((r) => [r.key, r.value]));
}

export function settingText(
  settings: Map<string, string>,
  key: string,
  fallback = '',
): string {
  const value = settings.get(key);
  return value && value.trim() ? value : fallback;
}

export function settingNumber(
  settings: Map<string, string>,
  key: string,
  fallback: number,
): number {
  const raw = settings.get(key);
  if (!raw) return fallback;
  const parsed = Number(raw.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function settingBool(
  settings: Map<string, string>,
  key: string,
  fallback = false,
): boolean {
  const raw = settings.get(key);
  if (raw === undefined) return fallback;
  return raw === 'true' || raw === '1';
}

export type Contacts = {
  phone: string;
  phoneRaw: string;
  phonePerson: string;
  telegram: string;
  telegramLabel: string;
  instagram: string;
  instagramLabel: string;
  address: string;
  workHours: string;
  mapLat: number;
  mapLon: number;
  mapZoom: number;
};

/** Достаёт @username из ссылки на профиль. */
function handleFromUrl(url: string, host: string): string {
  const cleaned = url
    .replace(new RegExp(`^https?://(www\\.)?${host}/`, 'i'), '')
    .replace(/\/$/, '')
    .split('?')[0];
  return cleaned ? `@${cleaned}` : '';
}

/** Контакты с подстановкой значений по умолчанию из конфига. */
export function getContacts(settings: Map<string, string>): Contacts {
  const telegram = settingText(settings, 'contacts.telegram', contactDefaults.telegram);
  const instagram = settingText(settings, 'contacts.instagram', contactDefaults.instagram);
  return {
    instagram,
    instagramLabel: handleFromUrl(instagram, 'instagram\\.com') || contactDefaults.instagramLabel,
    phone: settingText(settings, 'contacts.phone', contactDefaults.phone),
    phoneRaw: settingText(settings, 'contacts.phoneRaw', contactDefaults.phoneRaw),
    phonePerson: settingText(settings, 'contacts.phonePerson', contactDefaults.phonePerson),
    telegram,
    telegramLabel: handleFromUrl(telegram, 't\\.me') || contactDefaults.telegramLabel,
    address: settingText(settings, 'contacts.address', contactDefaults.address),
    workHours: settingText(settings, 'contacts.workHours', contactDefaults.workHours),
    mapLat: settingNumber(settings, 'contacts.mapLat', contactDefaults.mapLat),
    mapLon: settingNumber(settings, 'contacts.mapLon', contactDefaults.mapLon),
    mapZoom: settingNumber(settings, 'contacts.mapZoom', contactDefaults.mapZoom),
  };
}

export type Legal = {
  entityName: string;
  inn: string;
  ogrnip: string;
};

/** Реквизиты для футера, разметки Schema.org и политики обработки данных. */
export function getLegal(settings: Map<string, string>): Legal {
  return {
    entityName: settingText(settings, 'legal.entityName', legalDefaults.entityName),
    inn: settingText(settings, 'legal.inn', legalDefaults.inn),
    ogrnip: settingText(settings, 'legal.ogrnip', legalDefaults.ogrnip),
  };
}
