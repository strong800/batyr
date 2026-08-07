/**
 * Импорт медиа из исходной папки в /public/uploads.
 *
 * Что делает:
 *  1. Копирует оригиналы без изменений (кадрирование и цветокоррекция не применяются).
 *  2. Конвертирует в webp и нарезает размеры под сетку и превью.
 *  3. Применяет поворот по EXIF, чтобы не было перевёрнутых кадров.
 *  4. Считает крошечный blur-плейсхолдер для плавной подгрузки.
 *  5. Готовит веб-версию видео (обрезая финальный призыв), постер-кадр
 *     и стоп-кадры производства.
 *  6. Пишет public/uploads/mediaIndex.json — его читает prisma/seed.ts.
 *
 * Запуск: npm run media:import  [-- --force]
 *
 * Папка-источник берётся из переменной окружения BATYR_MEDIA_DIR,
 * иначе используется путь по умолчанию из mediaManifest.ts.
 */
import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import sharp from 'sharp';

import {
  DEFAULT_SOURCE_DIR,
  MEDIA,
  PRODUCTION_STILLS,
  REVIEW_VIDEOS,
  SOURCE_DIR_ENV,
  VIDEO_FILE,
  VIDEO_POSTER_AT,
  VIDEO_TRIM_SECONDS,
  type Attachment,
  type MediaKind,
} from './mediaManifest';

const execFileAsync = promisify(execFile);

const FORCE = process.argv.includes('--force');
const SOURCE_DIR = process.env[SOURCE_DIR_ENV] ?? DEFAULT_SOURCE_DIR;
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const ORIGINALS_DIR = path.join(UPLOADS_DIR, 'originals');

/** Ширины, которые реально нужны сетке: превью, карточка, крупный кадр, оригинальный размер. */
const WIDTHS = [480, 800, 1280, 2048];
const WEBP_QUALITY = 82;

type IndexedMedia = {
  name: string;
  src: string;
  srcOriginal: string;
  width: number;
  height: number;
  alt: string;
  kind: MediaKind;
  blurDataUrl: string;
  poster?: string;
  duration?: number;
  attachments: Attachment[];
};

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
 * Ищем ffmpeg: переменная окружения → PATH → бинарник из python-пакета
 * imageio-ffmpeg. Если не нашли, видео просто пропускается, а сайт
 * продолжает работать на статичных изображениях.
 */
async function resolveFfmpeg(): Promise<string | null> {
  const fromEnv = process.env.FFMPEG_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  try {
    await execFileAsync('ffmpeg', ['-version']);
    return 'ffmpeg';
  } catch {
    /* нет в PATH — пробуем дальше */
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
      /* пробуем следующий интерпретатор */
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
  } catch (err) {
    warn(`ffmpeg не справился с «${label}»: ${(err as Error).message}`);
    return false;
  }
}

/** Крошечная превьюшка в base64 — уходит в placeholder="blur" у next/image. */
async function makeBlur(input: sharp.Sharp): Promise<string> {
  try {
    const buf = await input.clone().resize({ width: 16 }).webp({ quality: 28 }).toBuffer();
    return `data:image/webp;base64,${buf.toString('base64')}`;
  } catch (err) {
    warn(`не удалось посчитать blur-плейсхолдер: ${(err as Error).message}`);
    return '';
  }
}

/**
 * Обрабатывает одно изображение: оригинал + webp в нескольких ширинах.
 * Возвращает null, если файл не читается — импорт при этом не падает.
 */
async function processImage(
  absSource: string,
  outDir: string,
  outName: string,
): Promise<{ src: string; width: number; height: number; blurDataUrl: string } | null> {
  const fullOut = path.join(outDir, `${outName}.webp`);
  const publicSrc = `/${path.relative(PUBLIC_DIR, fullOut).split(path.sep).join('/')}`;

  try {
    const inputBuffer = await readFile(absSource);
    // .rotate() без аргументов применяет EXIF-ориентацию и убирает тег.
    const base = sharp(inputBuffer).rotate();
    const meta = await base.metadata();

    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (!width || !height) {
      warn(`не удалось определить размеры: ${path.basename(absSource)}`);
      return null;
    }

    const blurDataUrl = await makeBlur(base);

    for (const w of WIDTHS) {
      if (w > width) continue;
      const isFull = w === Math.min(width, Math.max(...WIDTHS));
      const target = isFull ? fullOut : path.join(outDir, `${outName}-${w}.webp`);
      if (!FORCE && (await fileExists(target))) continue;
      await base.clone().resize({ width: w }).webp({ quality: WEBP_QUALITY }).toFile(target);
    }

    // Если исходник уже, чем самая крупная ширина, всё равно нужен основной файл.
    if (!(await fileExists(fullOut))) {
      await base.clone().webp({ quality: WEBP_QUALITY }).toFile(fullOut);
    }

    return { src: publicSrc, width, height, blurDataUrl };
  } catch (err) {
    warn(`ошибка обработки ${path.basename(absSource)}: ${(err as Error).message}`);
    return null;
  }
}

