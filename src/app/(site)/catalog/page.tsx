import type { Metadata } from 'next';
import { getCatalogProjects } from '@/lib/projects';
import { areaBounds, parseCatalogFilters } from '@/lib/catalogFilters';
import { siteMeta } from '@/config/site';
import { Container } from '@/components/layout/Container';
import { CatalogClient } from '@/components/catalog/CatalogClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Каталог проектов домов из профилированного бруса',
  description:
    'Готовые проекты домов и бань из профилированного бруса собственного производства. Площади, габариты, планировки и фотографии построенных объектов.',
  openGraph: {
    title: `Каталог проектов — ${siteMeta.legalName}`,
    description:
      'Готовые проекты домов и бань из профилированного бруса. Площади, планировки и фото реализованных объектов.',
  },
  alternates: { canonical: '/catalog' },
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [projects, params] = await Promise.all([getCatalogProjects(), searchParams]);
  const initialFilters = parseCatalogFilters(params, areaBounds(projects));

  return (
    <div className="py-sectionSm md:py-sectionMd">
      <Container>
        <header className="mb-12 grid gap-6 lg:mb-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="mb-4 flex items-center gap-3 font-sans text-nums uppercase text-inkMuted">
              <span>Каталог</span>
              <span aria-hidden className="h-px w-10 bg-line" />
            </div>
            <h1 className="text-sectionTitle">Проекты домов и бань</h1>
          </div>
          <p className="max-w-prose text-lead text-inkMuted lg:col-span-5 lg:col-start-8 lg:self-end">
            Все дома на фотографиях — построенные. Площади и планировки взяты
            из реализованных объектов, а не нарисованы для каталога.
          </p>
        </header>

        <CatalogClient projects={projects} initialFilters={initialFilters} />
      </Container>
    </div>
  );
}
