import { db, safeQuery } from './db';
import type { PictureMedia } from '@/components/media/Picture';

export type MediaLite = PictureMedia & {
  id: string;
  kind: string;
  caption?: string | null;
  poster?: string | null;
  duration?: number | null;
  sortOrder: number;
  isCover: boolean;
};

export const mediaSelect = {
  id: true,
  kind: true,
  src: true,
  alt: true,
  caption: true,
  poster: true,
  duration: true,
  width: true,
  height: true,
  blurDataUrl: true,
  isCover: true,
  sortOrder: true,
} as const;

/** Обложка: помеченная isCover, иначе первое фото по порядку. */
export function pickCover<T extends { isCover: boolean; kind: string }>(
  media: T[],
): T | undefined {
  return (
    media.find((m) => m.isCover) ??
    media.find((m) => m.kind === 'PHOTO') ??
    media.find((m) => m.kind === 'RENDER') ??
    media[0]
  );
}

/** Всё, кроме планировок: они выводятся отдельным блоком. */
export function galleryMedia<T extends { kind: string }>(media: T[]): T[] {
  return media.filter((m) => m.kind !== 'PLAN' && m.kind !== 'VIDEO');
}

export function planMedia<T extends { kind: string }>(media: T[]): T[] {
  return media.filter((m) => m.kind === 'PLAN');
}

export function videoMedia<T extends { kind: string }>(media: T[]): T[] {
  return media.filter((m) => m.kind === 'VIDEO');
}

/** Медиа сайта (без владельца): стоп-кадры производства, фото основателя, видео. */
export async function getSiteMedia(kind: string): Promise<MediaLite[]> {
  return safeQuery(
    `siteMedia:${kind}`,
    () =>
      db.media.findMany({
        where: { kind, projectId: null, workId: null, reviewId: null },
        orderBy: { sortOrder: 'asc' },
        select: mediaSelect,
      }) as Promise<MediaLite[]>,
    [],
  );
}
