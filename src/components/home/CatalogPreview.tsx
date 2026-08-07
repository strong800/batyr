import { ui } from '@/config/site';
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/Button';
import { ProjectCard, type ProjectCardData } from '@/components/catalog/ProjectCard';

export function CatalogPreview({ projects }: { projects: ProjectCardData[] }) {
  if (projects.length === 0) return null;

  return (
    <Section
      id="catalog"
      num="02"
      title="Проекты"
      lead="Площади и планировки взяты из реализованных объектов, а не нарисованы для каталога. Каждый дом на фотографиях — построенный."
      deep
      action={
        <div>
          <Button href="/catalog" variant="outline">
            {ui.cta.allProjects}
          </Button>
        </div>
      }
    >
      <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, i) => (
          <Reveal key={project.slug} index={i}>
            <ProjectCard project={project} index={i} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
