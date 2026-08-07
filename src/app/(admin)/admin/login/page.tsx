import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { checkCredentials, createSessionToken, setSessionCookie } from '@/lib/auth';
import { siteMeta } from '@/config/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Вход в админку',
  robots: { index: false, follow: false },
};

/**
 * Вход по логину и паролю из .env.local.
 * Обычная форма без клиентского JS: одно поле, одна кнопка, работает всегда.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  async function signIn(formData: FormData) {
    'use server';

    const login = String(formData.get('login') ?? '');
    const password = String(formData.get('password') ?? '');
    const next = String(formData.get('next') ?? '') || '/admin';

    if (!checkCredentials(login, password)) {
      const back = new URLSearchParams({ error: '1' });
      if (next && next !== '/admin') back.set('next', next);
      redirect(`/admin/login?${back.toString()}`);
    }

    const token = await createSessionToken(login);
    await setSessionCookie(token);
    // Переходим только по внутреннему пути — чужой адрес в next не пройдёт
    redirect(next.startsWith('/admin') ? next : '/admin');
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-gutterSm py-16">
      <div className="w-full max-w-sm">
        <p className="font-sans text-nums uppercase text-inkMuted">{siteMeta.name}</p>
        <h1 className="mt-3 text-sectionTitle">Админка</h1>

        <form action={signIn} className="mt-10 flex flex-col gap-5">
          <input type="hidden" name="next" value={params.next ?? '/admin'} />

          <div>
            <label htmlFor="login" className="mb-2 block font-sans text-badge uppercase text-inkMuted">
              Логин
            </label>
            <input
              id="login"
              name="login"
              autoComplete="username"
              required
              autoFocus
              className="h-12 w-full rounded border border-line bg-transparent px-4 text-body focus:border-ink"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-sans text-badge uppercase text-inkMuted"
            >
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-12 w-full rounded border border-line bg-transparent px-4 text-body focus:border-ink"
            />
          </div>

          {params.error && (
            <p role="alert" className="text-badge text-ember">
              Неверный логин или пароль
            </p>
          )}

          <button
            type="submit"
            className="mt-2 h-12 rounded bg-forest px-6 font-sans text-badge uppercase text-paper transition-colors hover:bg-forestSoft"
          >
            Войти
          </button>
        </form>

        <p className="mt-8 text-badge text-inkMuted">
          Логин и пароль задаются в файле <code>.env.local</code> переменными
          ADMIN_LOGIN и ADMIN_PASSWORD.
        </p>
      </div>
    </div>
  );
}
