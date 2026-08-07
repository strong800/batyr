import { cn } from '@/lib/utils';

/**
 * Бейдж характеристики: капсула с рамкой, без заливки на светлом.
 * Никаких теней — глубина строится линией.
 */
export function Badge({
  children,
  onDark = false,
  className,
}: {
  children: React.ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2.5 py-1 font-sans text-badge uppercase tabularNums',
        onDark ? 'border-forestLine bg-forestSoft text-sand' : 'border-line text-inkMuted',
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Ряд бейджей: сам переносится, зазоры одинаковые. */
export function BadgeRow({
  items,
  onDark = false,
  className,
}: {
  items: (string | null | undefined)[];
  onDark?: boolean;
  className?: string;
}) {
  const visible = items.filter((item): item is string => Boolean(item));
  if (visible.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {visible.map((item) => (
        <Badge key={item} onDark={onDark}>
          {item}
        </Badge>
      ))}
    </div>
  );
}
