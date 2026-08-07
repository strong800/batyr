import { cookies, headers } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { db } from './db';

export const VISITOR_COOKIE = 'bvid';
const YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Грубое определение устройства по ширине экрана и User-Agent. */
export function detectDevice(userAgent: string, screenWidth?: number): string {
  if (screenWidth) {
    if (screenWidth < 768) return 'mobile';
    if (screenWidth < 1024) return 'tablet';
    return 'desktop';
  }
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobile|android|iphone/.test(ua)) return 'mobile';
  return 'desktop';
}

export type VisitorContext = {
  id: string;
  isNew: boolean;
  device: string;
};

/**
 * Находит или заводит посетителя. Идентификатор живёт в первой куке —
 * никаких сторонних сервисов и трекеров.
 */
export async function resolveVisitor(input: {
  screenWidth?: number;
  referrer?: string;
  landingPath?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}): Promise<VisitorContext> {
  const cookieStore = await cookies();
  const headerList = await headers();
  const userAgent = headerList.get('user-agent') ?? '';
  const device = detectDevice(userAgent, input.screenWidth);

  const existingId = cookieStore.get(VISITOR_COOKIE)?.value;

  if (existingId) {
    try {
      const visitor = await db.visitor.findUnique({ where: { id: existingId } });
      if (visitor) {
        await db.visitor.update({
          where: { id: existingId },
          data: { lastSeen: new Date(), device },
        });
        return { id: existingId, isNew: false, device };
      }
    } catch (error) {
      console.error('[analytics] чтение посетителя:', error);
    }
  }

  const id = existingId ?? randomUUID();

  try {
    await db.visitor.create({
      data: {
        id,
        device,
        // Источник фиксируем один раз, при первом визите
        referrer: input.referrer ?? null,
        landingPath: input.landingPath ?? null,
        utmSource: input.utmSource ?? null,
        utmMedium: input.utmMedium ?? null,
        utmCampaign: input.utmCampaign ?? null,
      },
    });
  } catch (error) {
    console.error('[analytics] создание посетителя:', error);
  }

  try {
    cookieStore.set(VISITOR_COOKIE, id, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: YEAR_SECONDS,
    });
  } catch {
    // В маршрутах, где куку ставить нельзя, просто продолжаем без неё
  }

  return { id, isNew: true, device };
}

/** Читает id посетителя без создания новой записи. */
export async function peekVisitorId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(VISITOR_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}
