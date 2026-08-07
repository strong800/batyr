import { db, safeQuery } from '@/lib/db';
import { getCalcConfig } from '@/lib/calc';
import { getSiteMedia, mediaSelect, pickCover } from '@/lib/media';
import { getFeaturedProjects } from '@/lib/projects';
import { getContacts, getLegal, getSettings, settingBool, settingText } from '@/lib/settings';
import { parseList, parsePairs } from '@/lib/utils';
import { siteMeta } from '@/config/site';

import { Hero } from '@/components/home/Hero';
import { Advantages } from '@/components/home/Advantages';
import { CatalogPreview } from '@/components/home/CatalogPreview';
import { Packages } from '@/components/home/Packages';
import { Production } from '@/components/home/Production';
import { WorksPreview } from '@/components/home/WorksPreview';
import { Stages } from '@/components/home/Stages';
import { Founder } from '@/components/home/Founder';
import { Reviews } from '@/components/home/Reviews';
import { CustomProject } from '@/components/home/CustomProject';
import { CalcSection } from '@/components/home/CalcSection';
import { Contacts } from '@/components/home/Contacts';
import { OrganizationSchema } from '@/components/seo/OrganizationSchema';

export default async function HomePage() {
  const settings = await getSettings();
  const contacts = getContacts(settings);

  const [projects, works, packages, stages, reviews, productionStills, video, founderPhoto, heroMedia, calc] =
    await Promise.all([
      getFeaturedProjects(6),
      safeQuery(
        'featuredWorks',
        () =>
          db.work.findMany({
            where: { visible: true, featured: true },
            orderBy: { sortOrder: 'asc' },
            take: 6,
            select: {
              slug: true,
              title: true,
              facadeColor: true,
              location: true,
              durationText: true,
              media: { select: mediaSelect, orderBy: { sortOrder: 'asc' as const } },
            },
          }),
        [],
      ),
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
      safeQuery(
        'stages',
        () =>
          db.stage.findMany({
            where: { visible: true },
            orderBy: { sortOrder: 'asc' },
            select: { id: true, title: true, text: true, durationText: true },
          }),
        [],
      ),
      safeQuery(
        'reviews',
        () =>
          db.review.findMany({
            where: { visible: true },
            orderBy: { sortOrder: 'asc' },
            take: 6,
            select: {
              id: true,
              authorName: true,
              authorInfo: true,
              text: true,
              format: true,
              media: { select: mediaSelect, orderBy: { sortOrder: 'asc' as const } },
            },
          }),
        [],
      ),
      getSiteMedia('PRODUCTION'),
      getSiteMedia('VIDEO'),
      getSiteMedia('FOUNDER'),
      // Первый экран: общий кадр бренда, а не карточка конкретного проекта.
      // Карточка с площадью на главной читалась бы как «вот этот дом»,
      // хотя проектов больше пятидесяти.
      getSiteMedia('HERO'),
      getCalcConfig(),
    ]);

  // Проекты для селекта калькулятора
  const calcProjects = await safeQuery(
    'calcProjects',
    () =>
      db.project.findMany({
        where: { visible: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          slug: true,
          title: true,
          areaM2: true,
          floors: true,
          hasMansard: true,
          terraceAreaM2: true,
          category: true,
        },
      }),
    [],
  );

  const heroCover = heroMedia[0] ?? null;
  const reviewsVisible = settingBool(settings, 'blocks.reviewsVisible', false);

  return (
    <>
      <OrganizationSchema contacts={contacts} legal={getLegal(settings)} />

      <Hero
        title={settingText(settings, 'hero.title', siteMeta.tagline)}
        accent={settingText(settings, 'hero.accent', 'под ключ')}
        lead={settingText(settings, 'hero.lead', siteMeta.description)}
        facts={parseList(settings.get('hero.facts'))}
        image={heroCover ?? null}
        city={siteMeta.city}
      />

      <Advantages image={productionStills[0] ?? null} />

      <CatalogPreview projects={projects} />

      <Packages packages={packages} />

      <Production
        title={settingText(settings, 'production.title', 'Собственное производство')}
        text={settingText(settings, 'production.text')}
        tech={parsePairs(settings.get('production.tech'))}
        video={video[0] ?? null}
      />

      <WorksPreview
        works={works.map((work) => ({
          slug: work.slug,
          title: work.title,
          facadeColor: work.facadeColor,
          location: work.location,
          durationText: work.durationText,
          photoCount: work.media.length,
          cover: pickCover(work.media) ?? null,
        }))}
      />

      <Stages stages={stages} />

      <Founder
        name={settingText(settings, 'founder.name', 'Батырхан Хамидуллин')}
        role={settingText(settings, 'founder.role', 'Основатель')}
        text={settingText(settings, 'founder.text')}
        photo={founderPhoto[0] ?? null}
      />

      {/* Блок отзывов скрыт, пока отзывов нет: пустая секция вредит доверию */}
      {reviewsVisible && <Reviews reviews={reviews} />}

      <CustomProject
        title={settingText(settings, 'custom.title', 'Индивидуальный проект')}
        text={settingText(settings, 'custom.text')}
        steps={parsePairs(settings.get('custom.steps'))}
        telegram={contacts.telegram}
      />

      <CalcSection
        projects={calcProjects}
        params={calc.params}
        hasStubs={calc.hasStubs}
        telegram={contacts.telegram}
      />

      <Contacts contacts={contacts} />
    </>
  );
}
