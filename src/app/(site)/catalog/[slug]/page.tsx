import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { siteMeta, ui } from '@/config/site';
import { db, safeQuery } from '@/lib/db';
import { galleryMedia, mediaSelect, pickCover, planMedia, videoMedia } from '@/lib/media';
import { getContacts, getSettings } from '@/lib/settings';
import { formatFloors, formatNumber, formatSize } from '@/lib/utils';
import { CATEGORY_LABELS, type ProjectCategory } from '@/lib/enums';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { BadgeRow } from '@/components/ui/Badge';
import { Gallery } from '@/components/project/Gallery';
import { Plans } from '@/components/project/Plans';
import { SpecsTable } from '@/components/project/SpecsTable';
import { PackagesTabs } from '@/components/packages/PackagesTabs';
import { ProjectCard } from '@/components/catalog/ProjectCard';
import { LeadForm } from '@/components/forms/LeadForm';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { ProductSchema } from '@/components/seo/ProductSchema';
import { ProjectViewTracker } from '@/components/analytics/ProjectViewTracker';

export const dynamic = 'force-dynamic';

const projectSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  areaM2: true,
  floors: true,
  widthMm: true,
  lengthMm: true,
  ceilingMm: true,
  hasTerrace: true,
  terraceAreaM2: true,
  hasMansard: true,
  hasBalcony: true,
  foundation: true,
  basePackage: true,
  tagline: true,
  description: true,
  seoTitle: true,
  seoDescription: true,
  rooms: { orderBy: { sortOrder: 'asc' as const }, select: { id: true, title: true, areaM2: true } },
  media: { orderBy: { sortOrder: 'asc' as const }, select: mediaSelect },
} as const;

