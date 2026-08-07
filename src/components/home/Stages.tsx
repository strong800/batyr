import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';

export type StageData = {
  id: string;
  title: string;
  text: string | null;
  durationText: string | null;
};

/**
 * Горизонтальный таймлайн: на десктопе лента с прокруткой,
 * на мобильном — та же лента со снапом по карточкам.
 * Линия набрана древесным цветом, точка шага — акцентом.
 */
export function Stages({ stages }: { stages: StageData[] }) {
  if (stages.length === 0) return null;

  return (
    <Section
      id="stages"
      num="06"
      title="Как мы работаем"
      lead="От первого разговора до передачи ключей. Сроки на каждом шаге зависят от проекта — на созвоне называем конкретные даты."
      deep
    >
      <Reveal>
        <ol
          className="scrollRail -mx-gutterSm flex snap-x snap-mandatory gap-6 overflow-x-auto px-gutterSm pb-4 md:mx-0 md:px-0"
          aria-label="Этапы работы"
        >
          {stages.map((stage, i) => (
            <li
              key={stage.id}
              className="w-[76vw] shrink-0 snap-start sm:w-[46vw] md:w-[32vw] lg:w-[21rem]"
            >
              {/* Линия с точкой шага */}
              <div className="relative mb-5 flex items-center">
                <span aria-hidden className="h-px w-full bg-timber/40" />
                <span
                  aria-hidden
                  className="absolute left-0 h-2 w-2 -translate-x-px rounded-full bg-ember"
                />
              </div>

              <span className="font-sans text-nums uppercase tabularNums text-inkMuted">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 text-cardTitle">{stage.title}</h3>
              {stage.text && <p className="mt-3 text-body text-inkMuted">{stage.text}</p>}
              {stage.durationText && (
                <p className="mt-4 font-sans text-badge uppercase text-ember">
                  {stage.durationText}
                </p>
              )}
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}
