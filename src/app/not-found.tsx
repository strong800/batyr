import type { Metadata } from 'next';
import { getContacts, getLegal, getSettings } from '@/lib/settings';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NotFoundContent } from '@/components/layout/NotFoundContent';

export const metadata: Metadata = {
  title: 'Страница не найдена',
  robots: { index: false, follow: true },
};

/**
 * 404 для адресов, не совпавших ни с одним маршрутом.
 *
 * Корневой not-found рендерится вне группы (site), поэтому шапку и футер
 * подключаем здесь вручную — иначе Next показывает голую страницу
 * без навигации, и человек упирается в тупик.
 */
export default async function RootNotFound() {
  const settings = await getSettings();
  const contacts = getContacts(settings);
  const legal = getLegal(settings);

  return (
    <>
      <Header phone={contacts.phone} phoneRaw={contacts.phoneRaw} />
      <main id="main">
        <NotFoundContent />
      </main>
      <Footer contacts={contacts} legal={legal} />
    </>
  );
}