async function loadProject(slug: string) {
  return safeQuery(
    `project:${slug}`,
    () => db.project.findFirst({ where: { slug, visible: true }, select: projectSelect }),
    null,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await loadProject(slug);
  if (!project) return { title: 'Проект не найден' };

  const cover = pickCover(project.media);
  const area = project.areaM2 ? `${formatNumber(project.areaM2)} м²` : '';
  const title = project.seoTitle ?? `Проект «${project.title}»${area ? `, ${area}` : ''}`;
  const description =
    project.seoDescription ??
    project.description ??
    `${project.title}: дом из профилированного бруса собственного производства. ${area}`;

  return {
    title,
    description,
    alternates: { canonical: `/catalog/${project.slug}` },
    openGraph: {
      type: 'article',
      title: `${title} — ${siteMeta.name}`,
      description,
      images: cover ? [{ url: cover.src, width: cover.width ?? 1200, height: cover.height ?? 1500, alt: cover.alt ?? project.title }] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await loadProject(slug);
  if (!project) notFound();

  const settings = await getSettings();
  const contacts = getContacts(settings);

  const [packages, similar] = await Promise.all([
    safeQuery(
      'packages',
      () =>
        db.package.findMany({
          where: { visible: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            key: true,
            title: true,
            subtitle: true,
            summary: true,
            items: { orderBy: { sortOrder: 'asc' as const }, select: { id: true, title: true, note: true } },
          },
        }),
      [],
    ),
    // Похожие: та же категория, площадь в пределах ±40 %
    safeQuery(
      'similarProjects',
      () =>
        db.project.findMany({
          where: {
            visible: true,
            slug: { not: project.slug },
            category: project.category,
            ...(project.areaM2
              ? { areaM2: { gte: project.areaM2 * 0.6, lte: project.areaM2 * 1.4 } }
              : {}),
          },
          orderBy: { sortOrder: 'asc' },
          take: 3,
          select: {
            slug: true,
            title: true,
            areaM2: true,
            floors: true,
            widthMm: true,
            lengthMm: true,
            hasTerrace: true,
            hasMansard: true,
            media: { orderBy: { sortOrder: 'asc' as const }, select: mediaSelect },
          },
        }),
      [],
    ),
  ]);

  const gallery = galleryMedia(project.media);
  const plans = planMedia(project.media);
  const videos = videoMedia(project.media);

  const badges = [
    project.areaM2 ? `${formatNumber(project.areaM2)} ${ui.units.m2}` : null,
    formatFloors(project.floors),
    formatSize(project.widthMm, project.lengthMm),
    project.hasTerrace ? ui.labels.terrace : null,
    project.hasMansard ? ui.labels.mansard : null,
    project.hasBalcony ? ui.labels.balcony : null,
  ];

  return (
    <>
      <ProductSchema project={project} cover={pickCover(project.media) ?? null} />
      <ProjectViewTracker slug={project.slug} title={project.title} />

      <div className="py-sectionSm md:py-sectionMd">
        <Container>
          {/* Хлебные крошки */}
          <nav aria-label="Навигация" className="mb-8 font-sans text-badge uppercase text-inkMuted">
            <Link href="/catalog" className="transition-colors hover:text-ember">
              Каталог
            </Link>
            <span aria-hidden className="mx-2">
              /
            </span>
            <span>{CATEGORY_LABELS[project.category as ProjectCategory] ?? 'Проект'}</span>
          </nav>

          <header className="mb-12 grid gap-6 lg:mb-16 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h1 className="text-sectionTitle">{project.title}</h1>
              <BadgeRow className="mt-6" items={badges} />
            </div>
            {(project.tagline || project.description) && (
              <div className="lg:col-span-5 lg:col-start-8 lg:self-end">
                {project.tagline && (
                  <p className="mb-3 font-sans text-badge uppercase text-ember">{project.tagline}</p>
                )}
                {project.description && (
                  <p className="max-w-prose text-lead text-inkMuted">{project.description}</p>
                )}
              </div>
            )}
          </header>

          <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-8">
              <Reveal>
                <Gallery
                  items={gallery}
                  title={project.title}
                  eventMeta={{ slug: project.slug }}
                />
              </Reveal>

              {videos.length > 0 && (
                <Reveal className="mt-14">
                  <h2 className="mb-6 font-sans text-nums uppercase text-inkMuted">
                    {ui.labels.video}
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {videos.map((video) => (
                      <VideoPlayer
                        key={video.id}
                        src={video.src}
                        poster={video.poster}
                        title={video.alt ?? project.title}
                        ratio="vertical"
                      />
                    ))}
                  </div>
                </Reveal>
              )}

              {plans.length > 0 && (
                <Reveal className="mt-14">
                  <Plans items={plans} projectSlug={project.slug} />
                </Reveal>
              )}
            </div>

            {/* Характеристики и заявка */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <Reveal>
                  <SpecsTable project={project} />
                </Reveal>

                <Reveal className="mt-10 border border-line bg-paperDeep p-6 lg:p-7">
                  <h2 className="text-cardTitle">Узнать стоимость</h2>
                  <p className="mt-3 text-body text-inkMuted">
                    Посчитаем по этому проекту и вашему участку.
                  </p>
                  <LeadForm
                    type="PROJECT"
                    telegram={contacts.telegram}
                    projectSlug={project.slug}
                    projectTitle={project.title}
                    submitLabel="Узнать стоимость"
                    className="mt-6"
                  />
                </Reveal>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {packages.length > 0 && (
        <Section
          num="—"
          title={ui.labels.included}
          lead="Три уровня готовности. Выберите, до какого этапа мы доводим дом."
          dark
        >
          <Reveal>
            <PackagesTabs packages={packages} onDark />
          </Reveal>
        </Section>
      )}

      {similar.length > 0 && (
        <Section title={ui.labels.similar} deep>
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((item, i) => (
              <Reveal key={item.slug} index={i}>
                <ProjectCard
                  index={i}
                  project={{
                    slug: item.slug,
                    title: item.title,
                    areaM2: item.areaM2,
                    floors: item.floors,
                    widthMm: item.widthMm,
                    lengthMm: item.lengthMm,
                    hasTerrace: item.hasTerrace,
                    hasMansard: item.hasMansard,
                    cover: pickCover(item.media) ?? null,
                  }}
                />
              </Reveal>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
