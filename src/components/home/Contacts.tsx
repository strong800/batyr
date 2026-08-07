import { siteMeta } from '@/config/site';
import type { Contacts as ContactsData } from '@/lib/settings';
import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { ContactLinks } from '@/components/contacts/ContactLinks';
import { YandexMap } from '@/components/media/YandexMap';
import { LeadForm } from '@/components/forms/LeadForm';

export function Contacts({ contacts }: { contacts: ContactsData }) {
  return (
    <Section id="contacts" num="10" title="Контакты" dark>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <Reveal className="lg:col-span-7">
          <YandexMap
            lat={contacts.mapLat}
            lon={contacts.mapLon}
            zoom={contacts.mapZoom}
            address={contacts.address}
            title={siteMeta.legalName}
          />
        </Reveal>

        <div className="lg:col-span-5">
          <Reveal>
            <ContactLinks contacts={contacts} onDark place="contactsSection" />
          </Reveal>

          <Reveal className="mt-10 border-t border-forestLine pt-10">
            <h3 className="text-cardTitle text-paper">Перезвоним и ответим на вопросы</h3>
            <p className="mt-3 max-w-prose text-body text-sand">
              Оставьте номер — Батырхан свяжется в течение рабочего дня.
            </p>
            <LeadForm
              type="CALLBACK"
              onDark
              telegram={contacts.telegram}
              submitLabel="Жду звонка"
              className="mt-7"
            />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
