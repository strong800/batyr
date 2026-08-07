'use client';

import { useEffect, useRef, useState } from 'react';
import { ui } from '@/config/site';
import { cn } from '@/lib/utils';

type YandexMapProps = {
  lat: number;
  lon: number;
  zoom: number;
  address: string;
  title: string;
};

declare global {
  interface Window {
    ymaps?: {
      ready: (callback: () => void) => void;
      Map: new (element: HTMLElement, options: unknown, extra?: unknown) => {
        geoObjects: { add: (object: unknown) => void };
        behaviors: { disable: (name: string) => void };
      };
      Placemark: new (
        coords: [number, number],
        properties: unknown,
        options: unknown,
      ) => unknown;
    };
  }
}

/**
 * Карта Яндекса через JS API.
 *
 * Без ключа карта не подключается вовсе: показываем статичный блок
 * с адресом и ссылкой на Яндекс.Карты. Вёрстка при этом не ломается,
 * ни одного запроса к внешнему домену не уходит.
 */
export function YandexMap({ lat, lon, zoom, address, title }: YandexMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY?.trim();
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  const routeUrl = `https://yandex.ru/maps/?rtext=~${lat},${lon}&rtt=auto`;
  const placeUrl = `https://yandex.ru/maps/?pt=${lon},${lat}&z=${zoom}&l=map`;

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;

    let cancelled = false;
    const scriptId = 'yandexMapsApi';

    function initMap() {
      if (cancelled || !containerRef.current || !window.ymaps) return;
      try {
        window.ymaps.ready(() => {
          if (cancelled || !containerRef.current || !window.ymaps) return;
          const map = new window.ymaps.Map(
            containerRef.current,
            { center: [lat, lon], zoom, controls: ['zoomControl'] },
            { suppressMapOpenBlock: true },
          );
          // Прокрутка страницы важнее зума карты
          map.behaviors.disable('scrollZoom');

          const placemark = new window.ymaps.Placemark(
            [lat, lon],
            { balloonContentHeader: title, balloonContentBody: address },
            {
              // Кастомная метка в палитре сайта
              iconLayout: 'default#imageWithContent',
              iconImageHref:
                'data:image/svg+xml;charset=utf-8,' +
                encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
                     <path d="M17 0C7.6 0 0 7.6 0 17c0 12.2 17 27 17 27s17-14.8 17-27C34 7.6 26.4 0 17 0z" fill="#16241D"/>
                     <circle cx="17" cy="17" r="6" fill="#E08A4F"/>
                   </svg>`,
                ),
              iconImageSize: [34, 44],
              iconImageOffset: [-17, -44],
            },
          );
          map.geoObjects.add(placemark);
        });
      } catch (error) {
        console.error('[map] инициализация:', error);
        setFailed(true);
      }
    }

    if (window.ymaps) {
      initMap();
      return;
    }

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', initMap);
      return () => existing.removeEventListener('load', initMap);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.async = true;
    script.onload = initMap;
    script.onerror = () => {
      console.error('[map] не удалось загрузить Яндекс.Карты');
      setFailed(true);
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [apiKey, lat, lon, zoom, address, title]);

  // Фолбэк: нет ключа или карта не загрузилась
  if (!apiKey || failed) {
    return (
      <div className="plateOnDark flex aspect-[4/3] flex-col justify-end p-8 lg:aspect-[3/2]">
        <p className="font-display text-[1.375rem] uppercase tracking-wide text-paper">{title}</p>
        <p className="mt-2 max-w-prose text-body text-sand">{address}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={placeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded border border-forestLine px-5 font-sans text-badge uppercase text-paper transition-colors hover:border-sand"
          >
            Открыть на Яндекс.Картах
          </a>
          <a
            href={routeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center rounded bg-sand px-5 font-sans text-badge uppercase text-ink transition-colors hover:bg-paperDeep"
          >
            {ui.cta.route}
          </a>
        </div>
        {!apiKey && (
          <p className="mt-5 text-badge text-sand/60">
            Интерактивная карта включится, когда в .env.local появится ключ Яндекс.Карт.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={cn('aspect-[4/3] w-full border border-forestLine lg:aspect-[3/2]')}
        role="application"
        aria-label={`Карта: ${address}`}
      />
      <a
        href={routeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 left-4 inline-flex h-11 items-center rounded bg-sand px-5 font-sans text-badge uppercase text-ink transition-colors hover:bg-paperDeep"
      >
        {ui.cta.route}
      </a>
    </div>
  );
}
