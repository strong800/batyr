import { customProjectNeeds } from '@/config/content';
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { LeadForm } from '@/components/forms/LeadForm';
import { toParagraphs } from '@/lib/utils';

export function CustomProject({
  title,
  text,
  steps,
  telegram,
}: {
  title: string;
  text: string;
  steps: { title: string; text: string }[];
  telegram: string;
}) {
  const paragraphs = toParagraphs(text);

  return (
    <Section id="custom" title={title} deep>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5">
          {paragraphs.map((paragraph, i) => (
            <Reveal key={i} index={i}>
              <p className="mb-5 max-w-prose text-lead text-inkMuted">{paragraph}</p>
            </Reveal>
          ))}

          {steps.length > 0 && (
            <ol className="mt-8">
              {steps.map((step, i) => (
                <Reveal key={step.title} as="li" index={i} className="border-t border-line py-5">
                  <span className="font-sans text-nums uppercase tabularNums text-ember">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-2 font-display text-[1.0625rem] uppercase tracking-wide">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-prose text-body text-inkMuted">{step.text}</p>
                </Reveal>
              ))}
            </ol>
          )}

          <Reveal className="mt-8 border-t border-line pt-6">
            <h3 className="font-sans text-nums uppercase text-inkMuted">Что понадобится от вас</h3>
            <ul className="mt-4 flex flex-col gap-2">
              {customProjectNeeds.map((need) => (
                <li key={need} className="flex gap-3 text-body text-ink">
                  <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-timber" />
                  {need}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal className="lg:col-span-6 lg:col-start-7">
          <div className="border border-line bg-paper p-7 lg:p-10">
            <h3 className="text-cardTitle">Расскажите про свой проект</h3>
            <p className="mt-3 max-w-prose text-body text-inkMuted">
              Приложите эскиз или планировку, если они уже есть.
            </p>
            <LeadForm
              type="CUSTOM"
              telegram={telegram}
              withCustomFields
              submitLabel="Отправить на расчёт"
              className="mt-7"
            />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
