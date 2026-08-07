import { cn } from '@/lib/utils';
import { Container } from './Container';
import { Reveal } from '@/components/motion/Reveal';

type SectionProps = {
  id?: string;
  /** Номер секции, как в печатном каталоге: 01, 02… */
  num?: string;
  title?: string;
  /** Короткая строка под заголовком */
  lead?: string;
  /** Тёмная секция на хвойном фоне */
  dark?: boolean;
  /** Второй тон светлого фона для чередования */
  deep?: boolean;
  className?: string;
  /** Ссылка-действие справа от заголовка */
  action?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Каркас секции с асимметричной сеткой 4/8.
 * Заголовок живёт в левых 4 колонках, контент — в правых 8.
 */
export function Section({
  id,
  num,
  title,
  lead,
  dark = false,
  deep = false,
  className,
  action,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'py-sectionSm md:py-sectionMd lg:py-sectionLg',
        dark && 'bg-forest text-paper',
        !dark && deep && 'bg-paperDeep',
        className,
      )}
    >
      <Container>
        {(num || title) && (
          <Reveal className="mb-10 grid gap-6 md:mb-14 lg:mb-20 lg:grid-cols-12">
            {/* min-w-0 + 6 колонок: заголовки вроде «Индивидуальный проект»
                не помещались в 5 колонок и вылезали за свой блок */}
            <div className="min-w-0 lg:col-span-6">
              {num && (
                <div
                  className={cn(
                    'mb-4 flex items-center gap-3 font-sans text-nums uppercase tabularNums',
                    dark ? 'text-timberLight' : 'text-inkMuted',
                  )}
                >
                  <span>{num}</span>
                  <span
                    aria-hidden
                    className={cn('h-px w-10', dark ? 'bg-forestLine' : 'bg-line')}
                  />
                </div>
              )}
              {title && (
                <h2 className="hyphens-auto break-words text-sectionTitle" lang="ru">
                  {title}
                </h2>
              )}
            </div>

            {(lead || action) && (
              <div className="flex flex-col justify-end gap-6 lg:col-span-6 lg:col-start-7">
                {lead && (
                  <p className={cn('max-w-prose text-lead', dark ? 'text-sand' : 'text-inkMuted')}>
                    {lead}
                  </p>
                )}
                {action}
              </div>
            )}
          </Reveal>
        )}
        {children}
      </Container>
    </section>
  );
}
