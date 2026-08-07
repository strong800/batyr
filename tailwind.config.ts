import type { Config } from 'tailwindcss';

/**
 * Единственный источник дизайн-токенов проекта.
 * Хардкод цветов, размеров и отступов в компонентах запрещён —
 * если значения нет здесь, его нужно сначала добавить сюда.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- Светлое поле ---
        paper: '#F7F4EF', // основной фон, тёплая бумага
        paperDeep: '#EFE9E0', // второй тон для чередования секций
        sand: '#E3D6C1', // песочный: заливка кнопки на тёмном, полоса ТТХ
        line: '#DCD3C7', // все разделители и рамки на светлом, 1px
        ink: '#1C1F1C', // основной текст, контраст к paper 15:1
        inkMuted: '#5A5F58', // вторичный текст, контраст 6,5:1

        // --- Тёмное поле ---
        forest: '#16241D', // хвойный: тёмные секции, футер, колонка hero
        forestSoft: '#22332A', // карточки и бейджи на тёмном
        forestLine: '#33463B', // разделители на тёмном

        // --- Древесная группа: ТОЛЬКО графика ---
        // Контраст timber к paper = 3,4:1 — для текста не использовать.
        timber: '#B4763A',
        timberLight: '#D9A96B',

        // --- Акцент: разрешён в пяти местах, см. docs/designConcept.md ---
        ember: '#A8431A', // 5,5:1 к paper, проходит AA для текста
        emberOnDark: '#E08A4F', // 6,2:1 к forest
      },

      fontFamily: {
        // Заголовки: узкий заглавный гротеск, рифмуется с надписями на фото
        display: ['var(--fontDisplay)', 'Oswald', 'Arial Narrow', 'sans-serif'],
        // Текст: спокойный нейтральный гротеск с полной кириллицей
        sans: ['var(--fontText)', 'Golos Text', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        nums: ['0.75rem', { lineHeight: '1', letterSpacing: '0.12em' }],
        badge: ['0.8125rem', { lineHeight: '1.2', letterSpacing: '0.08em' }],
        body: ['1rem', { lineHeight: '1.7' }],
        lead: ['1.1875rem', { lineHeight: '1.75' }],
        cardTitle: ['1.5rem', { lineHeight: '1.1', letterSpacing: '0.02em' }],
        // Как и display, считается под колонку заголовка, а не под экран
        sectionTitle: ['clamp(2rem, 4.2vw, 3.75rem)', { lineHeight: '1.0', letterSpacing: '-0.005em' }],
        // Кегль первого экрана считается под ШИРИНУ КОЛОНКИ, а не экрана:
        // заголовок занимает половину сетки, а в русском тексте попадаются
        // слова вроде «профилированного» — на 7vw оно вылезало за колонку.
        display: ['clamp(2.5rem, 4.6vw, 5.5rem)', { lineHeight: '0.94', letterSpacing: '-0.01em' }],
      },

      spacing: {
        // Вертикальный ритм секций: мобайл / планшет / десктоп
        sectionSm: '5rem', // 80
        sectionMd: '7rem', // 112
        sectionLg: '10rem', // 160
        // Боковые поля контейнера
        gutterSm: '1.5rem', // 24
        gutterMd: '2.5rem', // 40
        gutterLg: '5rem', // 80
      },

      maxWidth: {
        content: '90rem', // 1440 — максимальная ширина контента
        prose: '38rem', // ~68 знаков в строке
      },

      borderRadius: {
        // Ничего мягкого: 2px у интерактивных элементов, 0 у фото-плашек
        DEFAULT: '2px',
        plate: '0px',
      },

      boxShadow: {
        // Теней в проекте нет. Единственное исключение — кольцо фокуса.
        none: 'none',
      },

      transitionTimingFunction: {
        calm: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },

      transitionDuration: {
        reveal: '600ms',
        hover: '700ms',
        tab: '320ms',
        lightbox: '240ms',
      },

      aspectRatio: {
        plate: '4 / 5', // родной формат всех фотографий из папки
        vertical: '9 / 16', // родной формат видео с производства
      },
    },
  },
  plugins: [],
};

export default config;
