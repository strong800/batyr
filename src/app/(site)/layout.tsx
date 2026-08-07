import { Suspense } from 'react';
import { getContacts, getLegal, getSettings } from '@/lib/settings';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Tracker } from '@/components/analytics/Tracker';
import { YandexMetrika } from '@/components/analytics/YandexMetrika';

export const dynamic = 'force-dynamic';

/** Публичная часть сайта: шапка, контент, футер, счётчики. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const contacts = getContacts(settings);
  const legal = getLegal(settings);
  const metrikaId = settings.get('integrations.metrikaId')?.trim() || '';

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-forest focus:px-4 focus:py-3 focus:text-paper"
      >
        Перейти к содержимому
      </a>

      <Header phone={contacts.phone} phoneRaw={contacts.phoneRaw} />

      <main id="main">{children}</main>

      <Footer contacts={contacts} legal={legal} />

      <Suspense fallback={null}>
        <Tracker />
      </Suspense>

      {/* Место под Яндекс.Метрику: номер счётчика задаётся в админке */}
      <YandexMetrika counterId={metrikaId} />
    </>
  );
}
