import Image from 'next/image';
import { cn } from '@/lib/utils';

export type PictureMedia = {
  src: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  blurDataUrl?: string | null;
};

type PictureProps = {
  media: PictureMedia | null | undefined;
  /** Соотношение рамки. По умолчанию 4:5 — родной формат всех фото из папки. */
  ratio?: 'plate' | 'vertical' | 'wide' | 'free';
  /** Первый экран: убирает ленивую загрузку и повышает приоритет */
  priority?: boolean;
  sizes?: string;
  className?: string;
  imageClassName?: string;
  onDark?: boolean;
};

const ratioClass: Record<NonNullable<PictureProps['ratio']>, string> = {
  plate: 'aspect-plate',
  vertical: 'aspect-vertical',
  wide: 'aspect-[16/9]',
  free: '',
};

/**
 * Фотография как печатная плашка: рамка 1px, без теней и затемнений.
 *
 * Поверх изображения ничего не рисуется — на снимках компании уже есть
 * собственная типографика, и вторая поверх неё сталкивается с первой.
 * Подписи и характеристики выводятся рядом с плашкой, а не на ней.
 */
export function Picture({
  media,
  ratio = 'plate',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw',
  className,
  imageClassName,
  onDark = false,
}: PictureProps) {
  if (!media?.src) {
    return (
      <div
        className={cn(
          onDark ? 'plateOnDark' : 'plate',
          ratioClass[ratio],
          'flex items-center justify-center',
          className,
        )}
        aria-hidden
      />
    );
  }

  return (
    <div className={cn(onDark ? 'plateOnDark' : 'plate', ratioClass[ratio], className)}>
      <Image
        src={media.src}
        alt={media.alt ?? ''}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        placeholder={media.blurDataUrl ? 'blur' : 'empty'}
        blurDataURL={media.blurDataUrl ?? undefined}
        className={cn('object-cover', imageClassName)}
      />
    </div>
  );
}