async function main() {
  console.log(`Источник: ${SOURCE_DIR}`);

  if (!(await fileExists(SOURCE_DIR))) {
    console.error(
      `\nПапка с материалами не найдена: ${SOURCE_DIR}\n` +
        `Укажите свой путь через переменную окружения ${SOURCE_DIR_ENV}.`,
    );
    process.exit(1);
  }

  for (const dir of ['projects', 'works', 'plans', 'production', 'site', 'video', 'reviews', 'leads']) {
    await mkdir(path.join(UPLOADS_DIR, dir), { recursive: true });
  }
  await mkdir(ORIGINALS_DIR, { recursive: true });

  const index: IndexedMedia[] = [];

  // ------------------------------------------------------------ КАРТИНКИ
  console.log('\nИзображения:');
  for (const item of MEDIA) {
    const absSource = path.join(SOURCE_DIR, item.file);

    if (!(await fileExists(absSource))) {
      warn(`нет исходника ${item.file} — пропущен`);
      continue;
    }

    // Оригинал сохраняем как есть — требование ТЗ.
    const originalOut = path.join(ORIGINALS_DIR, item.file);
    try {
      if (FORCE || !(await fileExists(originalOut))) {
        await copyFile(absSource, originalOut);
      }
    } catch (err) {
      warn(`не удалось скопировать оригинал ${item.file}: ${(err as Error).message}`);
    }

    const outDir = path.join(UPLOADS_DIR, item.folder);
    const processed = await processImage(absSource, outDir, item.name);
    if (!processed) continue;

    const kind = item.attachments[0]?.kind ?? 'PHOTO';
    index.push({
      name: item.name,
      src: processed.src,
      srcOriginal: `/uploads/originals/${item.file}`,
      width: processed.width,
      height: processed.height,
      alt: item.alt,
      kind,
      blurDataUrl: processed.blurDataUrl,
      attachments: item.attachments,
    });
    console.log(`  + ${item.name} (${processed.width}×${processed.height})`);
  }

  // --------------------------------------------------------------- ВИДЕО
  console.log('\nВидео:');
  const ffmpeg = await resolveFfmpeg();
  const absVideo = path.join(SOURCE_DIR, VIDEO_FILE);

  if (!ffmpeg) {
    warn(
      'ffmpeg не найден — видео и стоп-кадры производства пропущены. ' +
        'Установите ffmpeg или выполните: pip install imageio-ffmpeg',
    );
  } else if (!(await fileExists(absVideo))) {
    warn(`нет исходного видео ${VIDEO_FILE} — пропущено`);
  } else {
    const videoOut = path.join(UPLOADS_DIR, 'video', 'proizvodstvo.mp4');
    const posterOutWebp = path.join(UPLOADS_DIR, 'video', 'proizvodstvo-poster.webp');
    const posterTmp = path.join(UPLOADS_DIR, 'video', '_poster.png');

    try {
      if (FORCE || !(await fileExists(videoOut))) {
        // Обрезаем хвост с призывом в директ и жмём под веб.
        const ok = await runFfmpeg(
          ffmpeg,
          [
            '-i', absVideo,
            '-t', String(VIDEO_TRIM_SECONDS),
            '-c:v', 'libx264',
            '-profile:v', 'high',
            // Ролик снят с рук, много движения и зерна — на crf 26 файл выходил
            // 11 МБ без выигрыша в качестве. 30 даёт ~6 МБ при той же картинке.
            '-crf', '30',
            '-preset', 'slow',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-c:a', 'aac',
            '-b:a', '96k',
            videoOut,
          ],
          'веб-версия видео',
        );
        if (ok) console.log('  + proizvodstvo.mp4');
      } else {
        console.log('  = proizvodstvo.mp4 уже готов');
      }

      // Постер-кадр: сначала png из ffmpeg, затем webp через sharp.
      // -ss стоит ПОСЛЕ -i: это точный поиск. Если поставить до, ffmpeg
      // прыгнет к ближайшему ключевому кадру и возьмёт не тот момент.
      if (FORCE || !(await fileExists(posterOutWebp))) {
        const ok = await runFfmpeg(
          ffmpeg,
          ['-i', absVideo, '-ss', String(VIDEO_POSTER_AT), '-frames:v', '1', posterTmp],
          'постер видео',
        );
        if (ok) {
          await sharp(posterTmp).webp({ quality: 80 }).toFile(posterOutWebp);
          console.log('  + постер-кадр');
        }
      }

      // Стоп-кадры производства — единственные снимки цеха, которые есть.
      for (const still of PRODUCTION_STILLS) {
        const stillWebp = path.join(UPLOADS_DIR, 'production', `${still.name}.webp`);
        const stillTmp = path.join(UPLOADS_DIR, 'production', `_${still.name}.png`);
        const alreadyDone = !FORCE && (await fileExists(stillWebp));

        if (!alreadyDone) {
          const ok = await runFfmpeg(
            ffmpeg,
            ['-i', absVideo, '-ss', String(still.at), '-frames:v', '1', stillTmp],
            `стоп-кадр ${still.name}`,
          );
          if (!ok) continue;
        }

        try {
          // Уже готовый webp тоже нужно прочитать — иначе кадр не попадёт
          // в mediaIndex.json при повторном запуске импорта.
          const base = sharp(alreadyDone ? stillWebp : stillTmp).rotate();
          const meta = await base.metadata();

          if (!alreadyDone) {
            await base.clone().webp({ quality: 84 }).toFile(stillWebp);
            await base
              .clone()
              .resize({ width: 480 })
              .webp({ quality: WEBP_QUALITY })
              .toFile(path.join(UPLOADS_DIR, 'production', `${still.name}-480.webp`));
          }

          index.push({
            name: still.name,
            src: `/uploads/production/${still.name}.webp`,
            srcOriginal: `/uploads/originals/${VIDEO_FILE}`,
            width: meta.width ?? 720,
            height: meta.height ?? 1280,
            alt: still.alt,
            kind: 'PRODUCTION',
            blurDataUrl: await makeBlur(base),
            attachments: [
              {
                owner: 'site',
                key: 'production',
                kind: 'PRODUCTION',
                order: PRODUCTION_STILLS.indexOf(still),
              },
            ],
          });
          console.log(`  ${alreadyDone ? '=' : '+'} стоп-кадр ${still.name}`);
        } catch (err) {
          warn(`стоп-кадр ${still.name}: ${(err as Error).message}`);
        }
      }

      // Убираем временные png
      const { unlink, readdir } = await import('node:fs/promises');
      for (const dir of [path.join(UPLOADS_DIR, 'video'), path.join(UPLOADS_DIR, 'production')]) {
        try {
          for (const f of await readdir(dir)) {
            if (f.startsWith('_')) await unlink(path.join(dir, f));
          }
        } catch {
          /* временные файлы могли не создаться — это не ошибка */
        }
      }

      if (await fileExists(videoOut)) {
        // Оригинал видео тоже сохраняем.
        const videoOriginal = path.join(ORIGINALS_DIR, VIDEO_FILE);
        if (FORCE || !(await fileExists(videoOriginal))) {
          await copyFile(absVideo, videoOriginal).catch((err) =>
            warn(`оригинал видео не скопирован: ${(err as Error).message}`),
          );
        }

        index.push({
          name: 'proizvodstvo',
          src: '/uploads/video/proizvodstvo.mp4',
          srcOriginal: `/uploads/originals/${VIDEO_FILE}`,
          poster: '/uploads/video/proizvodstvo-poster.webp',
          width: 720,
          height: 1280,
          duration: VIDEO_TRIM_SECONDS,
          alt: 'Видеоэкскурсия по производству профилированного бруса',
          kind: 'VIDEO',
          blurDataUrl: '',
          attachments: [{ owner: 'site', key: 'productionVideo', kind: 'VIDEO', order: 0 }],
        });
      }
    } catch (err) {
      warn(`обработка видео прервалась: ${(err as Error).message}`);
    }
  }

  // ------------------------------------------------------ ВИДЕООТЗЫВЫ
  console.log('\nВидеоотзывы:');
  if (!ffmpeg) {
    warn('ffmpeg не найден — видеоотзывы пропущены');
  } else {
    await mkdir(path.join(UPLOADS_DIR, 'reviews'), { recursive: true });

    for (const review of REVIEW_VIDEOS) {
      const absReview = path.join(SOURCE_DIR, review.file);
      if (!(await fileExists(absReview))) {
        warn(`нет исходника ${review.file} — отзыв пропущен`);
        continue;
      }

      const outVideo = path.join(UPLOADS_DIR, 'reviews', `${review.name}.mp4`);
      const outPoster = path.join(UPLOADS_DIR, 'reviews', `${review.name}-poster.webp`);
      const posterTmp = path.join(UPLOADS_DIR, 'reviews', `_${review.name}.png`);
      const ready = !FORCE && (await fileExists(outVideo)) && (await fileExists(outPoster));

      if (!ready) {
        // Телефонные исходники весят десятки и сотни мегабайт.
        // Приводим к ширине не больше maxWidth; -2 держит высоту чётной,
        // иначе h264 откажется кодировать.
        const encoded = await runFfmpeg(
          ffmpeg,
          [
            '-i', absReview,
            '-vf', `scale='min(${review.maxWidth},iw)':-2`,
            '-c:v', 'libx264',
            '-profile:v', 'high',
            '-crf', String(review.crf),
            '-preset', 'slow',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-c:a', 'aac',
            '-b:a', '96k',
            outVideo,
          ],
          `отзыв ${review.name}`,
        );
        if (!encoded) continue;

        // -ss после -i: точный поиск нужного кадра
        const framed = await runFfmpeg(
          ffmpeg,
          ['-i', absReview, '-ss', String(review.posterAt), '-frames:v', '1', posterTmp],
          `постер отзыва ${review.name}`,
        );
        if (framed) {
          try {
            await sharp(posterTmp)
              .rotate()
              .resize({ width: review.maxWidth })
              .webp({ quality: 80 })
              .toFile(outPoster);
          } catch (err) {
            warn(`постер отзыва ${review.name}: ${(err as Error).message}`);
          }
        }
      }

      if (!(await fileExists(outVideo))) continue;

      // Оригинал телефонной съёмки сохраняем как есть — файлы тяжёлые,
      // но требование «хранить оригиналы» распространяется и на них.
      const reviewOriginal = path.join(ORIGINALS_DIR, review.file);
      if (FORCE || !(await fileExists(reviewOriginal))) {
        await copyFile(absReview, reviewOriginal).catch((err) =>
          warn(`оригинал ${review.file} не скопирован: ${(err as Error).message}`),
        );
      }

      let blurDataUrl = '';
      let width = review.maxWidth;
      let height = Math.round((review.maxWidth * 16) / 9);
      try {
        if (await fileExists(outPoster)) {
          const posterImage = sharp(outPoster);
          const meta = await posterImage.metadata();
          width = meta.width ?? width;
          height = meta.height ?? height;
          blurDataUrl = await makeBlur(posterImage);
        }
      } catch (err) {
        warn(`метаданные постера ${review.name}: ${(err as Error).message}`);
      }

      index.push({
        name: review.name,
        src: `/uploads/reviews/${review.name}.mp4`,
        srcOriginal: `/uploads/originals/${review.file}`,
        poster: `/uploads/reviews/${review.name}-poster.webp`,
        width,
        height,
        alt: review.alt,
        kind: 'REVIEW',
        blurDataUrl,
        attachments: [
          {
            owner: 'review',
            key: review.name,
            kind: 'REVIEW',
            order: REVIEW_VIDEOS.indexOf(review),
          },
        ],
      });

      console.log(`  ${ready ? '=' : '+'} ${review.name}`);
    }

    // Убираем временные кадры
    try {
      const { unlink, readdir } = await import('node:fs/promises');
      const dir = path.join(UPLOADS_DIR, 'reviews');
      for (const f of await readdir(dir)) {
        if (f.startsWith('_')) await unlink(path.join(dir, f));
      }
    } catch {
      /* временных файлов могло не быть */
    }
  }

  // ------------------------------------------------------------- ИТОГ
  const indexPath = path.join(UPLOADS_DIR, 'mediaIndex.json');
  try {
    await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
  } catch (err) {
    console.error(`Не удалось записать mediaIndex.json: ${(err as Error).message}`);
    process.exit(1);
  }

  console.log(`\nОбработано записей: ${index.length}`);
  console.log(`Индекс: ${indexPath}`);

  if (problems.length) {
    console.log(`\nПредупреждений: ${problems.length}`);
    for (const p of problems) console.log(`  · ${p}`);
  }
}

main().catch((err) => {
  console.error('Импорт медиа прерван:', err);
  process.exit(1);
});
