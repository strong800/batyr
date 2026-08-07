'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { nav, ui } from '@/config/site';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { Container } from './Container';
import { trackEvent } from '@/lib/analyticsClient';

type HeaderProps = {
  phone: string;
  phoneRaw: string;
};

export function Header({ phone, phoneRaw }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Закрываем меню при переходе на другую страницу
  useEffect(() => setOpen(false), [pathname]);

  // Пока открыто мобильное меню, фон не скроллится
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-sm">
      <Container>
        <div className="flex h-20 items-center justify-between gap-6">
          <Logo />

          <nav aria-label="Основное меню" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {nav.main.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'font-sans text-badge uppercase transition-colors',
                      pathname === item.href ? 'text-ember' : 'text-ink hover:text-ember',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <a
              href={`tel:${phoneRaw}`}
              onClick={() => trackEvent('phoneClick', { place: 'header' })}
              className="hidden font-display text-[1.0625rem] font-medium tracking-wide text-ink transition-colors hover:text-ember md:inline-block"
            >
              {phone}
            </a>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobileMenu"
              aria-label={open ? ui.cta.close : 'Открыть меню'}
              className="flex h-11 w-11 items-center justify-center border border-line lg:hidden"
            >
              <span className="relative block h-3 w-5">
                <span
                  className={cn(
                    'absolute left-0 block h-px w-full bg-ink transition-transform duration-tab ease-calm',
                    open ? 'top-1.5 rotate-45' : 'top-0',
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 block h-px w-full bg-ink transition-transform duration-tab ease-calm',
                    open ? 'top-1.5 -rotate-45' : 'top-3',
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </Container>

      {/* Мобильное меню: спроектировано отдельно, а не сжатием десктопного */}
      {open && (
        <div id="mobileMenu" className="fixed inset-x-0 bottom-0 top-20 z-40 bg-paper lg:hidden">
          <Container className="flex h-full flex-col justify-between py-10">
            <nav aria-label="Мобильное меню">
              <ul className="flex flex-col gap-6">
                {nav.main.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="font-display text-[2rem] uppercase leading-none text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-line pt-6">
              <a
                href={`tel:${phoneRaw}`}
                onClick={() => trackEvent('phoneClick', { place: 'mobileMenu' })}
                className="font-display text-[1.5rem] tracking-wide text-ink"
              >
                {phone}
              </a>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
