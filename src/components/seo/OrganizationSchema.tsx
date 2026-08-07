import { siteMeta } from '@/config/site';
import type { Contacts, Legal } from '@/lib/settings';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Schema.org: Organization + LocalBusiness одним графом.
 * Карточки проектов размечаются отдельно как Product — см. ProductSchema.
 */
export function OrganizationSchema({ contacts, legal }: { contacts: Contacts; legal: Legal }) {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: siteMeta.legalName,
        alternateName: siteMeta.name,
        legalName: legal.entityName,
        taxID: legal.inn,
        vatID: legal.ogrnip,
        url: siteUrl,
        description: siteMeta.description,
        telephone: contacts.phoneRaw,
        sameAs: [contacts.telegram, contacts.instagram].filter(Boolean),
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${siteUrl}/#localBusiness`,
        name: siteMeta.legalName,
        image: `${siteUrl}/uploads/site/brand-titul.webp`,
        url: siteUrl,
        telephone: contacts.phoneRaw,
        priceRange: '$$',
        address: {
          '@type': 'PostalAddress',
          streetAddress: contacts.address.replace(/^г\.\s*Уфа,\s*/i, ''),
          addressLocality: siteMeta.city,
          addressCountry: 'RU',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: contacts.mapLat,
          longitude: contacts.mapLon,
        },
        parentOrganization: { '@id': `${siteUrl}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Данные формируются на сервере из своей базы, внешнего ввода здесь нет
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
