import type { Metadata, Viewport } from 'next';
import './globals.css';

import { siteMeta } from '@/config/site';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteMeta.legalName} — ${siteMeta.tagline.toLowerCase()} в Уфе`,
    template: `%s — ${siteMeta.name}`,
  },
  description: siteMeta.description,
  openGraph: {
    type: 'website',
    locale: siteMeta.locale,
    siteName: siteMeta.legalName,
    title: `${siteMeta.legalName} — ${siteMeta.tagline.toLowerCase()}`,
    description: siteMeta.description,
  },
  robots: { index: true, follow: true },
};

/**
 * Контент читается из локальной SQLite и меняется из админки,
 * поэтому статический пререндер здесь не нужен: иначе правки
 * появлялись бы на сайте только после пересборки.
 */
export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: '#16241D',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Корневой каркас: только html, body и шрифты.
 * Шапка с футером живут в группе (site), у админки своё оформление.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        {/* Кириллические начертания нужны сразу — предзагружаем именно их */}
        <link
          rel="preload"
          href="/fonts/oswald-cyrillic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/golos-text-cyrillic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
