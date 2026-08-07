'use client';

import { motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';

type RevealProps = {
  /** Индекс в сетке — задаёт задержку стаггера */
  index?: number;
  as?: 'div' | 'li' | 'article';
  className?: string;
  children: React.ReactNode;
};

/**
 * Появление при скролле: прозрачность и сдвиг на 16px, один раз.
 * При prefers-reduced-motion анимация не создаётся — возвращается обычный тег.
 */
export function Reveal({ index, as = 'div', className, children }: RevealProps) {
  const { animate, reveal, revealItem } = useMotionPreference();
  const props = index === undefined ? reveal : revealItem(index);

  if (!animate) {
    if (as === 'li') return <li className={className}>{children}</li>;
    if (as === 'article') return <article className={className}>{children}</article>;
    return <div className={className}>{children}</div>;
  }

  if (as === 'li') {
    return (
      <motion.li className={className} {...props}>
        {children}
      </motion.li>
    );
  }

  if (as === 'article') {
    return (
      <motion.article className={className} {...props}>
        {children}
      </motion.article>
    );
  }

  return (
    <motion.div className={className} {...props}>
      {children}
    </motion.div>
  );
}
