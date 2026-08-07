'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEvent, trackPageView } from '@/lib/analyticsClient';

const DEPTH_STEPS = [25, 50, 75, 100] as const;

/**
 * Просмотры страниц и глубина скролла.
 * Ставится один раз в layout, дальше работает сам.
 */
export function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  // Просмотр страницы
  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    trackPageView(pathname, document.title);
  }, [pathname, searchParams]);

  // Глубина скролла: каждый порог отправляем один раз на страницу
  useEffect(() => {
    const reached = new Set<number>();

    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const percent = Math.round((window.scrollY / scrollable) * 100);

      for (const step of DEPTH_STEPS) {
        if (percent >= step && !reached.has(step)) {
          reached.add(step);
          trackEvent('scrollDepth', { depth: step, path: pathname ?? '' });
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  return null;
}
