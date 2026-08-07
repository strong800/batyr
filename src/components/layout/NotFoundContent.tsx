import Link from 'next/link';
import { Container } from './Container';
import { Button } from '@/components/ui/Button';

const LINKS = [
  { href: '/works', label: 'Реализованные объекты' },
  { href: '/production', label: 'Производство бруса' },
  { href: '/#packages', label: 'Комплектации' },
  { href: '/#calc', label: 'Расчёт стоимости' },
];

/**
 * Содержимое страницы 404. Используется дважды: в not-found.tsx группы (site)
 * — когда notFound() вызывает страница проекта или объекта, и в корневом
 * not-found.tsx — когда адрес не совпал ни с одним маршрутом.
 */
export function NotFoundContent() {
  return (
    <div className="py-sectionSm md:py-sectionMd">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-sans text-nums uppercase text-inkMuted">Ошибка 404</p>
            <h1 className="mt-4 text-sectionTitle">Такой страницы нет</h1>
            <p className="mt-6 max-w-prose text-lead text-inkMuted">
              Возможно, проект убрали из каталога или в ссылке опечатка.
              Посмотрите каталог целиком — там все проекты и бани.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button href="/catalog" size="lg">
                Смотреть проекты
              </Button>
              <Button href="/" variant="outline" size="lg">
                На главную
              </Button>
            </div>
          </div>

          <nav aria-label="Разделы сайта" className="lg:col-span-4 lg:col-start-9">
            <h2 className="font-sans text-nums uppercase text-inkMuted">Куда ещё можно пойти</h2>
            <ul className="mt-5 flex flex-col border-t border-line">
              {LINKS.map((item) => (
                <li key={item.href} className="border-b border-line">
                  <Link
                    href={item.href}
                    className="flex min-h-14 items-center text-body text-ink transition-colors hover:text-ember"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </div>
  );
}
