import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { resolveVisitor } from '@/lib/analyticsServer';
import { isAllowedUpload, leadSchema } from '@/lib/validation';
import { slugify } from '@/lib/utils';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'leads');

/**
 * Приём заявок со всех форм сайта.
 *
 * Принимает и JSON, и multipart/form-data — вторая форма нужна там,
 * где клиент прикладывает эскиз или планировку.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    let payload: Record<string, unknown> = {};
    let uploaded: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      for (const [key, value] of form.entries()) {
        if (value instanceof File) {
          if (value.size > 0) uploaded.push(value);
        } else if (key === 'consent' || key === 'hasLand') {
          payload[key] = value === 'true' || value === 'on';
        } else if (value !== '') {
          payload[key] = value;
        }
      }
    } else {
      payload = await request.json();
    }

    const parsed = leadSchema.safeParse(payload);

    if (!parsed.success) {
      // Ловушка сработала — отвечаем как при успехе, чтобы бот не подбирал форму
      const isHoneypot = parsed.error.issues.some((issue) => issue.message === 'spam');
      if (isHoneypot) {
        return NextResponse.json({ ok: true });
      }

      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? 'form');
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      return NextResponse.json({ ok: false, errors: fieldErrors }, { status: 400 });
    }

    const data = parsed.data;

    // Проверяем вложения до записи в базу
    for (const file of uploaded) {
      const problem = isAllowedUpload(file);
      if (problem) {
        return NextResponse.json({ ok: false, errors: { file: problem } }, { status: 400 });
      }
    }

    const visitor = await resolveVisitor({
      referrer: data.referrer || undefined,
      landingPath: data.landingPath || undefined,
      utmSource: data.utmSource || undefined,
      utmMedium: data.utmMedium || undefined,
      utmCampaign: data.utmCampaign || undefined,
    });

    let projectId: string | null = null;
    if (data.projectSlug) {
      const project = await db.project
        .findUnique({ where: { slug: data.projectSlug }, select: { id: true, title: true } })
        .catch(() => null);
      projectId = project?.id ?? null;
    }

    const lead = await db.lead.create({
      data: {
        type: data.type,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        comment: data.comment || null,
        projectId,
        projectTitle: data.projectTitle || null,
        areaM2: data.areaM2 ?? null,
        floors: data.floors ?? null,
        hasLand: data.hasLand ?? null,
        packageKey: data.packageKey || null,
        options: data.options || null,
        priceMin: data.priceMin ?? null,
        priceMax: data.priceMax ?? null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmContent: data.utmContent || null,
        utmTerm: data.utmTerm || null,
        referrer: data.referrer || null,
        landingPath: data.landingPath || null,
        device: visitor.device,
      },
    });

    // Файлы кладём локально рядом с заявкой
    if (uploaded.length > 0) {
      try {
        await mkdir(UPLOAD_DIR, { recursive: true });
        for (const file of uploaded) {
          const extension = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
          const safeName = `${lead.id}-${randomUUID().slice(0, 8)}-${slugify(
            file.name.replace(/\.[^.]+$/, ''),
          )}.${extension}`;
          const buffer = Buffer.from(await file.arrayBuffer());
          await writeFile(path.join(UPLOAD_DIR, safeName), buffer);

          await db.leadFile.create({
            data: {
              leadId: lead.id,
              src: `/uploads/leads/${safeName}`,
              originalName: file.name.slice(0, 200),
              sizeBytes: file.size,
              mime: file.type || 'application/octet-stream',
            },
          });
        }
      } catch (error) {
        // Заявка уже принята — файл не должен её отменять, только логируем
        console.error('[leads] сохранение вложения:', error);
      }
    }

    // Событие воронки в свою аналитику
    try {
      await db.event.create({
        data: {
          visitorId: visitor.id,
          name: 'formSubmit',
          path: data.landingPath || null,
          meta: JSON.stringify({ type: data.type, projectSlug: data.projectSlug || null }),
        },
      });
    } catch (error) {
      console.error('[leads] событие аналитики:', error);
    }

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (error) {
    console.error('[leads] приём заявки:', error);
    return NextResponse.json(
      { ok: false, errors: { form: 'Не получилось отправить. Попробуйте ещё раз или позвоните нам.' } },
      { status: 500 },
    );
  }
}
