'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analyticsClient';

/**
 * Событие «открытие проекта» — второй шаг воронки
 * «просмотр каталога → открытие проекта → отправка заявки».
 */
export function ProjectViewTracker({ slug, title }: { slug: string; title: string }) {
  useEffect(() => {
    trackEvent('projectView', { slug, title, place: 'page' });
  }, [slug, title]);

  return null;
}
