import { cn } from '@/lib/utils';

/**
 * Контейнер контента: максимум 1440 и боковые поля 24 / 40 / 80.
 * Полноширинные фото тоже живут внутри него — «во всю ширину»
 * означает ширину контейнера, а не вьюпорта.
 */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-content px-gutterSm md:px-gutterMd lg:px-gutterLg', className)}>
      {children}
    </div>
  );
}
