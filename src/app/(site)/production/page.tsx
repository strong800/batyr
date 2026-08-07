import type { Metadata } from 'next';

import { getSiteMedia } from '@/lib/media';
import { getContacts, getSettings, settingText } from '@/lib/settings';
import { parsePairs, toParagraphs } from '@/lib/utils';
import { siteMeta } from '@/config/site';

import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { Picture } from '@/components/media/Picture';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { PackagesTabs } from '@/components/packages/PackagesTabs';
import { LeadForm } from '@/components/forms/LeadForm';
import { db, safeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Производство профилированного бруса в Уфе',
  description:
    'Собственный цех: профилирование бруса, нарезка непродуваемых чашек с лазерной разметкой, джут, пружинный узел «сила», компенсаторы усадки, маркировка венцов.',
  alternates: { canonical: '/production' },
  openGraph: {
    title: `Производство — ${siteMeta.legalName}`,
    description: 'Как мы делаем профилированный брус: цех, станки, технология.',
  },
};

export default async function ProductionPage() {
  const settings = await getSettings();
  const contacts = getContacts(settings);

  const [stills, video, packages] = await Promise.all([
    getSiteMedia('PRODUCTION'),
    getSiteMedia('VIDEO'),
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
            items: {
              orderBy: { sortOrder: 'asc' as const },
              select: { id: true, title: true, note: true },
            },
          },
        }),
      [],
    ),
  ]);

  const paragraphs = toParagraphs(settingText(settings, 'production.text'));
  const tech = parsePairs(settings.get('production.tech'));

  return (
    <>
      <div className="py-sectionSm md:py-sectionMd">
        <Container>
          <header className="mb-12 grid gap-6 lg:mb-16 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="mb-4 flex items-center gap-3 font-sans text-nums uppercase text-inkMuted">
                <span>Производство</span>
                <span aria-hidden className="h-px w-10 bg-line" />
              </div>
              <h1 className="text-sectionTitle">Собственный цех в Уфе</h1>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 lg:self-end">
              {paragraphs.map((paragraph, i) => (
                <p key={i} className="mb-4 max-w-prose text-lead text-inkMuted">
                  {paragraph}
                </p>
              ))}
            </div>
          </header>

          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            {video[0] && (
              <Reveal className="lg:col-span-5">
                <VideoPlayer
                  src={video[0].src}
                  poster={video[0].poster}
                  title="Экскурсия по цеху"
                  ratio="vertical"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <p className="mt-4 text-badge uppercase text-inkMuted">
                  Экскурсия по цеху · 40 секунд
                </p>
              </Reveal>
            )}

            <div className={video[0] ? 'lg:col-span-6 lg:col-start-7' : 'lg:col-span-8'}>
              <h2 className="mb-6 font-sans text-nums uppercase text-inkMuted">Технология</h2>
              <ul>
                {tech.map((item, i) => (
                  <Reveal key={item.title} as="li" index={i} className="border-t border-line py-6">
                    <h3 className="font-display text-[1.125rem] uppercase tracking-wide">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-prose text-body text-inkMuted">{item.text}</p>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>

          {stills.length > 0 && (
            <Reveal className="mt-16">
              <h2 className="mb-6 font-sans text-nums uppercase text-inkMuted">Цех</h2>
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                {stills.map((still) => (
                  <li key={still.id}>
                    <Picture
                      media={still}
                      ratio="vertical"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    {/* В подписях длинные слова вроде «профилированного»,
                        а колонка на мобильном всего 156px — без переносов
                        текст вылезал за карточку */}
                    <p
                      lang="ru"
                      className="mt-3 hyphens-auto break-words text-badge uppercase text-inkMuted"
                    >
                      {still.alt}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </Container>
      </div>

      {packages.length > 0 && (
        <Section
          title="Что мы поставляем"
          lead="Три уровня готовности: от пронумерованного комплекта бруса до дома, в который можно заезжать."
          dark
        >
          <Reveal>
            <PackagesTabs packages={packages} onDark />
          </Reveal>
        </Section>
      )}

      <Section title="Нужен домокомплект" deep>
        <div className="grid gap-10 lg:grid-cols-12">
          <p className="max-w-prose text-lead text-inkMuted lg:col-span-5">
            Изготовим по вашему проекту или подберём готовый. Доставляем по всей России.
          </p>
          <Reveal className="lg:col-span-6 lg:col-start-7">
            <div className="border border-line bg-paper p-7">
              <LeadForm
                type="CUSTOM"
                telegram={contacts.telegram}
                withCustomFields
                submitLabel="Отправить на расчёт"
              />
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
