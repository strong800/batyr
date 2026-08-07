import Link from 'next/link';
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { toParagraphs } from '@/lib/utils';
import type { MediaLite } from '@/lib/media';

type ProductionProps = {
  title: string;
  text: string;
  tech: { title: string; text: string }[];
  video: MediaLite | null;
};

/**
 * Самая тёмная секция сайта.
 *
 * Видео стоит в родном вертикальном формате — оно так снято, и растягивать
 * его в 16:9 значит либо обрезать, либо добавлять чёрные поля.
 *
 * Ленты стоп-кадров здесь нет: на них вшиты субтитры из ролика,
 * и полоса читалась как набор скриншотов из соцсети. Сами кадры
 * остались на странице /production.
 */
export function Production({ title, text, tech, video }: ProductionProps) {
  const paragraphs = toParagraphs(text);

  return (
    <Section
      id="production"
      num="04"
      title={title}
      dark
      action={
        <div>
          <Link
            href="/production"
            className="inline-flex min-h-11 items-center font-sans text-badge uppercase text-emberOnDark underline decoration-1 underline-offset-4"
          >
            Подробно о технологии
          </Link>
        </div>
      }
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        {video && (
          <Reveal className="lg:col-span-5">
            <VideoPlayer
              src={video.src}
              poster={video.poster}
              title="Как мы делаем брус"
              ratio="vertical"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <p className="mt-4 text-badge uppercase text-timberLight">
              Экскурсия по цеху · 40 секунд
            </p>
          </Reveal>
        )}

        <div className={video ? 'lg:col-span-6 lg:col-start-7' : 'lg:col-span-8'}>
          {paragraphs.map((paragraph, i) => (
            <Reveal key={i} index={i}>
              <p className="mb-5 max-w-prose text-lead text-sand">{paragraph}</p>
            </Reveal>
          ))}

          {tech.length > 0 && (
            <ul className="mt-10">
              {tech.map((item, i) => (
                <Reveal
                  key={item.title}
                  as="li"
                  index={i}
                  className="border-t border-forestLine py-5"
                >
                  <h3 className="font-display text-[1.0625rem] uppercase tracking-wide text-paper">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-prose text-body text-sand">{item.text}</p>
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </div>

    </Section>
  );
}
