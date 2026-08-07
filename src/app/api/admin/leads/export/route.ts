import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { LEAD_STATUS_LABELS, LEAD_TYPE_LABELS, isLeadStatus } from '@/lib/enums';

/** Экранирование по RFC 4180: кавычки удваиваются, поле берётся в кавычки. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

const COLUMNS = [
  'Дата',
  'Статус',
  'Источник',
  'Имя',
  'Телефон',
  'E-mail',
  'Проект',
  'Площадь, м²',
  'Этажность',
  'Участок',
  'Комплектация',
  'Расчёт от',
  'Расчёт до',
  'Комментарий',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'Реферер',
  'Страница',
  'Устройство',
  'Вложений',
];

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Нужен вход' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');

    const leads = await db.lead.findMany({
      where: {
        ...(status && isLeadStatus(status) ? { status } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { files: true },
    });

    const formatter = new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const rows = leads.map((lead) =>
      [
        formatter.format(lead.createdAt),
        LEAD_STATUS_LABELS[lead.status as keyof typeof LEAD_STATUS_LABELS] ?? lead.status,
        LEAD_TYPE_LABELS[lead.type as keyof typeof LEAD_TYPE_LABELS] ?? lead.type,
        lead.name,
        lead.phone,
        lead.email,
        lead.projectTitle,
        lead.areaM2,
        lead.floors,
        lead.hasLand === null ? '' : lead.hasLand ? 'есть' : 'нет',
        lead.packageKey,
        lead.priceMin,
        lead.priceMax,
        lead.comment,
        lead.utmSource,
        lead.utmMedium,
        lead.utmCampaign,
        lead.referrer,
        lead.landingPath,
        lead.device,
        lead.files.length,
      ]
        .map(csvCell)
        .join(';'),
    );

    // Разделитель — точка с запятой, кодировка UTF-8 с BOM:
    // так Excel на Windows открывает файл с кириллицей без «кракозябр»
    // и раскладывает по столбцам без мастера импорта.
    const csv = '﻿' + [COLUMNS.map(csvCell).join(';'), ...rows].join('\r\n');

    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[admin/leads/export]', error);
    return NextResponse.json({ ok: false, error: 'Не удалось выгрузить' }, { status: 500 });
  }
}
