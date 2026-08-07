'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { unlink } from 'node:fs/promises';
import path from 'node:path';

import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { isLeadStatus } from '@/lib/enums';

/** Сброс кэша публичных страниц после правки контента. */
function revalidateSite() {
  revalidatePath('/', 'layout');
}

function str(form: FormData, key: string): string {
  return String(form.get(key) ?? '').trim();
}
function optStr(form: FormData, key: string): string | null {
  const value = str(form, key);
  return value === '' ? null : value;
}
function num(form: FormData, key: string): number | null {
  const value = str(form, key).replace(',', '.');
  if (value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function int(form: FormData, key: string): number | null {
  const value = num(form, key);
  return value === null ? null : Math.round(value);
}
function bool(form: FormData, key: string): boolean {
  return form.get(key) === 'on' || form.get(key) === 'true';
}

// ------------------------------------------------------------- ПРОЕКТЫ

export async function saveProject(formData: FormData) {
  await requireSession();

  const id = optStr(formData, 'id');
  const title = str(formData, 'title');
  if (!title) throw new Error('Название обязательно');

  const slug = slugify(str(formData, 'slug') || title);

  const data = {
    title,
    slug,
    category: str(formData, 'category') || 'HOUSE',
    areaM2: num(formData, 'areaM2'),
    floors: int(formData, 'floors'),
    widthMm: int(formData, 'widthMm'),
    lengthMm: int(formData, 'lengthMm'),
    ceilingMm: int(formData, 'ceilingMm'),
    hasTerrace: bool(formData, 'hasTerrace'),
    terraceAreaM2: num(formData, 'terraceAreaM2'),
    hasMansard: bool(formData, 'hasMansard'),
    hasBalcony: bool(formData, 'hasBalcony'),
    basePackage: optStr(formData, 'basePackage'),
    foundation: optStr(formData, 'foundation'),
    tagline: optStr(formData, 'tagline'),
    description: optStr(formData, 'description'),
    featured: bool(formData, 'featured'),
    visible: bool(formData, 'visible'),
    sortOrder: int(formData, 'sortOrder') ?? 0,
    seoTitle: optStr(formData, 'seoTitle'),
    seoDescription: optStr(formData, 'seoDescription'),
  };

  let projectId = id;
  try {
    if (id) {
      await db.project.update({ where: { id }, data });
    } else {
      const created = await db.project.create({ data });
      projectId = created.id;
    }
  } catch (error) {
    console.error('[admin] сохранение проекта:', error);
    throw new Error('Не удалось сохранить проект. Возможно, такой слаг уже занят.');
  }

  // Помещения: приходят параллельными массивами, полностью переписываем
  if (projectId) {
    const roomTitles = formData.getAll('roomTitle').map((v) => String(v).trim());
    const roomAreas = formData.getAll('roomArea').map((v) => String(v).trim());
    try {
      await db.room.deleteMany({ where: { projectId } });
      const rows = roomTitles
        .map((roomTitle, i) => ({
          projectId: projectId as string,
          title: roomTitle,
          areaM2: roomAreas[i] ? Number(roomAreas[i].replace(',', '.')) : null,
          sortOrder: i,
        }))
        .filter((row) => row.title.length > 0);
      if (rows.length) await db.room.createMany({ data: rows });
    } catch (error) {
      console.error('[admin] сохранение помещений:', error);
    }
  }

  revalidateSite();
  redirect(`/admin/projects/${projectId}?saved=1`);
}

export async function deleteProject(formData: FormData) {
  await requireSession();
  const id = str(formData, 'id');
  try {
    await db.project.delete({ where: { id } });
  } catch (error) {
    console.error('[admin] удаление проекта:', error);
    throw new Error('Не удалось удалить проект');
  }
  revalidateSite();
  redirect('/admin/projects');
}

// -------------------------------------------------------------- ОБЪЕКТЫ

export async function saveWork(formData: FormData) {
  await requireSession();

  const id = optStr(formData, 'id');
  const title = str(formData, 'title');
  if (!title) throw new Error('Название обязательно');

  const data = {
    title,
    slug: slugify(str(formData, 'slug') || title),
    projectId: optStr(formData, 'projectId'),
    location: optStr(formData, 'location'),
    year: int(formData, 'year'),
    durationText: optStr(formData, 'durationText'),
    packageKey: optStr(formData, 'packageKey'),
    facadeColor: optStr(formData, 'facadeColor'),
    description: optStr(formData, 'description'),
    featured: bool(formData, 'featured'),
    visible: bool(formData, 'visible'),
    sortOrder: int(formData, 'sortOrder') ?? 0,
  };

  let workId = id;
  try {
    if (id) {
      await db.work.update({ where: { id }, data });
    } else {
      const created = await db.work.create({ data });
      workId = created.id;
    }
  } catch (error) {
    console.error('[admin] сохранение объекта:', error);
    throw new Error('Не удалось сохранить объект. Возможно, такой слаг уже занят.');
  }

  revalidateSite();
  redirect(`/admin/works/${workId}?saved=1`);
}

export async function deleteWork(formData: FormData) {
  await requireSession();
  const id = str(formData, 'id');
  try {
    await db.work.delete({ where: { id } });
  } catch (error) {
    console.error('[admin] удаление объекта:', error);
    throw new Error('Не удалось удалить объект');
  }
  revalidateSite();
  redirect('/admin/works');
}

// --------------------------------------------------------- КОМПЛЕКТАЦИИ

export async function savePackage(formData: FormData) {
  await requireSession();
  const id = str(formData, 'id');

  try {
    await db.package.update({
      where: { id },
      data: {
        title: str(formData, 'title'),
        subtitle: optStr(formData, 'subtitle'),
        summary: optStr(formData, 'summary'),
        visible: bool(formData, 'visible'),
        sortOrder: int(formData, 'sortOrder') ?? 0,
      },
    });

    // Состав переписываем целиком: порядок задаётся порядком полей в форме
    const titles = formData.getAll('itemTitle').map((v) => String(v).trim());
    const notes = formData.getAll('itemNote').map((v) => String(v).trim());

    await db.packageItem.deleteMany({ where: { packageId: id } });
    const rows = titles
      .map((itemTitle, i) => ({
        packageId: id,
        title: itemTitle,
        note: notes[i] || null,
        sortOrder: i,
      }))
      .filter((row) => row.title.length > 0);
    if (rows.length) await db.packageItem.createMany({ data: rows });
  } catch (error) {
    console.error('[admin] сохранение комплектации:', error);
    throw new Error('Не удалось сохранить комплектацию');
  }

  revalidateSite();
  redirect('/admin/packages?saved=1');
}

// ---------------------------------------------------------------- ЭТАПЫ

export async function saveStages(formData: FormData) {
  await requireSession();

  const titles = formData.getAll('stageTitle').map((v) => String(v).trim());
  const texts = formData.getAll('stageText').map((v) => String(v).trim());
  const durations = formData.getAll('stageDuration').map((v) => String(v).trim());

  try {
    await db.stage.deleteMany();
    const rows = titles
      .map((title, i) => ({
        title,
        text: texts[i] || null,
        durationText: durations[i] || null,
        sortOrder: i,
        visible: true,
      }))
      .filter((row) => row.title.length > 0);
    if (rows.length) await db.stage.createMany({ data: rows });
  } catch (error) {
    console.error('[admin] сохранение этапов:', error);
    throw new Error('Не удалось сохранить этапы');
  }

  revalidateSite();
  redirect('/admin/stages?saved=1');
}

// --------------------------------------------------------------- ОТЗЫВЫ

export async function saveReview(formData: FormData) {
  await requireSession();
  const id = str(formData, 'id');

  try {
    await db.review.update({
      where: { id },
      data: {
        authorName: str(formData, 'authorName') || 'Заказчик',
        authorInfo: optStr(formData, 'authorInfo'),
        text: optStr(formData, 'text'),
        visible: bool(formData, 'visible'),
        sortOrder: int(formData, 'sortOrder') ?? 0,
      },
    });
  } catch (error) {
    console.error('[admin] сохранение отзыва:', error);
    throw new Error('Не удалось сохранить отзыв');
  }

  revalidateSite();
  redirect('/admin/reviews?saved=1');
}

export async function deleteReview(formData: FormData) {
  await requireSession();
  try {
    await db.review.delete({ where: { id: str(formData, 'id') } });
  } catch (error) {
    console.error('[admin] удаление отзыва:', error);
    throw new Error('Не удалось удалить отзыв');
  }
  revalidateSite();
  redirect('/admin/reviews');
}

// ------------------------------------------------------------ НАСТРОЙКИ

export async function saveSettings(formData: FormData) {
  await requireSession();

  const updates: { key: string; value: string }[] = [];
  for (const [field, raw] of formData.entries()) {
    if (!field.startsWith('setting:')) continue;
    updates.push({ key: field.slice('setting:'.length), value: String(raw) });
  }

  // Чекбоксы не приходят в FormData, когда сняты, — восстанавливаем их из списка
  const boolKeys = formData.getAll('boolKey').map((v) => String(v));
  for (const key of boolKeys) {
    if (!updates.some((u) => u.key === key)) updates.push({ key, value: 'false' });
    else {
      const found = updates.find((u) => u.key === key)!;
      found.value = found.value === 'on' ? 'true' : found.value;
    }
  }

  try {
    for (const update of updates) {
      await db.setting.update({ where: { key: update.key }, data: { value: update.value } });
    }
  } catch (error) {
    console.error('[admin] сохранение настроек:', error);
    throw new Error('Не удалось сохранить настройки');
  }

  revalidateSite();
  redirect('/admin/settings?saved=1');
}

// ---------------------------------------------------------- КАЛЬКУЛЯТОР

export async function saveCalcParams(formData: FormData) {
  await requireSession();

  const updates: { key: string; value: number }[] = [];
  for (const [field, raw] of formData.entries()) {
    if (!field.startsWith('calc:')) continue;
    const value = Number(String(raw).replace(',', '.'));
    if (!Number.isFinite(value)) continue;
    updates.push({ key: field.slice('calc:'.length), value });
  }

  try {
    // Форма присылает все поля разом, включая нетронутые. Снимать пометку
    // «заглушка» со всех подряд нельзя: предупреждение о выдуманных ценах
    // исчезло бы, а сами цены остались бы выдуманными. Поэтому сравниваем
    // с тем, что лежит в базе, и снимаем флаг только с изменённых.
    const current = await db.calcParam.findMany({
      where: { key: { in: updates.map((u) => u.key) } },
      select: { key: true, value: true },
    });
    const currentByKey = new Map(current.map((row) => [row.key, row.value]));

    for (const update of updates) {
      const previous = currentByKey.get(update.key);
      const changed = previous === undefined || previous !== update.value;
      await db.calcParam.update({
        where: { key: update.key },
        data: changed ? { value: update.value, isStub: false } : { value: update.value },
      });
    }
  } catch (error) {
    console.error('[admin] сохранение параметров калькулятора:', error);
    throw new Error('Не удалось сохранить параметры');
  }

  revalidateSite();
  redirect('/admin/calc?saved=1');
}

// --------------------------------------------------------------- ЗАЯВКИ

export async function setLeadStatus(formData: FormData) {
  await requireSession();
  const id = str(formData, 'id');
  const status = str(formData, 'status');
  if (!isLeadStatus(status)) throw new Error('Неизвестный статус');

  try {
    await db.lead.update({ where: { id }, data: { status } });
  } catch (error) {
    console.error('[admin] смена статуса заявки:', error);
    throw new Error('Не удалось изменить статус');
  }
  revalidatePath('/admin/leads');
}

export async function deleteLead(formData: FormData) {
  await requireSession();
  const id = str(formData, 'id');

  try {
    // Сначала убираем приложенные файлы с диска, потом запись
    const files = await db.leadFile.findMany({ where: { leadId: id } });
    for (const file of files) {
      try {
        await unlink(path.join(process.cwd(), 'public', file.src.replace(/^\//, '')));
      } catch (error) {
        console.error('[admin] файл заявки не удалён:', error);
      }
    }
    await db.lead.delete({ where: { id } });
  } catch (error) {
    console.error('[admin] удаление заявки:', error);
    throw new Error('Не удалось удалить заявку');
  }
  revalidatePath('/admin/leads');
}

// ---------------------------------------------------------------- МЕДИА

export async function reorderMedia(formData: FormData) {
  await requireSession();
  const ids = formData.getAll('mediaId').map((v) => String(v));

  try {
    for (const [index, id] of ids.entries()) {
      await db.media.update({ where: { id }, data: { sortOrder: index } });
    }
  } catch (error) {
    console.error('[admin] изменение порядка медиа:', error);
    throw new Error('Не удалось сохранить порядок');
  }
  revalidateSite();
}

export async function setMediaCover(formData: FormData) {
  await requireSession();
  const id = str(formData, 'id');

  try {
    const media = await db.media.findUnique({ where: { id } });
    if (!media) throw new Error('Медиа не найдено');

    // Обложка в галерее одна: снимаем признак с остальных
    if (media.projectId) {
      await db.media.updateMany({ where: { projectId: media.projectId }, data: { isCover: false } });
    } else if (media.workId) {
      await db.media.updateMany({ where: { workId: media.workId }, data: { isCover: false } });
    }
    await db.media.update({ where: { id }, data: { isCover: true } });
  } catch (error) {
    console.error('[admin] назначение обложки:', error);
    throw new Error('Не удалось назначить обложку');
  }
  revalidateSite();
}

export async function updateMediaMeta(formData: FormData) {
  await requireSession();
  try {
    await db.media.update({
      where: { id: str(formData, 'id') },
      data: {
        alt: optStr(formData, 'alt'),
        caption: optStr(formData, 'caption'),
        kind: str(formData, 'kind') || 'PHOTO',
      },
    });
  } catch (error) {
    console.error('[admin] обновление медиа:', error);
    throw new Error('Не удалось обновить описание');
  }
  revalidateSite();
}

export async function deleteMedia(formData: FormData) {
  await requireSession();
  const id = str(formData, 'id');

  try {
    const media = await db.media.findUnique({ where: { id } });
    await db.media.delete({ where: { id } });

    // Файлы, загруженные через админку, удаляем с диска.
    // Импортированные из исходной папки оставляем: их пересоздаёт media:import.
    if (media?.src.startsWith('/uploads/admin/')) {
      try {
        await unlink(path.join(process.cwd(), 'public', media.src.replace(/^\//, '')));
      } catch (error) {
        console.error('[admin] файл медиа не удалён:', error);
      }
    }
  } catch (error) {
    console.error('[admin] удаление медиа:', error);
    throw new Error('Не удалось удалить медиа');
  }
  revalidateSite();
}
