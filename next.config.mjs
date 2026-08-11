/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Локальные файлы из /public/uploads. Внешних источников нет — всё лежит на диске.
    formats: ['image/webp'],
    // 720 добавлено намеренно: кадры из видео имеют ровно 720 px по ширине,
    // и без этой ступени браузер на мобильном просил 828 — то есть
    // растягивал исходник, увеличивая вес без выигрыша в качестве
    deviceSizes: [360, 480, 640, 720, 828, 1080, 1280, 1600, 1920],
    imageSizes: [160, 240, 320, 420, 560],
  },
  eslint: {
    // Линт запускается отдельной командой, чтобы сборка не падала из-за стилевых замечаний.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Формы и загрузка файлов в админке: разрешаем тела до 25 МБ.
    serverActions: { bodySizeLimit: '25mb' },
  },
  // Файл SQLite открывается по строке подключения (DATABASE_URL), а не через
  // require/import, поэтому автоматический трейсинг Next.js его не находит
  // и не кладёт в серверный бандл. Без этой строки на Vercel Prisma не найдёт
  // базу — см. docs/vercelDemo.md.
  outputFileTracingIncludes: {
    '/*': ['./prisma/*.db'],
  },
};

export default nextConfig;
