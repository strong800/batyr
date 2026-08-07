import { db, safeQuery } from './db';
import { mediaSelect, pickCover } from './media';
import type { ProjectCardData } from '@/components/catalog/ProjectCard';

const cardSelect = {
  slug: true,
  title: true,
  category: true,
  areaM2: true,
  floors: true,
  widthMm: true,
  lengthMm: true,
  hasTerrace: true,
  hasMansard: true,
  hasBalcony: true,
  sortOrder: true,
  media: {
    select: mediaSelect,
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

type RawProject = {
  slug: string;
  title: string;
  areaM2: number | null;
  floors: number | null;
  widthMm: number | null;
  lengthMm: number | null;
  hasTerrace: boolean;
  hasMansard: boolean;
  media: { isCover: boolean; kind: string; src: string; alt: string | null; width: number | null; height: number | null; blurDataUrl: string | null }[];
};

function toCard(project: RawProject): ProjectCardData {
  const cover = pickCover(project.media);
  return {
    slug: project.slug,
    title: project.title,
    areaM2: project.areaM2,
    floors: project.floors,
    widthMm: project.widthMm,
    lengthMm: project.lengthMm,
    hasTerrace: project.hasTerrace,
    hasMansard: project.hasMansard,
    cover: cover
      ? {
          src: cover.src,
          alt: cover.alt,
          width: cover.width,
          height: cover.height,
          blurDataUrl: cover.blurDataUrl,
        }
      : null,
  };
}

export type CatalogProject = ProjectCardData & {
  category: string;
  hasBalcony: boolean;
};

/** Весь видимый каталог. Фильтрация идёт на клиенте — так она мгновенная. */
export async function getCatalogProjects(): Promise<CatalogProject[]> {
  const rows = await safeQuery(
    'catalogProjects',
    () =>
      db.project.findMany({
        where: { visible: true },
        orderBy: { sortOrder: 'asc' },
        select: cardSelect,
      }),
    [],
  );

  return (rows as (RawProject & { category: string; hasBalcony: boolean })[]).map((project) => ({
    ...toCard(project),
    category: project.category,
    hasBalcony: project.hasBalcony,
  }));
}

/** Проекты для витрины на главной: только помеченные «показывать на главной». */
export async function getFeaturedProjects(limit = 6): Promise<ProjectCardData[]> {
  const rows = await safeQuery(
    'featuredProjects',
    () =>
      db.project.findMany({
        where: { visible: true, featured: true },
        orderBy: { sortOrder: 'asc' },
        take: limit,
        select: cardSelect,
      }),
    [],
  );
  return (rows as RawProject[]).map(toCard);
}
