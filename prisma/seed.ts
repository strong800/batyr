/**
 * Наполнение базы. Источники:
 *  — бриф компании (комплектации, контакты);
 *  — разбор папки с материалами (проекты, площади, планировки), docs/catalogDraft.md;
 *  — расшифровка озвучки видео (более 50 проектов, доставка по России).
 *
 * Медиа берутся из public/uploads/mediaIndex.json, который создаёт
 * скрипт media:import. Запускать импорт нужно ДО сидирования.
 *
 * Скрипт идемпотентный: повторный запуск обновляет записи, а не плодит копии.
 * Запуск: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const db = new PrismaClient();

type MediaAttachment = {
  owner: 'project' | 'work' | 'site' | 'review';
  key: string;
  kind: string;
  order: number;
  isCover?: boolean;
  caption?: string;
};

type MediaRecord = {
  name: string;
  src: string;
  srcOriginal: string;
  poster?: string;
  width: number;
  height: number;
  duration?: number;
  alt: string;
  kind: string;
  blurDataUrl: string;
  attachments: MediaAttachment[];
};

// ------------------------------------------------------------------ ПРОЕКТЫ

const PROJECTS = [
  {
    slug: 'semeynye-tradicii',
    title: 'Семейные традиции',
    category: 'HOUSE',
    areaM2: 116.3,
    floors: 2,
    hasTerrace: true,
    hasBalcony: true,
    hasMansard: true,
    foundation: 'Железобетонные забивные сваи 150×150, оголовки 200×200',
    basePackage: 'UNDER_ROOF',
    tagline: 'Место, которое объединяет поколения',
    description:
      'Просторный двухэтажный дом, где хватает места для больших семейных встреч, гостей и хобби. Балкон на втором этаже, терраса-навес и полноценный второй свет. Самый востребованный проект: построен уже в четырёх вариантах отделки фасада — от чёрного до медовой сосны.',
    featured: true,
    sortOrder: 10,
    rooms: [],
  },
  {
    slug: 'semeyka',
    title: 'Семейка',
    category: 'HOUSE',
    areaM2: 67.6,
    floors: 1,
    widthMm: 12700,
    lengthMm: 8540,
    ceilingMm: 3200,
    hasTerrace: true,
    terraceAreaM2: 17.4,
    foundation: 'Железобетонные забивные сваи 150×150, оголовки 200×200',
    basePackage: 'WARM_LOOP',
    tagline: 'Дом, где у каждого есть своё пространство',
    description:
      'Одноэтажный дом для семьи с детьми. Кухня-гостиная 22,4 м² с потолком 3,2 метра становится центром дома, у каждого есть своя комната, а терраса 17,4 м² — то место, где семья собирается вечером.',
    featured: true,
    sortOrder: 20,
    rooms: [
      { title: 'Кухня-гостиная', areaM2: 22.4 },
      { title: 'Спальня', areaM2: 10.2 },
      { title: 'Спальня', areaM2: 9.0 },
      { title: 'Кабинет', areaM2: 5.8 },
      { title: 'Коридор', areaM2: 5.4 },
      { title: 'Санузел', areaM2: 4.2 },
      { title: 'Прихожая', areaM2: 3.4 },
      { title: 'Терраса', areaM2: 17.4 },
      { title: 'Крыльцо', areaM2: 3.3 },
    ],
  },
  {
    slug: 'shale-u-ozera',
    title: 'Шале у озера',
    category: 'HOUSE',
    areaM2: 62.5,
    floors: 2,
    basePackage: 'UNDER_ROOF',
    tagline: 'Дом, где каждый день начинается с красивого вида',
    description:
      'Ломаный силуэт шале с остеклением во всю высоту фронтона. Второй свет и панорамные окна в пол — природа за окном становится частью интерьера.',
    featured: true,
    sortOrder: 30,
    rooms: [],
  },
  {
    slug: 'lunnaya-tropa',
    title: 'Лунная тропа',
    category: 'HOUSE',
    areaM2: 61.3,
    floors: 1,
    basePackage: 'UNDER_ROOF',
    tagline: 'Для спокойных вечеров и счастливых моментов',
    description:
      'Одноэтажный дом со сложной ломаной кровлей и крупным остеклением в пол. Уютная кухня-гостиная становится местом для разговоров и ужинов.',
    featured: true,
    sortOrder: 40,
    rooms: [],
  },
  {
    slug: 'osenniy',
    title: 'Осенний',
    category: 'HOUSE',
    areaM2: 58.4,
    floors: 1,
    hasTerrace: true,
    basePackage: 'UNDER_ROOF',
    tagline: 'Место, где можно забыть о городской суете',
    description:
      'Вертикальная обшивка светлым деревом в графитовом портале, узкие чёрные окна и глубокий навес над входом. Спокойная современная геометрия, которая одинаково хорошо смотрится летом и под снегом.',
    featured: true,
    sortOrder: 50,
    rooms: [],
  },
  {
    slug: 'schastye',
    title: 'Счастье',
    category: 'HOUSE',
    areaM2: 54.4,
    floors: 1,
    basePackage: 'UNDER_ROOF',
    tagline: 'Там, где природа становится частью интерьера',
    description:
      'Компактный одноэтажный дом с большим панорамным окном. Кровля сложной формы даёт высокий потолок в общей зоне.',
    featured: false,
    sortOrder: 60,
    rooms: [],
  },
  {
    slug: 'a-freym',
    title: 'А-фрейм',
    category: 'AFRAME',
    areaM2: 51.4,
    floors: 2,
    hasTerrace: true,
    basePackage: 'UNDER_ROOF',
    tagline: 'Дом для перезагрузки',
    description:
      'Треугольный дом со сплошным остеклением фронтона и большой террасой. Второй свет и антресоль наверху. Часто берут как гостевой дом или дом для отдыха.',
    featured: true,
    sortOrder: 70,
    rooms: [],
  },
  {
    slug: 'banya',
    title: 'Баня из профилированного бруса',
    category: 'BANYA',
    areaM2: 11.6,
    floors: 1,
    widthMm: 3250,
    lengthMm: 4250,
    hasTerrace: true,
    basePackage: 'WARM_LOOP',
    tagline: 'Отдых для души и тела',
    description:
      'Компактная баня на семью из 3–4 человек: терраса под навесом, парная-моечная с печью-каменкой и баком, комната отдыха. Под крышу — за две недели.',
    featured: false,
    sortOrder: 80,
    rooms: [
      { title: 'Парная-моечная', areaM2: 4.09 },
      { title: 'Комната отдыха', areaM2: 4.09 },
      { title: 'Тамбур', areaM2: 1.73 },
      { title: 'Терраса', areaM2: 1.73 },
    ],
  },
] as const;

// -------------------------------------------------- РЕАЛИЗОВАННЫЕ ОБЪЕКТЫ

const WORKS = [
  {
    slug: 'dom-tradicii-temnyy',
    title: 'Дом «Семейные традиции», тёмный фасад',
    projectSlug: 'semeynye-tradicii',
    facadeColor: 'Тёмный графит',
    packageKey: 'WARM_LOOP',
    description:
      'Двухэтажный дом на сваях с балконом и навесом-крыльцом. Внутри — светлая отделка вагонкой, лестница на второй этаж, котельная с бойлером и гидроаккумулятором, мансардные комнаты со скосами. Есть пара «проект → реализация»: видно, насколько построенный дом совпал с визуализацией.',
    featured: true,
    sortOrder: 10,
  },
  {
    slug: 'dom-semeyka-pole',
    title: 'Дом «Семейка» в поле',
    projectSlug: 'semeyka',
    facadeColor: 'Натуральная сосна',
    packageKey: 'WARM_LOOP',
    description:
      'Одноэтажный дом на железобетонных сваях с широкой крытой террасой. Сдан в тёплом контуре: окна, двери, отделка, отопление. Кухня-гостиная с трапециевидным фронтоном, санузел-котельная, три спальни.',
    featured: true,
    sortOrder: 20,
  },
  {
    slug: 'banya-s-terrasoy',
    title: 'Баня с террасой',
    projectSlug: 'banya',
    facadeColor: 'Натуральная сосна, малиновая кровля',
    packageKey: 'WARM_LOOP',
    durationText: 'Под крышу за 2 недели',
    description:
      'Баня на участке рядом с домом: печь-каменка с баком и кирпичной защитой, парная с двухъярусным полком, стеклянная дверь, комната отдыха со столом и лавками, терраса под навесом.',
    featured: true,
    sortOrder: 30,
  },
  {
    slug: 'dom-tradicii-korichnevyy',
    title: 'Дом «Семейные традиции», коричневый фасад',
    projectSlug: 'semeynye-tradicii',
    facadeColor: 'Коричневый',
    description:
      'Тот же проект в коричневой пропитке с белыми наличниками и балконом на точёных балясинах.',
    sortOrder: 40,
  },
  {
    slug: 'dom-tradicii-sosna',
    title: 'Дом «Семейные традиции», медовая сосна',
    projectSlug: 'semeynye-tradicii',
    facadeColor: 'Медовая сосна',
    description: 'Вариант с террасой-навесом сбоку и светлой пропиткой.',
    sortOrder: 50,
  },
  {
    slug: 'dom-shale-u-ozera',
    title: 'Шале у озера',
    projectSlug: 'shale-u-ozera',
    description: 'Дом в сосновом бору с панорамным остеклением во всю высоту фронтона.',
    featured: true,
    sortOrder: 60,
  },
  {
    slug: 'dom-a-freym',
    title: 'А-фрейм с террасой',
    projectSlug: 'a-freym',
    description: 'Дом для отдыха с большой террасой и видом на горы.',
    featured: true,
    sortOrder: 70,
  },
  {
    slug: 'dom-osenniy',
    title: 'Дом «Осенний»',
    projectSlug: 'osenniy',
    description: 'Вертикальная обшивка в графитовом портале. Снято зимой.',
    sortOrder: 80,
  },
  {
    slug: 'dom-schastye',
    title: 'Дом «Счастье»',
    projectSlug: 'schastye',
    description: 'Дом с панорамным окном на фоне гор, стадия сдачи.',
    sortOrder: 90,
  },
  {
    slug: 'dom-lunnaya-tropa',
    title: 'Дом «Лунная тропа»',
    projectSlug: 'lunnaya-tropa',
    description: 'Одноэтажный дом с ломаной кровлей и остеклением в пол.',
    sortOrder: 100,
  },
] as const;

// ------------------------------------------------------------ КОМПЛЕКТАЦИИ
// Состав — из брифа. Пояснения простым языком написаны при разработке,
// их стоит вычитать: это то, что клиент читает вместо технического списка.

const PACKAGES = [
  {
    key: 'WALL_KIT',
    title: 'Стенокомплект',
    subtitle: 'Дом в разобранном виде',
    summary:
      'Пронумерованный комплект бруса с чашками, утеплителем и крепежом. Собираете сами или своей бригадой по нашей инструкции.',
    sortOrder: 10,
    items: [
      {
        title: 'Обвязочный брус',
        note: 'Нижний венец, на который встаёт вся коробка. С фундаментом контактирует именно он, поэтому к нему отдельные требования.',
      },
      {
        title: 'Профилированный брус для стен 150×200',
        note: 'Основной материал. Профиль — это замок сверху и снизу бруса: венцы садятся друг в друга без щелей и без подгонки по месту.',
      },
      {
        title: 'Профилированный брус для перегородок',
        note: 'Внутренние стены из того же массива, а не из гипсокартона. Держат нагрузку и гасят звук.',
      },
      {
        title: 'Соединение непродуваемой чашкой',
        note: 'Углы вырезаны так, что у ветра нет прямого пути внутрь. Именно углы обычно и продувает.',
      },
      {
        title: 'Джут — межвенцовый утеплитель',
        note: 'Натуральная лента между венцами. Заполняет неровности дерева, чтобы тепло не уходило через стыки.',
      },
      {
        title: 'Пружинный узел «сила»',
        note: 'Пружинный стяжной узел продолжает поджимать венцы, пока дерево сохнет и садится. Щели не появляются через год.',
      },
      {
        title: 'Крепёж: саморезы, опоры бруса, шканты, нагели, компенсатор усадки',
        note: 'Компенсатор регулирует высоту опорных стоек, пока сруб садится, — терраса и крыльцо не перекашиваются.',
      },
      {
        title: 'Пронумерованные брусья',
        note: 'Каждый брус промаркирован по проекту. Сборка идёт по схеме, как конструктор.',
      },
      {
        title: 'Инструкция для сборки',
        note: 'Пошаговая схема с порядком венцов и узлами.',
      },
      {
        title: 'Рекомендации по уходу',
        note: 'Что делать в первый год: когда подтягивать компенсаторы, чем обрабатывать дерево.',
      },
    ],
  },
  {
    key: 'UNDER_ROOF',
    title: 'Домокомплект под крышу со сборкой',
    subtitle: 'Дом собран и закрыт от погоды',
    summary:
      'Мы забиваем фундамент, привозим комплект и собираем коробку с крышей. Дальше можно спокойно заниматься отделкой в любую погоду.',
    sortOrder: 20,
    items: [
      {
        title: 'Фундамент: железобетонные забивные сваи 150×150, оголовки 200×200',
        note: 'Сваи идут ниже глубины промерзания. Не нужно ждать месяц, пока наберёт прочность бетон, — строить можно сразу.',
      },
      {
        title: 'Стенокомплект целиком',
        note: 'Всё из предыдущего уровня: стены, перегородки, джут, пружинные узлы, крепёж, маркировка.',
      },
      {
        title: 'Сборка на вашем участке',
        note: 'Собирает наша бригада по проектной схеме.',
      },
      {
        title: 'Лаги перекрытия',
        note: 'Балки, на которые лягут пол первого этажа и потолок.',
      },
      {
        title: 'Стропильная система: стропила, обрешётка, контрбрус',
        note: 'Каркас крыши. Контрбрус создаёт вентиляционный зазор — влага из-под кровли уходит, а не копится в утеплителе.',
      },
      {
        title: 'Крепёж',
        note: 'Метизы под всю конструкцию: от опор бруса до кровельных саморезов.',
      },
      {
        title: 'Кровля: ветрозащита, влагозащита, пароизоляция, профнастил',
        note: 'Кровельный пирог целиком. Дом закрыт от дождя и снега.',
      },
    ],
  },
  {
    key: 'WARM_LOOP',
    title: 'Тёплый контур',
    subtitle: 'Можно заезжать и заниматься отделкой',
    summary:
      'Дом закрыт, утеплён и держит тепло: окна, входная дверь, утепление полов и потолков. Внутри остаётся только чистовая отделка.',
    sortOrder: 30,
    items: [
      {
        title: 'Домокомплект со сборкой',
        note: 'Всё из предыдущего уровня: фундамент, стены, перекрытия, крыша.',
      },
      {
        title: 'Фундамент',
        note: 'Железобетонные забивные сваи, как и на уровне «под крышу».',
      },
      {
        title: 'Окна: тройной стеклопакет, две камеры',
        note: 'Две воздушные камеры вместо одной. Разница чувствуется в морозы и видна по счёту за отопление.',
      },
      {
        title: 'Входная дверь с терморазрывом',
        note: 'Внутри полотна вставка, разрывающая мостик холода. Металлическая дверь без неё зимой промерзает и потеет изнутри.',
      },
      {
        title: 'Утепление полов и потолков',
        note: 'В одноэтажном доме основное тепло уходит вверх и вниз, а не через стены.',
      },
      {
        title: 'Сетка против грызунов',
        note: 'Мелкая сетка по периметру пола. Ставится один раз на этапе сборки — потом добраться туда уже нельзя.',
      },
    ],
  },
] as const;

// ------------------------------------------------------------------- ЭТАПЫ
// Черновик: реальные сроки нужно подтвердить, см. docs/dataGaps.md, п. C2.

const STAGES = [
  {
    title: 'Заявка и разговор',
    text: 'Обсуждаем участок, состав семьи и бюджет. Подбираем проект из каталога или решаем, что нужен индивидуальный.',
    durationText: '1 день',
  },
  {
    title: 'Смета и договор',
    text: 'Считаем точную стоимость по выбранной комплектации. Состав работ, материалы и сроки фиксируем в договоре.',
    durationText: '2–5 дней',
  },
  {
    title: 'Производство домокомплекта',
    text: 'Профилируем брус на станках, нарезаем непродуваемые чашки, маркируем каждый венец по проекту.',
    durationText: 'уточняется',
  },
  {
    title: 'Фундамент',
    text: 'Забиваем железобетонные сваи 150×150 и ставим оголовки 200×200. Бетон сохнуть не нужно — работаем дальше сразу.',
    durationText: '1–2 дня',
  },
  {
    title: 'Доставка на участок',
    text: 'Привозим домокомплект своим транспортом. Возим по всей России.',
    durationText: 'по расстоянию',
  },
  {
    title: 'Сборка коробки',
    text: 'Собираем стены по маркировке: венцы, джут между ними, пружинные узлы «сила», компенсаторы усадки на стойках.',
    durationText: 'уточняется',
  },
  {
    title: 'Крыша',
    text: 'Стропильная система, обрешётка, контрбрус и кровельный пирог. С этого момента дом под крышей.',
    durationText: 'дом под крышу — за 3 недели',
  },
  {
    title: 'Тёплый контур',
    text: 'Окна с тройным стеклопакетом, входная дверь с терморазрывом, утепление полов и потолков, сетка от грызунов.',
    durationText: 'уточняется',
  },
  {
    title: 'Сдача',
    text: 'Показываем, что и как сделано, передаём рекомендации по уходу за домом в первый год усадки.',
    durationText: '1 день',
  },
] as const;

// ------------------------------------------------------------- НАСТРОЙКИ

const SETTINGS = [
  // Контакты
  { key: 'contacts.phone', value: '+7 989 958 56 34', group: 'contacts', label: 'Телефон' },
  { key: 'contacts.phoneRaw', value: '+79899585634', group: 'contacts', label: 'Телефон для ссылки tel:' },
  { key: 'contacts.phonePerson', value: 'Батырхан', group: 'contacts', label: 'Имя в подписи к телефону' },
  { key: 'contacts.telegram', value: 'https://t.me/gkbatyrkhan', valueType: 'URL', group: 'contacts', label: 'Telegram' },
  { key: 'contacts.instagram', value: 'https://www.instagram.com/batyrkhan_khamidullin/', valueType: 'URL', group: 'contacts', label: 'Instagram' },
  { key: 'contacts.address', value: 'г. Уфа, ул. Даяна Мурзина, 9/1', group: 'contacts', label: 'Адрес' },
  { key: 'contacts.mapLat', value: '54.7431', valueType: 'NUMBER', group: 'contacts', label: 'Широта метки', hint: 'Уточните точку: адрес может относиться к офису, а производство быть отдельно' },
  { key: 'contacts.mapLon', value: '55.9678', valueType: 'NUMBER', group: 'contacts', label: 'Долгота метки' },
  { key: 'contacts.mapZoom', value: '16', valueType: 'NUMBER', group: 'contacts', label: 'Масштаб карты' },
  { key: 'contacts.workHours', value: 'Пн–Сб, 9:00–19:00', group: 'contacts', label: 'Часы работы', hint: 'Черновик — подтвердите' },

  // Hero
  { key: 'hero.title', value: 'Дома из профилированного бруса под ключ', group: 'hero', label: 'Заголовок первого экрана' },
  { key: 'hero.accent', value: 'под ключ', group: 'hero', label: 'Часть заголовка с акцентом', hint: 'Эта подстрока подчёркивается акцентным цветом' },
  {
    key: 'hero.lead',
    value:
      'Собственное производство профилированного бруса в Уфе. Больше 50 готовых проектов, домокомплекты возим по всей России.',
    valueType: 'LONGTEXT',
    group: 'hero',
    label: 'Абзац под заголовком',
  },
  {
    key: 'hero.facts',
    value: 'более 50 проектов|под крышу за 3 недели|доставка по всей России',
    group: 'hero',
    label: 'Три факта в строке',
    hint: 'Разделяйте вертикальной чертой |',
  },

  // Производство
  { key: 'production.title', value: 'Собственное производство', group: 'production', label: 'Заголовок блока' },
  {
    key: 'production.text',
    value:
      'Качество дома решается не на площадке, а в цеху: насколько ровно снят профиль и насколько точно вырезана чашка. Поэтому производство мы не отдаём на сторону — профилируем брус сами, на своих станках в Уфе.',
    valueType: 'LONGTEXT',
    group: 'production',
    label: 'Текст блока',
  },
  {
    key: 'production.tech',
    value: [
      'Профилирование::Станок снимает замок сверху и снизу бруса. Венцы садятся друг в друга без щелей и без подгонки по месту — геометрия одинаковая по всей партии.',
      'Непродуваемая чашка::Угловое соединение вырезается с лазерной разметкой. Форма чашки не оставляет ветру прямого пути внутрь, а именно углы обычно и продувает.',
      'Джут::Натуральная лента между венцами. Заполняет неровности дерева и не даёт теплу уходить через стыки.',
      'Пружинный узел «сила»::Стяжной узел с пружиной продолжает поджимать венцы, пока дерево сохнет и садится. Щели не появляются через год.',
      'Компенсатор усадки::Регулируемая опора под стойками террасы и крыльца. Пока сруб садится, высоту подкручивают — конструкция не перекашивается.',
      'Маркировка венцов::Каждый брус пронумерован по проекту. На участке комплект собирается по схеме, а не подрезается по месту.',
    ].join('\n'),
    valueType: 'LONGTEXT',
    group: 'production',
    label: 'Технология: список',
    hint: 'Формат: Заголовок::Текст, по одному в строке',
  },

  // Основатель
  { key: 'founder.name', value: 'Батырхан Хамидуллин', group: 'founder', label: 'Имя' },
  { key: 'founder.role', value: 'Основатель группы компаний', group: 'founder', label: 'Должность' },
  {
    key: 'founder.text',
    value:
      'Я начинал с того, что собирал дома своими руками. И довольно быстро понял: качество дома решается не на площадке, а в цеху — в том, насколько ровно снят профиль и насколько точно вырезана чашка. Поэтому мы сделали собственное производство в Уфе и не отдаём его подрядчикам.\n\nСегодня у нас больше пятидесяти готовых проектов, а домокомплекты мы возим по всей России. Если сомневаетесь между проектами — напишите мне. Подскажу, что встанет на ваш участок и подойдёт вашей семье.',
    valueType: 'LONGTEXT',
    group: 'founder',
    label: 'Текст от первого лица',
    hint: 'ЧЕРНОВИК: написан при разработке по материалам. Прочитайте и поправьте под себя.',
  },

  // Индивидуальный проект
  { key: 'custom.title', value: 'Индивидуальный проект', group: 'custom', label: 'Заголовок блока' },
  {
    key: 'custom.text',
    value:
      'Если ни один готовый проект не подходит или у вас уже есть свои чертежи — сделаем домокомплект по вашему проекту. Нужен эскиз или планировка, размеры участка и понимание, сколько человек будет жить в доме.',
    valueType: 'LONGTEXT',
    group: 'custom',
    label: 'Текст блока',
    hint: 'ЧЕРНОВИК: сроки и стоимость проектирования не заданы, см. docs/dataGaps.md, п. C3',
  },
  {
    key: 'custom.steps',
    value: [
      'Присылаете эскиз::Подойдёт и чертёж, и фото от руки, и ссылка на понравившийся дом.',
      'Считаем и обсуждаем::Проверяем, что конструкция реализуема в брусе, предлагаем правки.',
      'Готовим домокомплект::Раскраиваем брус под ваш проект, маркируем венцы, готовим схему сборки.',
    ].join('\n'),
    valueType: 'LONGTEXT',
    group: 'custom',
    label: 'Шаги',
    hint: 'Формат: Заголовок::Текст, по одному в строке',
  },

  // Реквизиты
  {
    key: 'legal.entityName',
    value: 'ИП Хамидуллин Батырхан Булатович',
    group: 'legal',
    label: 'Наименование',
  },
  { key: 'legal.inn', value: '025904937511', group: 'legal', label: 'ИНН' },
  { key: 'legal.ogrnip', value: '323028000031991', group: 'legal', label: 'ОГРНИП' },

  // Блоки и интеграции
  {
    key: 'blocks.reviewsVisible',
    value: 'true',
    valueType: 'BOOL',
    group: 'blocks',
    label: 'Показывать блок отзывов',
    hint: 'Загружено пять видеоотзывов. Подпишите их настоящими именами заказчиков — сейчас стоят нейтральные «Заказчик» и «Заказчица».',
  },
  {
    key: 'integrations.metrikaId',
    value: '',
    group: 'integrations',
    label: 'Номер счётчика Яндекс.Метрики',
    hint: 'Только цифры. Пусто — счётчик не подключается.',
  },
] as const;

// -------------------------------------------------- ПАРАМЕТРЫ КАЛЬКУЛЯТОРА
// ВСЕ ЗНАЧЕНИЯ — ЗАГЛУШКИ. Реальных цен в материалах не было.
// Помечены isStub: в админке они выделены, в README есть отдельный пункт.

const CALC_PARAMS = [
  { key: 'price.WALL_KIT', value: 18000, label: 'Стенокомплект, за м²', unit: '₽/м²', group: 'base', isStub: true, sortOrder: 10 },
  { key: 'price.UNDER_ROOF', value: 32000, label: 'Под крышу со сборкой, за м²', unit: '₽/м²', group: 'base', isStub: true, sortOrder: 20 },
  { key: 'price.WARM_LOOP', value: 48000, label: 'Тёплый контур, за м²', unit: '₽/м²', group: 'base', isStub: true, sortOrder: 30 },

  { key: 'coef.secondFloor', value: 1.08, label: 'Надбавка за второй этаж', unit: '×', group: 'coef', isStub: true, sortOrder: 40, hint: 'Умножается на базовую стоимость' },
  { key: 'coef.mansard', value: 1.05, label: 'Надбавка за мансарду', unit: '×', group: 'coef', isStub: true, sortOrder: 50 },
  { key: 'coef.banya', value: 1.15, label: 'Коэффициент для бань', unit: '×', group: 'coef', isStub: true, sortOrder: 60, hint: 'Малая площадь — выше цена за метр' },
  { key: 'coef.terrace', value: 0.55, label: 'Терраса от цены метра дома', unit: '×', group: 'coef', isStub: true, sortOrder: 70 },

  { key: 'option.foundation', value: 3500, label: 'Свайный фундамент, за м²', unit: '₽/м²', group: 'options', isStub: true, sortOrder: 80 },
  { key: 'option.deliveryPerKm', value: 90, label: 'Доставка, за км', unit: '₽/км', group: 'options', isStub: true, sortOrder: 90 },

  { key: 'result.spread', value: 0.12, label: 'Ширина диапазона', unit: '±', group: 'result', isStub: true, sortOrder: 100, hint: '0.12 значит ±12% вокруг расчётной суммы' },
  { key: 'result.minTotal', value: 450000, label: 'Минимальная сумма заказа', unit: '₽', group: 'result', isStub: true, sortOrder: 110 },
] as const;

// ---------------------------------------------------------------- ЗАПУСК

async function loadMediaIndex(): Promise<MediaRecord[]> {
  const indexPath = path.join(process.cwd(), 'public', 'uploads', 'mediaIndex.json');
  try {
    const raw = await readFile(indexPath, 'utf8');
    return JSON.parse(raw) as MediaRecord[];
  } catch (error) {
    console.warn(
      `\n! mediaIndex.json не найден или не читается (${(error as Error).message}).\n` +
        `  Контент будет создан без фотографий. Выполните: npm run media:import\n`,
    );
    return [];
  }
}

async function main() {
  console.log('Сидирование базы…\n');

  // --- Проекты ---
  const projectIdBySlug = new Map<string, string>();
  for (const p of PROJECTS) {
    const { rooms, ...data } = p;
    const project = await db.project.upsert({
      where: { slug: p.slug },
      create: { ...data },
      update: { ...data },
    });
    projectIdBySlug.set(p.slug, project.id);

    await db.room.deleteMany({ where: { projectId: project.id } });
    if (rooms.length) {
      await db.room.createMany({
        data: rooms.map((r, i) => ({ ...r, projectId: project.id, sortOrder: i })),
      });
    }
  }
  console.log(`Проекты: ${PROJECTS.length}`);

  // --- Объекты ---
  const workIdBySlug = new Map<string, string>();
  for (const w of WORKS) {
    const { projectSlug, ...data } = w;
    const work = await db.work.upsert({
      where: { slug: w.slug },
      create: { ...data, projectId: projectIdBySlug.get(projectSlug) ?? null },
      update: { ...data, projectId: projectIdBySlug.get(projectSlug) ?? null },
    });
    workIdBySlug.set(w.slug, work.id);
  }
  console.log(`Объекты: ${WORKS.length}`);

  // --- Комплектации ---
  for (const pack of PACKAGES) {
    const { items, ...data } = pack;
    const created = await db.package.upsert({
      where: { key: pack.key },
      create: { ...data },
      update: { ...data },
    });
    await db.packageItem.deleteMany({ where: { packageId: created.id } });
    await db.packageItem.createMany({
      data: items.map((it, i) => ({ ...it, packageId: created.id, sortOrder: i })),
    });
  }
  console.log(`Комплектации: ${PACKAGES.length}`);

  // --- Этапы ---
  await db.stage.deleteMany();
  await db.stage.createMany({
    data: STAGES.map((s, i) => ({ ...s, sortOrder: i })),
  });
  console.log(`Этапы: ${STAGES.length}`);

  // Отзывы наполняются отдельной командой npm run reviews:import:
  // ролики приходят не из папки с материалами, а поштучно.
  // Карта нужна, чтобы уже существующие отзывы не потеряли привязку медиа.
  const reviewIdByKey = new Map<string, string>();
  for (const review of await db.review.findMany({ select: { id: true, key: true } })) {
    reviewIdByKey.set(review.key, review.id);
  }

  // --- Настройки ---
  for (const s of SETTINGS) {
    const payload = {
      value: s.value,
      valueType: 'valueType' in s ? (s.valueType as string) : 'TEXT',
      group: s.group,
      label: s.label,
      hint: 'hint' in s ? (s.hint as string) : null,
    };
    await db.setting.upsert({
      where: { key: s.key },
      create: { key: s.key, ...payload },
      // Значения, уже отредактированные в админке, не перетираем —
      // обновляем только служебные поля.
      update: { group: payload.group, label: payload.label, hint: payload.hint },
    });
  }
  console.log(`Настройки: ${SETTINGS.length}`);

  // --- Калькулятор ---
  for (const c of CALC_PARAMS) {
    const meta = {
      label: c.label,
      unit: c.unit ?? null,
      group: c.group,
      isStub: c.isStub,
      sortOrder: c.sortOrder,
      hint: 'hint' in c ? (c.hint as string) : null,
    };
    await db.calcParam.upsert({
      where: { key: c.key },
      create: { key: c.key, value: c.value, ...meta },
      update: meta, // цену, если её уже поправили, оставляем как есть
    });
  }
  console.log(`Параметры калькулятора: ${CALC_PARAMS.length} (все — заглушки)`);

  // --- Медиа ---
  const mediaIndex = await loadMediaIndex();
  // Чистим только то, чем управляет media:import.
  // Видеоотзывы живут своей жизнью — их заводит reviews:import,
  // и в mediaIndex.json их нет. Без этого условия повторное
  // сидирование молча отвязывало видео от всех отзывов.
  await db.media.deleteMany({ where: { reviewId: null } });

  let attached = 0;
  let skipped = 0;

  for (const record of mediaIndex) {
    for (const att of record.attachments) {
      let projectId: string | null = null;
      let workId: string | null = null;
      let reviewId: string | null = null;

      if (att.owner === 'review') {
        reviewId = reviewIdByKey.get(att.key) ?? null;
        if (!reviewId) {
          console.warn(`  ! отзыв «${att.key}» не найден для ${record.name}`);
          skipped++;
          continue;
        }
      } else if (att.owner === 'project') {
        projectId = projectIdBySlug.get(att.key) ?? null;
        if (!projectId) {
          console.warn(`  ! проект «${att.key}» не найден для ${record.name}`);
          skipped++;
          continue;
        }
      } else if (att.owner === 'work') {
        workId = workIdBySlug.get(att.key) ?? null;
        if (!workId) {
          console.warn(`  ! объект «${att.key}» не найден для ${record.name}`);
          skipped++;
          continue;
        }
      }
      // owner === 'site' — медиа без владельца, ищется по kind

      try {
        await db.media.create({
          data: {
            kind: att.kind,
            src: record.src,
            srcOriginal: record.srcOriginal,
            poster: record.poster ?? null,
            width: record.width,
            height: record.height,
            duration: record.duration ?? null,
            alt: record.alt,
            caption: att.caption ?? null,
            blurDataUrl: record.blurDataUrl || null,
            isCover: att.isCover ?? false,
            sortOrder: att.order,
            projectId,
            workId,
            reviewId,
          },
        });
        attached++;
      } catch (error) {
        console.warn(`  ! медиа ${record.name}: ${(error as Error).message}`);
        skipped++;
      }
    }
  }
  console.log(`Медиа: создано ${attached}${skipped ? `, пропущено ${skipped}` : ''}`);

  console.log('\nГотово.');
  console.log('Напоминание: цены в калькуляторе — заглушки. Замените их в /admin.');
}

main()
  .catch((error) => {
    console.error('Сидирование прервано:', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
