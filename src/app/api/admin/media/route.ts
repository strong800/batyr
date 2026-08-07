import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/utils';

const ADMIN_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'admin');
const WIDTHS = [480, 800, 1280, 2048];
const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Загрузка изображений из админки.
 *
 * Обрабатывается тем же конвейером, что и импорт: поворот по EXIF,
 * webp в нескольких ширинах, blur-плейсхолдер. Оригинал сохраняется рядом.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Нужен вход' }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    const projectId = String(form.get('projectId') ?? '') || null;
    const workId = String(form.get('workId') ?? '') || null;
    const reviewId = String(form.get('reviewId') ?? '') || null;
    const kind = String(form.get('kind') ?? 'PHOTO');
    const alt = String(form.get('alt') ?? '').trim() || null;

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, error: 'Файл не передан' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'Файл больше 25 МБ' },
        { status: 400 },
      );
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['jpg', 'jpeg', 'png', 'webp', 'heic', 'avif'].includes(extension)) {
      return NextResponse.json(
        { ok: false, error: 'Подойдут JPG, PNG, WEBP или HEIC' },
        { status: 400 },
      );
    }

    await mkdir(ADMIN_UPLOAD_DIR, { recursive: true });

    const baseName = `${slugify(file.name.replace(/\.[^.]+$/, '')) || 'photo'}-${randomUUID().slice(0, 8)}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // .rotate() применяет EXIF-ориентацию — перевёрнутых фото не будет
    const image = sharp(buffer).rotate();
    const meta = await image.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (!width || !height) {
      return NextResponse.json(
        { ok: false, error: 'Не удалось прочитать изображение' },
        { status: 400 },
      );
    }

    // Оригинал как есть
    await writeFile(path.join(ADMIN_UPLOAD_DIR, `${baseName}-original.${extension}`), buffer);

    const fullPath = path.join(ADMIN_UPLOAD_DIR, `${baseName}.webp`);
    await image.clone().webp({ quality: 82 }).toFile(fullPath);

    for (const w of WIDTHS) {
      if (w >= width) continue;
      await image
        .clone()
        .resize({ width: w })
        .webp({ quality: 82 })
        .toFile(path.join(ADMIN_UPLOAD_DIR, `${baseName}-${w}.webp`));
    }

    const blurBuffer = await image.clone().resize({ width: 16 }).webp({ quality: 28 }).toBuffer();

    // Новое медиа встаёт в конец галереи
    const last = await db.media.findFirst({
      where: { projectId, workId, reviewId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const media = await db.media.create({
      data: {
        kind,
        src: `/uploads/admin/${baseName}.webp`,
        srcOriginal: `/uploads/admin/${baseName}-original.${extension}`,
        width,
        height,
        alt,
        blurDataUrl: `data:image/webp;base64,${blurBuffer.toString('base64')}`,
        sortOrder: (last?.sortOrder ?? -1) + 1,
        projectId,
        workId,
        reviewId,
      },
    });

    return NextResponse.json({ ok: true, media });
  } catch (error) {
    console.error('[admin/media] загрузка:', error);
    return NextResponse.json(
      { ok: false, error: 'Не удалось загрузить файл' },
      { status: 500 },
    );
  }
}
