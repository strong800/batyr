import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Админка', template: '%s — админка' },
  robots: { index: false, follow: false },
};

/**
 * Каркас админки. Страница входа рисуется без меню — на ней ещё нет сессии.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) return <main>{children}</main>;

  return <AdminShell login={session.login}>{children}</AdminShell>;
}
