import Link from 'next/link';
import { nav, siteMeta } from '@/config/site';
import type { Contacts, Legal } from '@/lib/settings';
import { Container } from './Container';
import { Logo } from './Logo';
import { ContactLinks } from '@/components/contacts/ContactLinks';

export function Footer({ contacts, legal }: { contacts: Contacts; legal: Legal }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-forest text-paper">
      <Container>
        <div className="grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-4">
            <Logo onDark />
            <p className="mt-6 max-w-prose text-body text-sand">{siteMeta.description}</p>
          </div>

          <nav aria-label="Разделы сайта" className="lg:col-span-4 lg:col-start-6">
            <h3 className="mb-5 font-sans text-nums uppercase text-timberLight">Разделы</h3>
            {/* min-h-11 = 44px: строка текста даёт 19px, пальцем не попасть.
                Отрицательный отступ сверху компенсирует прибавку по высоте,
                чтобы ритм списка не поехал */}
            <ul className="-mt-2 flex flex-col">
              {nav.footer.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-body text-paper transition-colors hover:text-emberOnDark"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3 lg:col-start-10">
            <h3 className="mb-5 font-sans text-nums uppercase text-timberLight">Контакты</h3>
            <ContactLinks contacts={contacts} onDark place="footer" />
          </div>
        </div>

        <div className="border-t border-forestLine py-8">
          <div className="flex flex-col gap-3 text-badge uppercase text-sand md:flex-row md:items-start md:justify-between">
            <div>
              <p>
                © {year} {siteMeta.legalName}
              </p>
              {/* Реквизиты: обязательны для оферты и политики обработки данных */}
              <p className="mt-2 normal-case tracking-normal text-sand/80">
                {legal.entityName}
              </p>
              <p className="mt-1 tabularNums normal-case tracking-normal text-sand/80">
                ИНН {legal.inn} · ОГРНИП {legal.ogrnip}
              </p>
            </div>

            <div className="max-w-prose md:text-right">
              <p className="normal-case tracking-normal">
                Информация на сайте не является публичной офертой. Цены предварительные.
              </p>
              <Link
                href="/privacy"
                className="mt-1 inline-flex min-h-11 items-center normal-case tracking-normal underline underline-offset-4 transition-colors hover:text-emberOnDark md:justify-end"
              >
                Политика обработки персональных данных
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
