/**
 * Карта исходных материалов: что это за файл, как его назвать
 * и к каким сущностям он привязывается.
 *
 * Собрана по результатам разбора папки, см. docs/mediaInventory.md.
 * Один исходник обрабатывается ровно один раз, но может быть привязан
 * к нескольким владельцам (например, фото идёт и в карточку проекта,
 * и в галерею реализованного объекта).
 */

/** PHOTO — фасад, INTERIOR — интерьер, RENDER — 3D, PLAN — планировка */
export type MediaKind =
  | 'PHOTO'
  | 'INTERIOR'
  | 'RENDER'
  | 'PLAN'
  | 'VIDEO'
  | 'PRODUCTION'
  | 'FOUNDER'
  | 'BRAND'
  | 'REVIEW'
  | 'HERO';

export type Attachment = {
  /** project | work | site | review */
  owner: 'project' | 'work' | 'site' | 'review';
  /** слаг проекта/объекта либо ключ настройки сайта */
  key: string;
  kind: MediaKind;
  order: number;
  isCover?: boolean;
  caption?: string;
};

export type SourceMedia = {
  /** имя файла в исходной папке */
  file: string;
  /** читаемое имя выходного файла без расширения */
  name: string;
  /** подпапка внутри /public/uploads */
  folder: 'projects' | 'works' | 'plans' | 'production' | 'site' | 'reviews';
  alt: string;
  attachments: Attachment[];
};

export const SOURCE_DIR_ENV = 'BATYR_MEDIA_DIR';
export const DEFAULT_SOURCE_DIR = 'C:\\Users\\Almaz\\Desktop\\Батырхан';

export const VIDEO_FILE =
  'AQNcO_imTZmld7z2cSKYbclzt6Nbe0QjSFKNmBl6YBNA5rmM53OxcrDTBo5QC3Z8.mp4';

/**
 * Обрезаем хвост с призывом «напишите мне в директ слово ДОМ» (начинается на 39,5 с).
 * Всё содержательное — производство, 50 проектов, доставка по России — остаётся.
 */
export const VIDEO_TRIM_SECONDS = 39.5;

/**
 * Кадр для постера видео. На нулевой секунде вывеска «БАТЫРХАН группа компаний»
 * видна целиком и субтитр ещё не появился — дальше по таймлайну название
 * перекрывается штабелем бруса.
 */
export const VIDEO_POSTER_AT = 0;

/**
 * Стоп-кадры производства: единственные снимки цеха, которые у нас есть.
 * Тайм-коды выверены по кадрам — ffmpeg вызывается с точным поиском
 * (-ss после -i), иначе он прыгает к ближайшему ключевому кадру.
 */
export const PRODUCTION_STILLS: { at: number; name: string; alt: string }[] = [
  // Нулевая секунда: вывеска читается целиком и субтитра ещё нет
  { at: 0, name: 'ceh-vyveska', alt: 'Производство группы компаний «Батырхан» в Уфе' },
  { at: 6.0, name: 'frezy-stanka', alt: 'Фрезы профилирующего станка снимают профиль бруса' },
  { at: 10.0, name: 'profil-brusa', alt: 'Профиль бруса: замок без перекосов' },
  { at: 14.0, name: 'shtabel-brusa', alt: 'Штабели профилированного бруса в цехе' },
  { at: 20.0, name: 'narezka-chashek', alt: 'Нарезка чашки на станке с лазерной разметкой' },
  { at: 23.5, name: 'chashki-na-uglu', alt: 'Угол дома: венцы, собранные на непродуваемую чашку' },
  { at: 25.0, name: 'sborka-sruba', alt: 'Сборка сруба из пронумерованного домокомплекта' },
  { at: 37.0, name: 'otgruzka-domokomplekta', alt: 'Отгрузка домокомплекта заказчику' },
];

