/**
 * Единый конфиг сайта: навигация, значения по умолчанию, тексты интерфейса.
 *
 * Контент, который редактируется из админки (контакты, тексты блоков,
 * координаты карты), живёт в таблице Setting. Здесь — только то, что
 * относится к самому интерфейсу, плюс запасные значения на случай пустой БД.
 * В разметке компонентов строк быть не должно.
 */

/** Реквизиты. Приоритет — у значений из таблицы Setting. */
export const legalDefaults = {
  entityName: 'ИП Хамидуллин Батырхан Булатович',
  inn: '025904937511',
  ogrnip: '323028000031991',
} as const;

export const siteMeta = {
  name: 'Батырхан',
  legalName: 'Группа компаний «Батырхан»',
  tagline: 'Дома из профилированного бруса под ключ',
  description:
    'Собственное производство профилированного бруса в Уфе. Стенокомплекты, домокомплекты со сборкой и тёплый контур. Более 50 готовых проектов, доставка по всей России.',
  city: 'Уфа',
  locale: 'ru_RU',
} as const;

/** Запасные контакты. Приоритет всегда у значений из таблицы Setting. */
export const contactDefaults = {
  phone: '+7 989 958 56 34',
  phoneRaw: '+79899585634',
  phonePerson: 'Батырхан',
  telegram: 'https://t.me/gkbatyrkhan',
  telegramLabel: '@gkbatyrkhan',
  instagram: 'https://www.instagram.com/batyrkhan_khamidullin/',
  instagramLabel: '@batyrkhan_khamidullin',
  address: 'г. Уфа, ул. Даяна Мурзина, 9/1',
  addressShort: 'ул. Даяна Мурзина, 9/1',
  mapLat: 54.7431,
  mapLon: 55.9678,
  mapZoom: 16,
  workHours: 'Пн–Сб, 9:00–19:00',
} as const;

export const nav = {
  main: [
    { href: '/catalog', label: 'Проекты' },
    { href: '/production', label: 'Производство' },
    { href: '/works', label: 'Наши объекты' },
    { href: '/#packages', label: 'Комплектации' },
    { href: '/#contacts', label: 'Контакты' },
  ],
  footer: [
    { href: '/catalog', label: 'Каталог проектов' },
    { href: '/catalog?category=BANYA', label: 'Бани' },
    { href: '/production', label: 'Производство' },
    { href: '/works', label: 'Реализованные объекты' },
    { href: '/#calc', label: 'Расчёт стоимости' },
    { href: '/#custom', label: 'Индивидуальный проект' },
  ],
} as const;

/** Нумерованные секции главной — порядок задан ТЗ. */
export const homeSections = [
  { id: 'hero', num: null, title: null },
  { id: 'advantages', num: '01', title: 'Почему мы' },
  { id: 'catalog', num: '02', title: 'Проекты' },
  { id: 'packages', num: '03', title: 'Комплектации' },
  { id: 'production', num: '04', title: 'Производство' },
  { id: 'works', num: '05', title: 'Наши объекты' },
  { id: 'stages', num: '06', title: 'Как мы работаем' },
  { id: 'founder', num: '07', title: 'Об основателе' },
  { id: 'reviews', num: '08', title: 'Отзывы' },
  { id: 'calc', num: '09', title: 'Расчёт стоимости' },
  { id: 'contacts', num: '10', title: 'Контакты' },
] as const;

export const ui = {
  cta: {
    catalog: 'Смотреть проекты',
    calc: 'Рассчитать стоимость',
    more: 'Подробнее',
    allProjects: 'Весь каталог',
    allWorks: 'Все объекты',
    callback: 'Заказать звонок',
    telegram: 'Написать в Telegram',
    call: 'Позвонить',
    route: 'Построить маршрут',
    submit: 'Отправить заявку',
    sending: 'Отправляем…',
    reset: 'Сбросить',
    filters: 'Фильтры',
    apply: 'Показать',
    close: 'Закрыть',
    watchFull: 'Смотреть целиком',
    sound: 'Включить звук',
    soundOff: 'Выключить звук',
  },
  labels: {
    area: 'Площадь',
    floors: 'Этажность',
    size: 'Габариты',
    terrace: 'Терраса',
    mansard: 'Мансарда',
    balcony: 'Балкон',
    ceiling: 'Потолки',
    foundation: 'Фундамент',
    rooms: 'Помещения',
    plans: 'Планировки',
    included: 'Что входит',
    similar: 'Похожие проекты',
    gallery: 'Галерея',
    video: 'Видео',
    specs: 'Характеристики',
  },
  units: {
    m2: 'м²',
    mm: 'мм',
    m: 'м',
    floors: (n: number) => (n === 1 ? '1 этаж' : n === 2 ? '2 этажа' : `${n} этажа`),
  },
  forms: {
    name: 'Как вас зовут',
    phone: 'Телефон',
    email: 'E-mail',
    comment: 'Комментарий',
    areaWanted: 'Желаемая площадь, м²',
    floorsWanted: 'Этажность',
    hasLand: 'Участок уже есть',
    file: 'Эскиз или планировка',
    fileHint: 'PDF, JPG, PNG или DWG до 20 МБ',
    consent:
      'Я согласен на обработку персональных данных и принимаю политику конфиденциальности',
    consentRequired: 'Без согласия на обработку данных мы не сможем принять заявку',
    phoneInvalid: 'Проверьте номер: нужно 11 цифр, например +7 999 123-45-67',
    nameRequired: 'Напишите, как к вам обращаться',
    genericError: 'Не получилось отправить. Попробуйте ещё раз или позвоните нам.',
  },
  thanks: {
    title: 'Заявка принята',
    text: 'Батырхан свяжется с вами в течение рабочего дня. Если хочется быстрее — напишите в Telegram, там отвечаем сразу.',
  },
  calc: {
    disclaimerShort: 'Расчёт предварительный',
    disclaimer:
      'Это ориентир, а не смета. Итоговая стоимость зависит от участка, грунта, логистики и выбранных материалов. Точную смету считаем после разговора — обычно в течение дня.',
  },
  empty: {
    reviews: 'Отзывы пока не добавлены',
    works: 'Объекты пока не добавлены',
    projects: 'По заданным условиям проектов нет. Попробуйте расширить диапазон площади.',
  },
} as const;

/** Ключи настроек, которые редактируются в админке. */
export const settingKeys = {
  phone: 'contacts.phone',
  phoneRaw: 'contacts.phoneRaw',
  phonePerson: 'contacts.phonePerson',
  telegram: 'contacts.telegram',
  instagram: 'contacts.instagram',
  address: 'contacts.address',
  mapLat: 'contacts.mapLat',
  mapLon: 'contacts.mapLon',
  mapZoom: 'contacts.mapZoom',
  workHours: 'contacts.workHours',

  heroTitle: 'hero.title',
  heroAccent: 'hero.accent',
  heroLead: 'hero.lead',
  heroFacts: 'hero.facts',

  productionTitle: 'production.title',
  productionText: 'production.text',
  productionTech: 'production.tech',

  founderName: 'founder.name',
  founderRole: 'founder.role',
  founderText: 'founder.text',

  customTitle: 'custom.title',
  customText: 'custom.text',
  customSteps: 'custom.steps',

  metrikaId: 'integrations.metrikaId',
  reviewsVisible: 'blocks.reviewsVisible',

  legalEntityName: 'legal.entityName',
  legalInn: 'legal.inn',
  legalOgrnip: 'legal.ogrnip',
} as const;
