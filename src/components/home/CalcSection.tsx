import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { Calculator, type CalcProjectOption } from '@/components/calc/Calculator';
import type { CalcParams } from '@/lib/calc';

export function CalcSection({
  projects,
  params,
  hasStubs,
  telegram,
}: {
  projects: CalcProjectOption[];
  params: CalcParams;
  hasStubs: boolean;
  telegram: string;
}) {
  return (
    <Section
      id="calc"
      num="09"
      title="Расчёт стоимости"
      lead="Выберите проект и уровень готовности — покажем ориентир по цене. Никаких таймеров и «предложение сгорает через 15 минут»."
      dark
    >
      <Reveal>
        <Calculator
          projects={projects}
          params={params}
          hasStubs={hasStubs}
          telegram={telegram}
        />
      </Reveal>
    </Section>
  );
}
