import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { resolveVisitor } from '@/lib/analyticsServer';
import { ANALYTICS_EVENTS } from '@/lib/enums';

const schema = z.object({
  name: z.enum(ANALYTICS_EVENTS),
  path: z.string().max(300).optional(),
  meta: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const visitor = await resolveVisitor({});

    await db.event.create({
      data: {
        visitorId: visitor.id,
        name: parsed.data.name,
        path: parsed.data.path ?? null,
        meta: parsed.data.meta ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[analytics/event]', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
