import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'solid' | 'outline' | 'sand' | 'ghost';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded font-sans text-badge uppercase transition-colors duration-tab ease-calm disabled:cursor-not-allowed disabled:opacity-50';

const sizes: Record<Size, string> = {
  md: 'h-11 px-5',
  lg: 'h-14 px-7',
};

/**
 * Основная кнопка намеренно не акцентная, а хвойная:
 * акцентный цвет расходуется только на пять оговорённых мест,
 * иначе он перестаёт быть акцентом.
 */
const variants: Record<Variant, string> = {
  solid: 'bg-forest text-paper hover:bg-forestSoft',
  sand: 'bg-sand text-ink hover:bg-paperDeep',
  outline: 'border border-line text-ink hover:border-ink',
  ghost: 'text-ink hover:text-ember',
};

const darkVariants: Partial<Record<Variant, string>> = {
  outline: 'border border-forestLine text-paper hover:border-sand',
  ghost: 'text-paper hover:text-emberOnDark',
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  /** Кнопка стоит на тёмной секции */
  onDark?: boolean;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsLink = CommonProps & {
  href: string;
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'className' | 'children'>;

type ButtonAsButton = CommonProps & {
  href?: undefined;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = 'solid', size = 'md', onDark = false, className, children } = props;

  const classes = cn(
    base,
    sizes[size],
    (onDark && darkVariants[variant]) || variants[variant],
    className,
  );

  if (props.href !== undefined) {
    const { href, variant: _v, size: _s, onDark: _d, className: _c, children: _ch, ...rest } = props;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, onDark: _d, className: _c, children: _ch, ...rest } = props;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
