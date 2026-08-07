import Link from 'next/link';
import { ui } from '@/config/site';
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/Button';
import { Picture, type PictureMedia } from '@/components/media/Picture';
import { BadgeRow } from '@/components/ui/Badge';

export type WorkCardData = {
  slug: string;
  title: string;
  facadeColor: string | null;
  location: string | null;
  durationText: string | null;
  photoCount: number;
  cover: PictureMedia | null;
};

export function WorksPreview({ works }: { works: WorkCardData[] }) {
  if (works.length === 0) return null;

  return (
    <Section
      id="works"
      num="05"
      title="Наши объекты"
      lead="Дома, которые уже стоят. Те же проекты в разных цветах фасада, интерьеры после сдачи и то, как выглядит тёплый контур изнутри."
      action={
        <div>
          <Button href="/works" variant="outline">
            {ui.cta.allWorks}
          </Button>
        </div>
      }
    >
      <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {works.map((work, i) => (
          <Reveal key={work.slug} index={i}>
            <Link href={`/works/${work.slug}`} className="group block focus-visible:outline-offset-4">
              <article>
                <Picture
                  media={work.cover}
                  ratio="plate"
                  className="transition-colors duration-hover ease-calm group-hover:border-ink"
                  imageClassName="transition-transform duration-hover ease-calm group-hover:scale-[1.03]"
                />
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h3 className="text-cardTitle transition-colors group-hover:text-ember">
                    {work.title}
                  </h3>
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
                    work.facadeColor,
                    work.durationText,
                    work.photoCount > 1 ? `${work.photoCount} фото` : null,
                  ]}
                />
              </article>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
