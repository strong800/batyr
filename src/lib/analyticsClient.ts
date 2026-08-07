'use client';

import type { AnalyticsEvent } from './enums';

/**
 * Сбор событий без внешних сервисов: всё уходит в свой /api/analytics
 * и ложится в локальную SQLite.
 *
 * Отправка намеренно «тихая»: sendBeacon там, где он есть, keepalive-fetch
 * как запасной вариант, ошибки гасятся. Аналитика не должна ломать страницу.
 */

type Meta = Record<string, string | number | boolean | null | undefined>;

function post(path: string, payload: unknown): void {
  try {
    const body = JSON.stringify(payload);

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(path, blob)) return;
    }

    void fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      /* аналитика не должна мешать работе сайта */
    });
  } catch {
    /* то же самое */
  }
}

export function trackEvent(name: AnalyticsEvent, meta?: Meta): void {
  if (typeof window === 'undefined') return;
  post('/api/analytics/event', {
    name,
    path: window.location.pathname,
    meta: meta ? JSON.stringify(meta) : undefined,
  });
}

export function trackPageView(path: string, title?: string): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  post('/api/analytics/pageview', {
    path,
    title,
    referrer: document.referrer || undefined,
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
    utmContent: params.get('utm_content') ?? undefined,
    utmTerm: params.get('utm_term') ?? undefined,
    screenWidth: window.innerWidth,
  });
}
