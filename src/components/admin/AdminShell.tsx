'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { siteMeta } from '@/config/site';

const NAV = [
  { group: 'Контент', items: [
    { href: '/admin/projects', label: 'Проекты каталога' },
    { href: '/admin/works', label: 'Реализованные объекты' },
    { href: '/admin/packages', label: 'Комплектации' },
    { href: '/admin/stages', label: 'Этапы работы' },
    { href: '/admin/reviews', label: 'Отзывы' },
  ]},
  { group: 'Настройки', items: [
    { href: '/admin/settings', label: 'Тексты и контакты' },
    { href: '/admin/calc', label: 'Калькулятор' },
  ]},
  { group: 'Работа', items: [
    { href: '/admin/leads', label: 'Заявки' },
    { href: '/admin/analytics', label: 'Аналитика' },
  ]},
] as const;

export function AdminShell({ login, children }: { login: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav aria-label="Разделы админки" className="flex flex-col gap-7">
      {NAV.map((section) => (
        <div key={section.group}>
          <p className="mb-3 font-sans text-nums uppercase text-inkMuted">{section.group}</p>
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block rounded px-3 py-2 text-body transition-colors',
                      active ? 'bg-sand text-ink' : 'text-inkMuted hover:bg-paperDeep hover:text-ink',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-paper">
        <div className="flex h-16 items-center justify-between gap-4 px-5 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="h-10 rounded border border-line px-3 font-sans text-badge uppercase lg:hidden"
            >
              Меню
            </button>
            <Link href="/admin" className="font-display text-[1.125rem] uppercase tracking-wide">
              {siteMeta.name} · админка
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden font-sans text-badge uppercase text-inkMuted transition-colors hover:text-ember sm:inline"
            >
              Открыть сайт ↗
            </Link>
            <span className="hidden font-sans text-badge uppercase text-inkMuted md:inline">
              {login}
            </span>
            <form action="/api/admin/logout" method="post">
              <button
                type="submit"
                className="h-10 rounded border border-line px-4 font-sans text-badge uppercase text-inkMuted transition-colors hover:border-ink hover:text-ink"
              >
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[100rem] gap-10 px-5 py-8 lg:px-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">{nav}</div>
        </aside>

        {open && (
          <div className="fixed inset-x-0 bottom-0 top-16 z-30 overflow-y-auto bg-paper px-5 py-8 lg:hidden">
            {nav}
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