/**
 * Видеоотзывы заказчиков.
 *
 * Имена заказчиков в материалах не названы — в подписях стоят нейтральные
 * «Заказчик» / «Заказчица» и только те факты, которые видно на экране.
 * Подставить настоящие имена нужно в админке, см. docs/dataGaps.md.
 */
export type ReviewVideo = {
  file: string;
  name: string;
  /** Секунда, с которой берётся постер: нужен кадр с человеком в лице */
  posterAt: number;
  /** Ширина веб-версии; исходники бывают 1072 px */
  maxWidth: number;
  crf: number;
  authorName: string;
  authorInfo: string;
  alt: string;
};

export const REVIEW_VIDEOS: ReviewVideo[] = [
  {
    file: 'IMG_5560.MOV',
    name: 'otzyv-razgovor-v-dome',
    posterAt: 1.0,
    maxWidth: 720,
    crf: 30,
    authorName: 'Заказчик',
    authorInfo: 'Разговор в построенном доме',
    alt: 'Видеоотзыв: заказчик и Батырхан разговаривают в готовом доме',
  },
  {
    file: 'IMG_2249.MOV',
    name: 'otzyv-zakazchica',
    posterAt: 8.0,
    maxWidth: 720,
    crf: 30,
    authorName: 'Заказчица',
    authorInfo: 'О работе и сроках',
    alt: 'Видеоотзыв заказчицы о работе компании',
  },
  {
    file: 'IMG_7469.MOV',
    name: 'sdacha-doma-tuymazy',
    posterAt: 28.0,
    maxWidth: 720,
    crf: 32,
    authorName: 'Семья заказчиков',
    authorInfo: 'Сдача дома, Туймазинский район',
    alt: 'Сдача дома в Туймазинском районе: семья заезжает в новый дом',
  },
  {
    file: 'IMG_2113.MP4',
    name: 'sdacha-doma-vruchenie',
    posterAt: 16.0,
    maxWidth: 720,
    crf: 30,
    authorName: 'Семья заказчиков',
    authorInfo: 'День передачи дома',
    alt: 'Передача готового дома заказчикам',
  },
  {
    file: 'IMG_7051.MP4',
    name: 'otzyv-na-kameru',
    posterAt: 2.0,
    maxWidth: 480,
    crf: 30,
    authorName: 'Заказчица',
    authorInfo: 'Видеоотзыв',
    alt: 'Видеоотзыв заказчицы',
  },
];

