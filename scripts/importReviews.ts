/**
 * Импорт видеоотзывов.
 *
 * Вынесен из общего media:import намеренно: отзывы приходят отдельно
 * от папки с материалами, поштучно и в разное время. Скрипт берёт всё,
 * что лежит в папке-приёмнике, и не зависит от жёсткого списка файлов —
 * достаточно положить новый ролик и запустить команду ещё раз.
 *
 * Куда класть ролики: media/reviews/ (переопределяется BATYR_REVIEWS_DIR).
 * Запуск: npm run reviews:import  [-- --force]
 *
 * Что делает с каждым файлом:
 *   1. Сжимает до веб-версии mp4 (H.264, ширина не больше 720 px).
 *   2. Снимает постер-кадр.
 *   3. Создаёт запись отзыва в базе и привязывает к ней видео.
 *
 * Оригиналы никуда не копируются: они и так лежат в папке-приёмнике,
 * внутри проекта. Дублировать сотни мегабайт в public/ незачем.
 *
 * Имена заказчиков и текст отзыва скрипт не выдумывает: подставляется
 * нейтральное «Заказчик», остальное заполняется в админке.
 */
import { access, mkdir, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';

const execFileAsync = promisify(execFile);
const db = new PrismaClient();

const FORCE = process.argv.includes('--force');

export const REVIEWS_DIR_ENV = 'BATYR_REVIEWS_DIR';
const REVIEWS_DIR = process.env[REVIEWS_DIR_ENV] ?? path.join(process.cwd(), 'media', 'reviews');

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const OUT_DIR = path.join(PUBLIC_DIR, 'uploads', 'reviews');

/** Телефоны пишут вертикально и тяжело — 720 px по ширине хватает с запасом. */
const MAX_WIDTH = 720;
const CRF = 30;
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm'];

/** Секунда, с которой берём постер: на первом кадре часто смазано или темно. */
const POSTER_AT = 2;

const problems: string[] = [];

function warn(message: string) {
  problems.push(message);
  console.warn(`  ! ${message}`);
}

async function fileExists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Латинский слаг из имени файла. Кириллица транслитерируется,
 * потому что имя становится частью пути к файлу и адреса.
 */
function slugFromFile(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  const slug = base
    .toLowerCase()
    .split('')
    .map((char) => map[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'otzyv';
}

/** ffmpeg: переменная окружения → PATH → бинарник из python-пакета imageio-ffmpeg. */
async function resolveFfmpeg(): Promise<string | null> {
  const fromEnv = process.env.FFMPEG_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  try {
    await execFileAsync('ffmpeg', ['-version']);
    return 'ffmpeg';
  } catch {
    /* нет в PATH */
  }

  for (const py of ['python', 'python3', 'py']) {
    try {
      const { stdout } = await execFileAsync(py, [
        '-c',
        'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())',
      ]);
      const candidate = stdout.trim();
      if (candidate && existsSync(candidate)) return candidate;
    } catch {
      /* следующий интерпретатор */
    }
  }
  return null;
}

async function runFfmpeg(bin: string, args: string[], label: string): Promise<boolean> {
  try {
    await execFileAsync(bin, ['-y', '-hide_banner', '-loglevel', 'error', ...args], {
      maxBuffer: 32 * 1024 * 1024,
    });
    return true;
  } catch (error) {
    warn(`ffmpeg не справился с «${label}»: ${(error as Error).message}`);
    return false;
  }
}

async function main() {
  console.log(`Папка с отзывами: ${REVIEWS_DIR}`);

  if (!(await fileExists(REVIEWS_DIR))) {
    console.log(
      `\nПапки нет — создаю: ${REVIEWS_DIR}\n` +
        'Положите в неё видеоотзывы и запустите команду ещё раз.',
    );
    await mkdir(REVIEWS_DIR, { recursive: true });
    return;
  }

  let entries: string[];
  try {
    entries = await readdir(REVIEWS_DIR);
  } catch (error) {
    console.error(`Не удалось прочитать папку: ${(error as Error).message}`);
    process.exit(1);
  }

  const videos = entries
    .filter((name) => VIDEO_EXTENSIONS.includes(path.extname(name).toLowerCase()))
    .sort();

  if (videos.length === 0) {
    console.log(
      '\nВидеофайлов не найдено.\n' +
        `Поддерживаются: ${VIDEO_EXTENSIONS.join(', ')}\n` +
        'Положите ролики в папку и запустите команду ещё раз.',
    );
    return;
  }

  const ffmpeg = await resolveFfmpeg();
  if (!ffmpeg) {
    console.error(
      '\nffmpeg не найден — сжать видео нечем.\n' +
        'Поставьте его командой: pip install imageio-ffmpeg',
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  console.log(`\nНайдено роликов: ${videos.length}\n`);
  let imported = 0;

  for (const [index, fileName] of videos.entries()) {
    const source = path.join(REVIEWS_DIR, fileName);
    const slug = slugFromFile(fileName);

    const outVideo = path.join(OUT_DIR, `${slug}.mp4`);
    const outPoster = path.join(OUT_DIR, `${slug}-poster.webp`);
    const posterTmp = path.join(OUT_DIR, `_${slug}.png`);

    const ready = !FORCE && (await fileExists(outVideo)) && (await fileExists(outPoster));

    if (!ready) {
      console.log(`  сжимаю ${fileName}…`);
      // scale с -2 держит высоту чётной: иначе H.264 откажется кодировать
      const encoded = await runFfmpeg(
        ffmpeg,
        [
          '-i', source,
          '-vf', `scale='min(${MAX_WIDTH},iw)':-2`,
          '-c:v', 'libx264',
          '-profile:v', 'high',
          '-crf', String(CRF),
          '-preset', 'slow',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          '-c:a', 'aac',
          '-b:a', '96k',
          outVideo,
        ],
        fileName,
      );
      if (!encoded) continue;

      // -ss после -i: точный поиск кадра, иначе ffmpeg прыгает к ключевому
      const framed = await runFfmpeg(
        ffmpeg,
        ['-i', source, '-ss', String(POSTER_AT), '-frames:v', '1', posterTmp],
        `постер ${fileName}`,
      );
      if (framed) {
        try {
          await sharp(posterTmp)
            .rotate()
            .resize({ width: MAX_WIDTH })
            .webp({ quality: 80 })
            .toFile(outPoster);
        } catch (error) {
          warn(`постер ${fileName}: ${(error as Error).message}`);
        } finally {
          await unlink(posterTmp).catch(() => {});
        }
      }
    }

    if (!(await fileExists(outVideo))) continue;

    let width = MAX_WIDTH;
    let height = Math.round((MAX_WIDTH * 16) / 9);
    if (await fileExists(outPoster)) {
      try {
        const meta = await sharp(outPoster).metadata();
        width = meta.width ?? width;
        height = meta.height ?? height;
      } catch (error) {
        warn(`метаданные постера ${slug}: ${(error as Error).message}`);
      }
    }

    // Запись в базе. Имя и текст не перетираем: их правят в админке
    try {
      const review = await db.review.upsert({
        where: { key: slug },
        create: {
          key: slug,
          authorName: 'Заказчик',
          authorInfo: 'Видеоотзыв',
          format: 'VIDEO',
          visible: true,
          sortOrder: index,
        },
        update: { format: 'VIDEO' },
      });

      const src = `/uploads/reviews/${slug}.mp4`;
      const existing = await db.media.findFirst({ where: { reviewId: review.id, src } });

      if (existing) {
        await db.media.update({
          where: { id: existing.id },
          data: { poster: `/uploads/reviews/${slug}-poster.webp`, width, height },
        });
      } else {
        await db.media.create({
          data: {
            kind: 'REVIEW',
            src,
            // Оригинал остаётся в папке-приёмнике, копия в public не нужна
            srcOriginal: null,
            poster: `/uploads/reviews/${slug}-poster.webp`,
            width,
            height,
            alt: 'Видеоотзыв заказчика',
            sortOrder: 0,
            reviewId: review.id,
          },
        });
      }

      imported++;
      console.log(`  ${ready ? '=' : '+'} ${slug}`);
    } catch (error) {
      warn(`запись в базу для ${slug}: ${(error as Error).message}`);
    }
  }

  console.log(`\nГотово. Отзывов в базе: ${imported}`);
  if (imported > 0) {
    console.log('Подпишите их настоящими именами заказчиков: /admin/reviews');
  }
  if (problems.length) {
    console.log(`\nПредупреждений: ${problems.length}`);
    for (const p of problems) console.log(`  · ${p}`);
  }
}

main()
  .catch((error) => {
    console.error('Импорт отзывов прерван:', error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
