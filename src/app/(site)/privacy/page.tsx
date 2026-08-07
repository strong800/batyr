import type { Metadata } from 'next';
import { getContacts, getLegal, getSettings } from '@/lib/settings';
import { siteMeta } from '@/config/site';
import { Container } from '@/components/layout/Container';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Политика обработки персональных данных',
  // Политику намеренно оставляем открытой для поиска: это публичный
  // документ, его ищут по названию компании, и закрывать его нечем оправдать
  robots: { index: true, follow: true },
  alternates: { canonical: '/privacy' },
};

/**
 * Типовая политика по 152-ФЗ. Реквизиты и контакты подставляются
 * из настроек, чтобы текст не расходился с футером.
 *
 * Это рабочий шаблон, а не документ, проверенный юристом:
 * перед публичным запуском его стоит вычитать. Отмечено в docs/dataGaps.md.
 */
export default async function PrivacyPage() {
  const settings = await getSettings();
  const contacts = getContacts(settings);
  const legal = getLegal(settings);

  const sections: { title: string; paragraphs: string[] }[] = [
    {
      title: '1. Общие положения',
      paragraphs: [
        `Настоящая политика определяет порядок обработки персональных данных ${legal.entityName} (ИНН ${legal.inn}, ОГРНИП ${legal.ogrnip}), далее — Оператор, и меры по обеспечению их безопасности.`,
        'Политика составлена в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».',
        'Оператор ставит важнейшей целью соблюдение прав и свобод человека при обработке его персональных данных, в том числе защиту права на неприкосновенность частной жизни.',
      ],
    },
    {
      title: '2. Какие данные собираются',
      paragraphs: [
        'Через формы на сайте Оператор получает: имя, номер телефона, адрес электронной почты (если указан), содержание комментария и файлы, которые пользователь прикрепил самостоятельно (эскизы, планировки).',
        'Автоматически собираются обезличенные технические данные: адрес страницы, источник перехода, параметры utm-меток, тип устройства и глубина просмотра страницы. Эти данные хранятся локально и не передаются третьим лицам.',
      ],
    },
    {
      title: '3. Зачем данные обрабатываются',
      paragraphs: [
        'Связаться с пользователем по оставленной заявке, подготовить расчёт стоимости, ответить на вопрос, согласовать проект дома.',
        'Обезличенные технические данные используются только для того, чтобы понимать, какие разделы сайта востребованы, и улучшать его.',
        'Оператор не использует данные для рассылок, не продаёт и не передаёт их третьим лицам.',
      ],
    },
    {
      title: '4. Основание обработки',
      paragraphs: [
        'Обработка ведётся на основании согласия, которое пользователь даёт, отмечая соответствующий чекбокс при отправке формы. Без отметки форма не отправляется.',
      ],
    },
    {
      title: '5. Хранение и защита',
      paragraphs: [
        'Данные хранятся на оборудовании Оператора и не размещаются в облачных сервисах.',
        'Оператор принимает организационные и технические меры, чтобы исключить неправомерный доступ к данным, их уничтожение, изменение и распространение.',
        'Данные хранятся не дольше, чем этого требуют цели обработки, либо до отзыва согласия.',
      ],
    },
    {
      title: '6. Права пользователя',
      paragraphs: [
        'Пользователь вправе получить сведения об обработке своих данных, потребовать их уточнения, блокирования или уничтожения, а также в любой момент отозвать согласие.',
        `Для этого достаточно написать или позвонить: ${contacts.phone}, ${contacts.telegram}.`,
        'Оператор прекращает обработку и уничтожает данные в течение тридцати дней с момента обращения.',
      ],
    },
    {
      title: '7. Файлы cookie',
      paragraphs: [
        'Сайт использует одну техническую cookie, чтобы отличать посетителей друг от друга в собственной статистике. Она не содержит персональных данных и не используется для рекламы.',
        'Если на сайте подключена Яндекс.Метрика, она устанавливает свои cookie в соответствии с политикой Яндекса.',
      ],
    },
    {
      title: '8. Изменения политики',
      paragraphs: [
        'Оператор вправе изменить настоящую политику. Действующая редакция всегда доступна на этой странице.',
      ],
    },
  ];

  return (
    <div className="py-sectionSm md:py-sectionMd">
      <Container>
        <header className="mb-12 lg:mb-16">
          <div className="mb-4 flex items-center gap-3 font-sans text-nums uppercase text-inkMuted">
            <span>Документы</span>
            <span aria-hidden className="h-px w-10 bg-line" />
          </div>
          <h1 className="max-w-[22ch] text-sectionTitle">
            Политика обработки персональных данных
          </h1>
        </header>

        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {sections.map((section) => (
              <section key={section.title} className="mb-10 border-t border-line pt-6">
                <h2 className="font-display text-[1.25rem] uppercase tracking-wide">
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index} className="mt-4 max-w-prose text-body text-inkMuted">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="border border-line bg-paperDeep p-6 lg:sticky lg:top-28">
              <h2 className="font-sans text-nums uppercase text-inkMuted">Оператор</h2>
              <p className="mt-4 text-body text-ink">{legal.entityName}</p>
              <dl className="mt-4 flex flex-col gap-2 text-body text-inkMuted">
                <div className="flex justify-between gap-4">
                  <dt>ИНН</dt>
                  <dd className="tabularNums text-ink">{legal.inn}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>ОГРНИП</dt>
                  <dd className="tabularNums text-ink">{legal.ogrnip}</dd>
                </div>
              </dl>
              <p className="mt-5 border-t border-line pt-5 text-body text-inkMuted">
                {contacts.address}
              </p>
              <a
                href={`tel:${contacts.phoneRaw}`}
                className="mt-2 block font-display text-[1.125rem] tracking-wide text-ink transition-colors hover:text-ember"
              >
                {contacts.phone}
              </a>
            </div>
          </aside>
        </div>

        <p className="mt-10 max-w-prose border-t border-line pt-6 text-badge normal-case text-inkMuted">
          {siteMeta.legalName}. Текст политики подготовлен по типовой форме и требует
          вычитки юристом перед публичным запуском сайта.
        </p>
      </Container>
    </div>
  );
}
