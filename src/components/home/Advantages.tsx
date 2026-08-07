import { advantages } from '@/config/content';
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { Picture, type PictureMedia } from '@/components/media/Picture';

/**
 * Преимущества поданы типографикой и одной фотографией, а не набором иконок.
 * Фото-плашка стоит на месте третьего пункта и ломает ритм колонок —
 * без неё полоса читается как обычный список.
 */
export function Advantages({ image }: { image: PictureMedia | null }) {
  return (
    <Section id="advantages" num="01" title="Почему нас выбирают">
      <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {advantages.slice(0, 2).map((item, i) => (
          <Reveal key={item.num} index={i} className="border-t border-line pt-6">
            <span className="font-sans text-nums uppercase tabularNums text-ember">{item.num}</span>
            <h3 className="mt-4 text-cardTitle">{item.title}</h3>
            <p className="mt-3 max-w-prose text-body text-inkMuted">{item.text}</p>
          </Reveal>
        ))}

        <Reveal index={2} className="md:col-span-2 lg:col-span-1 lg:row-span-2">
          <Picture
            media={image}
            ratio="plate"
            // До 1024px плашка занимает всю ширину, дальше — треть строки.
            // Верхний предел в пикселях нужен потому, что контейнер
            // упирается в 1440px и проценты выше этого врут.
            sizes="(max-width: 1024px) 100vw, (max-width: 1600px) 30vw, 440px"
            className="h-full"
          />
        </Reveal>

        {advantages.slice(2).map((item, i) => (
          <Reveal key={item.num} index={i + 3} className="border-t border-line pt-6">
            <span className="font-sans text-nums uppercase tabularNums text-ember">{item.num}</span>
            <h3 className="mt-4 text-cardTitle">{item.title}</h3>
            <p className="mt-3 max-w-prose text-body text-inkMuted">{item.text}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
