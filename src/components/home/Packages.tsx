import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { PackagesTabs, type PackageData } from '@/components/packages/PackagesTabs';

export function Packages({ packages }: { packages: PackageData[] }) {
  if (packages.length === 0) return null;

  return (
    <Section
      id="packages"
      num="03"
      title="Комплектации"
      lead="Три уровня готовности. У каждого пункта — короткое пояснение, зачем он нужен: список материалов без объяснений мало о чём говорит."
      dark
    >
      <Reveal>
        <PackagesTabs packages={packages} onDark />
      </Reveal>
    </Section>
  );
}
