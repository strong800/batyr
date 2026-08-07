import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { db, safeQuery } from '@/lib/db';
import { galleryMedia, mediaSelect, pickCover, videoMedia } from '@/lib/media';
import { getContacts, getSettings } from '@/lib/settings';
import { PACKAGE_LABELS, type PackageKey } from '@/lib/enums';
import { siteMeta, ui } from '@/config/site';

import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/motion/Reveal';
import { BadgeRow } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Gallery } from '@/components/project/Gallery';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { LeadForm } from '@/components/forms/LeadForm';

export const dynamic = 'force-dynamic';

const workSelect = {
  slug: true,
  title: true,
  location: true,
  year: true,
  facadeColor: true,
  durationText: true,
  packageKey: true,
  description: true,
  project: { select: { slug: true, title: true, areaM2: true, floors: true } },
  media: { orderBy: { sortOrder: 'asc' as const }, select: mediaSelect },
} as const;

async function loadWork(slug: string) {
  return safeQuery(
    `work:${slug}`,
    () => db.work.findFirst({ where: { slug, visible: true }, select: workSelect }),
    null,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = await loadWork(slug);
  if (!work) return { title: 'Объект не найден' };

  const cover = pickCover(work.media);
  const description =
    work.description ??
    `${work.title}: реализованный объект из профилированного бруса собственного производства.`;

  return {
    title: work.title,
    description,
    alternates: { canonical: `/works/${work.slug}` },
    openGraph: {
      type: 'article',
      title: `${work.title} — ${siteMeta.name}`,
      description,
      images: cover ? [{ url: cover.src, alt: cover.alt ?? work.title }] : undefined,
    },
  };
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = await loadWork(slug);
  if (!work) notFound();

  const settings = await getSettings();
  const contacts = getContacts(settings);

  const gallery = galleryMedia(work.media);
  const videos = videoMedia(work.media);

  return (
    <div className="py-sectionSm md:py-sectionMd">
      <Container>
        <nav aria-label="Навигация" className="mb-8 font-sans text-badge uppercase text-inkMuted">
          <Link href="/works" className="transition-colors hover:text-ember">
            Объекты
          </Link>
          <span aria-hidden className="mx-2">
            /
          </span>
          <span>{work.title}</span>
        </nav>

        <header className="mb-12 grid gap-6 lg:mb-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h1 className="text-sectionTitle">{work.title}</h1>
            <BadgeRow
              className="mt-6"
              items={[
                work.location,
                work.year ? String(work.year) : null,
                work.facadeColor,
                work.durationText,
                work.packageKey ? PACKAGE_LABELS[work.packageKey as PackageKey] : null,
              ]}
            />
          </div>
          {work.description && (
            <p className="max-w-prose text-lead text-inkMuted lg:col-span-5 lg:col-start-8 lg:self-end">
              {work.description}
            </p>
          )}
        </header>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-8">
            <Reveal>
              <Gallery items={gallery} title={work.title} eventMeta={{ work: work.slug }} />
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
                      title={video.alt ?? work.title}
                      ratio="vertical"
                    />
                  ))}
                </div>
              </Reveal>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              {work.project && (
                <Reveal className="border border-line p-6">
                  <p className="font-sans text-nums uppercase text-inkMuted">Построен по проекту</p>
                  <h2 className="mt-3 text-cardTitle">{work.project.title}</h2>
                  <BadgeRow
                    className="mt-4"
                    items={[
                      work.project.areaM2 ? `${work.project.areaM2} ${ui.units.m2}` : null,
                      work.project.floors === 1 ? '1 этаж' : `${work.project.floors} этажа`,
                    ]}
                  />
                  <Button
                    href={`/catalog/${work.project.slug}`}
                    variant="outline"
                    className="mt-6"
                  >
                    Открыть проект
                  </Button>
                </Reveal>
              )}

              <Reveal className="mt-8 border border-line bg-paperDeep p-6 lg:p-7">
                <h2 className="text-cardTitle">Хочу такой же</h2>
                <p className="mt-3 text-body text-inkMuted">
                  Посчитаем стоимость под ваш участок.
                </p>
                <LeadForm
                  type="PROJECT"
                  telegram={contacts.telegram}
                  projectSlug={work.project?.slug}
                  projectTitle={work.project?.title ?? work.title}
                  submitLabel="Рассчитать"
                  className="mt-6"
                />
              </Reveal>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