export const MEDIA: SourceMedia[] = [
  // ---------------------------------------------------------------- БРЕНД
  {
    file: 'photo_2026-03-21_21-53-03.jpg',
    name: 'brand-titul',
    folder: 'site',
    alt: 'Группа компаний «Батырхан»: варианты стенокомплектов, домокомплектов со сборкой и тёплого контура',
    attachments: [{ owner: 'site', key: 'brandCover', kind: 'BRAND', order: 0 }],
  },

  // ------------------------------------------------------------- СЕМЕЙКА
  {
    file: 'photo_2026-08-07_00-11-29.jpg',
    name: 'semeyka-fasad-grafit',
    folder: 'projects',
    alt: 'Дом «Семейка» 67,6 м²: комбинированный фасад из дерева и графитового металла, панорамные окна',
    attachments: [
      { owner: 'project', key: 'semeyka', kind: 'PHOTO', order: 0, isCover: true },
      { owner: 'site', key: 'heroImage', kind: 'PHOTO', order: 0 },
    ],
  },
  {
    file: 'photo_2026-08-07_00-11-36.jpg',
    name: 'semeyka-fasad-zakat',
    folder: 'projects',
    alt: 'Дом «Семейка» 67,6 м² из светлой сосны с широкой крытой террасой на закате',
    attachments: [{ owner: 'project', key: 'semeyka', kind: 'PHOTO', order: 1 }],
  },
  {
    file: 'photo_2026-08-07_00-10-26.jpg',
    name: 'semeyka-render',
    folder: 'projects',
    alt: 'Проект «Семейка»: визуализация одноэтажного дома из профилированного бруса с террасой',
    attachments: [{ owner: 'project', key: 'semeyka', kind: 'RENDER', order: 2 }],
  },
  {
    file: 'photo_2026-08-07_00-10-30.jpg',
    name: 'semeyka-plan-1etazh',
    folder: 'plans',
    alt: 'Планировка дома «Семейка» 67 м²: кухня-гостиная 22,4 м², две спальни, кабинет, терраса 17,4 м²',
    attachments: [
      { owner: 'project', key: 'semeyka', kind: 'PLAN', order: 0, caption: 'Первый этаж' },
    ],
  },

  // -------------------------------------------- ОБЪЕКТ: «Семейка» в поле
  {
    file: 'photo_2026-08-07_00-10-35.jpg',
    name: 'obj-semeyka-fasad-sumerki',
    folder: 'works',
    alt: 'Готовый дом «Семейка» на железобетонных сваях, сумерки над полем',
    attachments: [
      { owner: 'work', key: 'dom-semeyka-pole', kind: 'PHOTO', order: 0, isCover: true },
    ],
  },
  {
    file: 'photo_2026-08-07_00-10-41.jpg',
    name: 'obj-semeyka-fasad-i-terrasa',
    folder: 'works',
    alt: 'Дом «Семейка»: общий вид сбоку и терраса с дощатым настилом',
    attachments: [{ owner: 'work', key: 'dom-semeyka-pole', kind: 'PHOTO', order: 1 }],
  },
  {
    file: 'photo_2026-08-07_00-10-43.jpg',
    name: 'obj-semeyka-fasady',
    folder: 'works',
    alt: 'Дом «Семейка»: боковой и торцевой фасады, видны железобетонные сваи',
    attachments: [{ owner: 'work', key: 'dom-semeyka-pole', kind: 'PHOTO', order: 2 }],
  },
  {
    file: 'photo_2026-08-07_00-10-38.jpg',
    name: 'obj-semeyka-interyery',
    folder: 'works',
    alt: 'Интерьеры дома «Семейка»: кухня-гостиная, санузел-котельная, коридор, спальня',
    attachments: [{ owner: 'work', key: 'dom-semeyka-pole', kind: 'INTERIOR', order: 3 }],
  },

  // --------------------------------------------------- СЕМЕЙНЫЕ ТРАДИЦИИ
  {
    file: 'photo_2026-08-07_00-11-49.jpg',
    name: 'tradicii-fasad-chernyy',
    folder: 'projects',
    alt: 'Дом «Семейные традиции» 116,3 м²: чёрный фасад, белые наличники и балкон',
    attachments: [
      { owner: 'project', key: 'semeynye-tradicii', kind: 'PHOTO', order: 0, isCover: true },
      { owner: 'work', key: 'dom-tradicii-temnyy', kind: 'PHOTO', order: 5 },
    ],
  },
  {
    file: 'photo_2026-08-07_00-11-26.jpg',
    name: 'tradicii-fasad-korichnevyy',
    folder: 'projects',
    alt: 'Дом «Семейные традиции» 116,3 м² в коричневой пропитке с балконом на точёных балясинах',
    attachments: [
      { owner: 'project', key: 'semeynye-tradicii', kind: 'PHOTO', order: 1 },
      { owner: 'work', key: 'dom-tradicii-korichnevyy', kind: 'PHOTO', order: 0, isCover: true },
    ],
  },
  {
    file: 'photo_2026-08-07_00-11-57.jpg',
    name: 'tradicii-fasad-sosna',
    folder: 'projects',
    alt: 'Дом «Семейные традиции» 116,3 м² цвета медовой сосны с террасой-навесом',
    attachments: [
      { owner: 'project', key: 'semeynye-tradicii', kind: 'PHOTO', order: 2 },
      { owner: 'work', key: 'dom-tradicii-sosna', kind: 'PHOTO', order: 0, isCover: true },
    ],
  },
  {
    file: 'photo_2026-08-07_00-11-44.jpg',
    name: 'tradicii-fasad-krestovoe',
    folder: 'projects',
    alt: 'Дом «Семейные традиции»: коричневый фасад, крестовое ограждение балкона',
    attachments: [
      { owner: 'project', key: 'semeynye-tradicii', kind: 'PHOTO', order: 3 },
      { owner: 'work', key: 'dom-tradicii-korichnevyy', kind: 'PHOTO', order: 1 },
    ],
  },
  {
    file: 'photo_2026-08-07_00-10-53.jpg',
    name: 'tradicii-proekt-i-realizaciya',
    folder: 'projects',
    alt: 'Дом «Семейные традиции»: визуализация проекта и построенный дом',
    attachments: [
      { owner: 'project', key: 'semeynye-tradicii', kind: 'RENDER', order: 4 },
      { owner: 'work', key: 'dom-tradicii-temnyy', kind: 'PHOTO', order: 1 },
    ],
  },

  // ------------------------------- ОБЪЕКТ: «Семейные традиции», тёмный
  {
    file: 'photo_2026-08-07_00-10-50.jpg',
    name: 'obj-tradicii-temnyy-pole',
    folder: 'works',
    alt: 'Двухэтажный дом «Семейные традиции» с тёмным фасадом в цветущем поле',
    attachments: [
      { owner: 'work', key: 'dom-tradicii-temnyy', kind: 'PHOTO', order: 0, isCover: true },
    ],
  },
  {
    file: 'photo_2026-08-07_00-10-56.jpg',
    name: 'obj-tradicii-temnyy-naves',
    folder: 'works',
    alt: 'Дом «Семейные традиции»: тёмный фасад, балкон и навес-крыльцо',
    attachments: [{ owner: 'work', key: 'dom-tradicii-temnyy', kind: 'PHOTO', order: 2 }],
  },
  {
    file: 'photo_2026-08-07_00-10-59.jpg',
    name: 'obj-tradicii-interyery-1etazh',
    folder: 'works',
    alt: 'Интерьеры первого этажа: котельная, лестница на второй этаж, белая отделка',
    attachments: [{ owner: 'work', key: 'dom-tradicii-temnyy', kind: 'INTERIOR', order: 3 }],
  },
  {
    file: 'photo_2026-08-07_00-11-02.jpg',
    name: 'obj-tradicii-interyery-2etazh',
    folder: 'works',
    alt: 'Интерьеры второго этажа: мансардные комнаты со скосами, выход на балкон',
    attachments: [{ owner: 'work', key: 'dom-tradicii-temnyy', kind: 'INTERIOR', order: 4 }],
  },

  // ------------------------------------------------------ ОСТАЛЬНЫЕ ДОМА
  {
    file: 'photo_2026-08-07_00-12-00.jpg',
    name: 'shale-fasad',
    folder: 'projects',
    alt: 'Дом «Шале у озера» 62,5 м²: панорамное остекление во всю высоту фронтона, сосновый бор',
    attachments: [
      { owner: 'project', key: 'shale-u-ozera', kind: 'PHOTO', order: 0, isCover: true },
      { owner: 'work', key: 'dom-shale-u-ozera', kind: 'PHOTO', order: 0, isCover: true },
    ],
  },
  {
    file: 'photo_2026-08-07_00-11-41.jpg',
    name: 'lunnaya-tropa-fasad',
    folder: 'projects',
    alt: 'Дом «Лунная тропа» 61,3 м²: ломаная кровля и панорамное остекление в пол',
    attachments: [
      { owner: 'project', key: 'lunnaya-tropa', kind: 'PHOTO', order: 0, isCover: true },
      { owner: 'work', key: 'dom-lunnaya-tropa', kind: 'PHOTO', order: 0, isCover: true },
    ],
  },
  {
    file: 'photo_2026-08-07_00-11-55.jpg',
    name: 'osenniy-fasad-zima',
    folder: 'projects',
    alt: 'Дом «Осенний» 58,4 м²: вертикальная обшивка светлым деревом в графитовом портале, зима',
    attachments: [
      { owner: 'project', key: 'osenniy', kind: 'PHOTO', order: 0, isCover: true },
      { owner: 'work', key: 'dom-osenniy', kind: 'PHOTO', order: 0, isCover: true },
    ],
  },
  {
    file: 'photo_2026-08-07_00-11-46.jpg',
    name: 'schastye-fasad',
    folder: 'projects',
    alt: 'Дом «Счастье» 54,4 м² с большим панорамным окном на фоне гор',
    attachments: [
      { owner: 'project', key: 'schastye', kind: 'PHOTO', order: 0, isCover: true },
      { owner: 'work', key: 'dom-schastye', kind: 'PHOTO', order: 0, isCover: true },
    ],
  },
  {
    file: 'photo_2026-08-07_00-11-52.jpg',
    name: 'a-freym-fasad',
    folder: 'projects',
    alt: 'Дом «А-фрейм» 51,4 м²: остеклённый фронтон и деревянная терраса',
    attachments: [
      { owner: 'project', key: 'a-freym', kind: 'PHOTO', order: 0, isCover: true },
      { owner: 'work', key: 'dom-a-freym', kind: 'PHOTO', order: 0, isCover: true },
    ],
  },

  // ----------------------------------------------------------------- БАНЯ
  {
    file: 'photo_2026-08-07_00-11-06.jpg',
    name: 'banya-render',
    folder: 'projects',
    alt: 'Баня из профилированного бруса: визуализация с террасой под навесом',
    attachments: [{ owner: 'project', key: 'banya', kind: 'RENDER', order: 0, isCover: true }],
  },
  {
    file: 'photo_2026-08-07_00-11-08.jpg',
    name: 'banya-plan',
    folder: 'plans',
    alt: 'Планировка бани 3250 × 4250 мм: парная-моечная, комната отдыха, терраса',
    attachments: [{ owner: 'project', key: 'banya', kind: 'PLAN', order: 0, caption: 'План бани' }],
  },
  {
    file: 'photo_2026-08-07_00-11-10.jpg',
    name: 'banya-fasad',
    folder: 'works',
    alt: 'Готовая баня из профилированного бруса с малиновой кровлей',
    attachments: [
      { owner: 'project', key: 'banya', kind: 'PHOTO', order: 1 },
      { owner: 'work', key: 'banya-s-terrasoy', kind: 'PHOTO', order: 0, isCover: true },
    ],
  },
  {
    file: 'photo_2026-08-07_00-11-13.jpg',
    name: 'obj-banya-fasady',
    folder: 'works',
    alt: 'Баня: вид с торца против солнца и вид сбоку с террасой',
    attachments: [{ owner: 'work', key: 'banya-s-terrasoy', kind: 'PHOTO', order: 1 }],
  },
  {
    file: 'photo_2026-08-07_00-11-15.jpg',
    name: 'obj-banya-interyery',
    folder: 'works',
    alt: 'Интерьеры бани: печь-каменка с баком, парная с двухъярусным полком, комната отдыха',
    attachments: [{ owner: 'work', key: 'banya-s-terrasoy', kind: 'INTERIOR', order: 2 }],
  },

  // ------------------------------------------------------------ ОСНОВАТЕЛЬ
  {
    file: 'photo_2026-08-07_00-11-34.jpg',
    name: 'founder-batyrhan',
    folder: 'site',
    alt: 'Батырхан Хамидуллин, основатель группы компаний «Батырхан», у построенного дома',
    attachments: [
      { owner: 'site', key: 'founderPhoto', kind: 'FOUNDER', order: 0 },
      // Тот же кадр работает и первым экраном: это не карточка конкретного
      // проекта с площадью, а общее приглашение выбрать дом
      { owner: 'site', key: 'hero', kind: 'HERO', order: 0 },
    ],
  },
];
