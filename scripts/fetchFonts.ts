/**
 * Разовая загрузка шрифтов в public/fonts.
 *
 * Проект должен собираться без сети, поэтому шрифты не тянутся из Google
 * при каждой сборке — они один раз кладутся на диск и подключаются
 * вручную через @font-face в globals.css.
 *
 * Берём только подмножества cyrillic и latin: этого достаточно, файлы мелкие.
 * Обе гарнитуры вариативные, поэтому один файл покрывает все начертания.
 *
 * Запуск: npm run fonts:fetch
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'public', 'fonts');

// UA современного Chrome — иначе Google отдаёт ttf вместо woff2
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

type FontTask = {
  family: string;
  cssUrl: string;
  fileBase: string;
};

const TASKS: FontTask[] = [
  {
    family: 'Oswald',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400..700&display=swap',
    fileBase: 'oswald',
  },
  {
    family: 'Golos Text',
    cssUrl: 'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400..700&display=swap',
    fileBase: 'golos-text',
  },
];

/** Нужные подмножества и их unicode-range из ответа Google. */
const WANTED_SUBSETS = ['cyrillic', 'cyrillic-ext', 'latin', 'latin-ext'];

type FaceInfo = {
  subset: string;
  url: string;
  unicodeRange: string;
};

/** Разбирает CSS Google Fonts на блоки @font-face с пометкой подмножества. */
function parseFaces(css: string): FaceInfo[] {
  const faces: FaceInfo[] = [];
  // Каждому блоку предшествует комментарий вида /* cyrillic */
  const blockRe = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(css)) !== null) {
    const subset = match[1];
    const body = match[2];
    const urlMatch = body.match(/url\((https:\/\/[^)]+\.woff2)\)/);
    const rangeMatch = body.match(/unicode-range:\s*([^;]+);/);
    if (!urlMatch) continue;
    faces.push({
      subset,
      url: urlMatch[1],
      unicodeRange: rangeMatch ? rangeMatch[1].trim() : '',
    });
  }
  return faces;
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const manifest: Record<string, { subset: string; file: string; unicodeRange: string }[]> = {};

  for (const task of TASKS) {
    console.log(`\n→ ${task.family}`);

    let css: string;
    try {
      const res = await fetch(task.cssUrl, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      css = await res.text();
    } catch (err) {
      console.error(
        `  ! Не удалось получить CSS для «${task.family}»: ${(err as Error).message}\n` +
          `    Проверьте интернет. Шрифты нужны один раз — после загрузки сеть больше не требуется.`,
      );
      process.exitCode = 1;
      continue;
    }

    const faces = parseFaces(css).filter((f) => WANTED_SUBSETS.includes(f.subset));
    if (faces.length === 0) {
      console.error(`  ! В ответе Google не нашлось нужных подмножеств для «${task.family}»`);
      process.exitCode = 1;
      continue;
    }

    manifest[task.family] = [];

    for (const face of faces) {
      const fileName = `${task.fileBase}-${face.subset}.woff2`;
      const outPath = path.join(OUT_DIR, fileName);

      if (await fileExists(outPath)) {
        console.log(`  = ${fileName} уже на месте`);
      } else {
        try {
          const res = await fetch(face.url, { headers: { 'User-Agent': UA } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = Buffer.from(await res.arrayBuffer());
          await writeFile(outPath, buf);
          console.log(`  + ${fileName} (${Math.round(buf.length / 1024)} КБ)`);
        } catch (err) {
          console.error(`  ! ${fileName}: ${(err as Error).message}`);
          process.exitCode = 1;
          continue;
        }
      }

      manifest[task.family].push({
        subset: face.subset,
        file: `/fonts/${fileName}`,
        unicodeRange: face.unicodeRange,
      });
    }
  }

  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\nГотово. Манифест: ${manifestPath}`);
  console.log('unicode-range из манифеста уже прописан в src/app/globals.css.');
}

main().catch((err) => {
  console.error('Непредвиденная ошибка загрузки шрифтов:', err);
  process.exit(1);
});
