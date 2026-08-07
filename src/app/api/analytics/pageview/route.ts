import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { resolveVisitor } from '@/lib/analyticsServer';

const schema = z.object({
  path: z.string().min(1).max(300),
  title: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
  utmContent: z.string().max(120).optional(),
  utmTerm: z.string().max(120).optional(),
  // 0 приходит из вкладок, которые ещё не отрисованы. Это не ошибка —
  // просто ширина неизвестна, устройство определим по User-Agent.
  screenWidth: z.number().int().min(0).max(10000).optional(),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const data = parsed.data;

    const visitor = await resolveVisitor({
      screenWidth: data.screenWidth,
      referrer: data.referrer,
      landingPath: data.path,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
    });

    await db.pageView.create({
      data: {
        visitorId: visitor.id,
        path: data.path,
        title: data.title ?? null,
        device: visitor.device,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[analytics/pageview]', error);
    // Аналитика не должна влиять на работу сайта — отвечаем спокойно.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
