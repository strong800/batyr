import { siteMeta } from '@/config/site';
import type { MediaLite } from '@/lib/media';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

type SchemaProject = {
  slug: string;
  title: string;
  description: string | null;
  areaM2: number | null;
  floors: number | null;
  widthMm: number | null;
  lengthMm: number | null;
  hasTerrace: boolean;
  hasMansard: boolean;
};

/**
 * Schema.org Product с характеристиками проекта.
 *
 * Цену не публикуем: в базе стоят заглушки, а размечать выдуманную
 * стоимость как настоящую нельзя. Появятся реальные цены — добавим offers.
 */
export function ProductSchema({
  project,
  cover,
}: {
  project: SchemaProject;
  cover: MediaLite | null;
}) {
  const properties: { '@type': 'PropertyValue'; name: string; value: string | number; unitText?: string }[] = [];

  if (project.areaM2) {
    properties.push({ '@type': 'PropertyValue', name: 'Площадь', value: project.areaM2, unitText: 'м²' });
  }
  if (project.floors) {
    properties.push({ '@type': 'PropertyValue', name: 'Этажность', value: project.floors });
  }
  if (project.widthMm && project.lengthMm) {
    properties.push({
      '@type': 'PropertyValue',
      name: 'Габариты',
      value: `${project.widthMm} × ${project.lengthMm}`,
      unitText: 'мм',
    });
  }
  if (project.hasTerrace) {
    properties.push({ '@type': 'PropertyValue', name: 'Терраса', value: 'есть' });
  }
  if (project.hasMansard) {
    properties.push({ '@type': 'PropertyValue', name: 'Мансарда', value: 'есть' });
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${siteUrl}/catalog/${project.slug}#product`,
    name: `Проект дома «${project.title}»`,
    description: project.description ?? undefined,
    category: 'Дом из профилированного бруса',
    material: 'Профилированный брус',
    image: cover ? `${siteUrl}${cover.src}` : undefined,
    url: `${siteUrl}/catalog/${project.slug}`,
    brand: { '@type': 'Brand', name: siteMeta.legalName },
    additionalProperty: properties.length ? properties : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
