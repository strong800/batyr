import Link from 'next/link';
import { cn } from '@/lib/utils';
import { siteMeta } from '@/config/site';

/**
 * Логотип набран типографикой: вектора у компании нет, есть только растр
 * на титульном слайде презентации. См. docs/dataGaps.md, п. D4.
 */
export function Logo({
  onDark = false,
  className,
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    // aria-label не задаём: он не содержал видимый текст целиком, и это
    // нарушало «Label in Name» (WCAG 2.5.3) — человек, управляющий голосом,
    // говорит то, что видит. Доступное имя собирается из самих надписей
    // плюс скрытое уточнение.
    <Link
      href="/"
      className={cn('group inline-flex min-h-11 flex-col justify-center leading-none', className)}
    >
      <span
        className={cn(
          'font-display text-[1.375rem] font-semibold uppercase tracking-[0.06em] transition-colors',
          onDark ? 'text-paper group-hover:text-sand' : 'text-ink group-hover:text-ember',
        )}
      >
        {siteMeta.name}
      </span>
      <span
        className={cn(
          'mt-0.5 font-sans text-[0.5625rem] uppercase tracking-[0.22em]',
          onDark ? 'text-timberLight' : 'text-inkMuted',
        )}
      >
        группа компаний
      </span>
      <span className="sr-only"> — на главную</span>
    </Link>
  );
}
