import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { Picture, type PictureMedia } from '@/components/media/Picture';
import { toParagraphs } from '@/lib/utils';

export function Founder({
  name,
  role,
  text,
  photo,
}: {
  name: string;
  role: string;
  text: string;
  photo: PictureMedia | null;
}) {
  const paragraphs = toParagraphs(text);
  if (paragraphs.length === 0) return null;

  return (
    <Section id="founder" num="07" title="Об основателе">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <Reveal className="lg:col-span-5">
          <Picture
            media={photo}
            ratio="plate"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
        </Reveal>

        <div className="flex flex-col justify-center lg:col-span-6 lg:col-start-7">
          {paragraphs.map((paragraph, i) => (
            <Reveal key={i} index={i}>
              <p className="mb-5 max-w-prose text-lead text-ink">{paragraph}</p>
            </Reveal>
          ))}

          <Reveal index={paragraphs.length} className="mt-6 border-t border-line pt-6">
            <p className="font-display text-[1.375rem] uppercase tracking-wide">{name}</p>
            <p className="mt-1 font-sans text-badge uppercase text-inkMuted">{role}</p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
