'use client';

import { useReducedMotion } from 'framer-motion';

/**
 * Единая точка принятия решения о движении.
 *
 * Важно: при reduce мы не «делаем анимацию незаметной», а вообще не заводим
 * подписки на скролл и отдаём мгновенные варианты. Параллакс при этом
 * не вычисляется — ни одного лишнего пересчёта на кадр.
 */
export function useMotionPreference() {
  const prefersReduced = useReducedMotion();
  const animate = !prefersReduced;

  return {
    animate,
    /** Появление блока при скролле */
    reveal: animate
      ? {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-80px' },
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
        }
      : {},
    /** Появление элемента внутри сетки: задержка по индексу, максимум 6 шагов */
    revealItem: (index: number) =>
      animate
        ? {
            initial: { opacity: 0, y: 16 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: '-60px' },
            transition: {
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1] as const,
              delay: Math.min(index, 5) * 0.06,
            },
          }
        : {},
  };
}
