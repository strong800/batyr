import type { Metadata } from 'next';
import Link from 'next/link';
import { db, safeQuery } from '@/lib/db';
import { mediaSelect, pickCover } from '@/lib/media';
import { siteMeta, ui } from '@/config/site';
import { Container } from '@/components/layout/Container';
import { Reveal } from '@/components/motion/Reveal';
import { Picture } from '@/components/media/Picture';
import { BadgeRow } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Реализованные объекты',
  description:
    'Построенные дома и бани из профилированного бруса: фасады, интерьеры после сдачи, разные варианты отделки одного проекта.',
  alternates: { canonical: '/works' },
  openGraph: {
    title: `Реализованные объекты — ${siteMeta.legalName}`,
    description: 'Дома и бани, которые уже стоят: фасады, интерьеры, детали.',
  },
};

export default async function WorksPage() {
  const works = await safeQuery(
    'works',
    () =>
      db.work.findMany({
        where: { visible: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          slug: true,
          title: true,
          location: true,
          year: true,
          facadeColor: true,
          durationText: true,
          project: { select: { title: true, slug: true } },
          media: { orderBy: { sortOrder: 'asc' as const }, select: mediaSelect },
        },
      }),
    [],
  );

  return (
    <div className="py-sectionSm md:py-sectionMd">
      <Container>
        <header className="mb-12 grid gap-6 lg:mb-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="mb-4 flex items-center gap-3 font-sans text-nums uppercase text-inkMuted">
              <span>Объекты</span>
              <span aria-hidden className="h-px w-10 bg-line" />
            </div>
            <h1 className="text-sectionTitle">Реализованные объекты</h1>
          </div>
          <p className="max-w-prose text-lead text-inkMuted lg:col-span-5 lg:col-start-8 lg:self-end">
            Дома, которые уже стоят. Один и тот же проект в разных цветах фасада,
            интерьеры после сдачи и то, как выглядит тёплый контур изнутри.
          </p>
        </header>

        {works.length === 0 ? (
          <p className="text-lead text-inkMuted">{ui.empty.works}</p>
        ) : (
          // Заголовки карточек здесь уже h2, поэтому промежуточный
          // скрытый заголовок не нужен: пропуска уровня нет
          <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {works.map((work, i) => (
              <Reveal key={work.slug} as="li" index={i}>
                <Link
                  href={`/works/${work.slug}`}
                  className="group block focus-visible:outline-offset-4"
                >
                  <article>
                    <Picture
                      media={pickCover(work.media) ?? null}
                      ratio="plate"
                      priority={i < 3}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1600px) 30vw, 440px"
                      className="transition-colors duration-hover ease-calm group-hover:border-ink"
                      imageClassName="transition-transform duration-hover ease-calm group-hover:scale-[1.03]"
                    />
                    <div className="mt-4 flex items-baseline justify-between gap-4">
                      <h2 className="text-cardTitle transition-colors group-hover:text-ember">
                        {work.title}
                      </h2>
                      <span
                        aria-hidden
                        className="shrink-0 font-sans text-badge uppercase text-inkMuted transition-transform duration-hover ease-calm group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </div>
                    <BadgeRow
                      className="mt-3"
                      items={[
                        work.location,
                        work.year ? String(work.year) : null,
                        work.facadeColor,
                        work.media.length > 1 ? `${work.media.length} фото` : null,
                      ]}
                    />
                  </article>
                </Link>
              </Reveal>
            ))}
          </ul>
        )}
      </Container>
    </div>
  );
}
