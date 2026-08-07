'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@/lib/utils';
import { MEDIA_KINDS } from '@/lib/enums';
import { deleteMedia, reorderMedia, setMediaCover, updateMediaMeta } from '@/app/(admin)/admin/actions';

export type AdminMedia = {
  id: string;
  src: string;
  alt: string | null;
  caption: string | null;
  kind: string;
  isCover: boolean;
  width: number | null;
  height: number | null;
};

const KIND_LABELS: Record<string, string> = {
  PHOTO: 'Фото',
  INTERIOR: 'Интерьер',
  RENDER: 'Рендер',
  PLAN: 'Планировка',
  VIDEO: 'Видео',
  PRODUCTION: 'Производство',
  FOUNDER: 'Основатель',
  BRAND: 'Бренд',
  REVIEW: 'Отзыв',
};

/**
 * Галерея с перетаскиванием.
 *
 * dnd-kit выбран из-за клавиатурного сенсора: порядок можно менять
 * с клавиатуры (Tab до карточки, пробел, стрелки, пробел) — мышью
 * это делать не обязательно.
 */
function SortableCard({
  media,
  onDelete,
  onCover,
  onMeta,
  busy,
}: {
  media: AdminMedia;
  onDelete: (id: string) => void;
  onCover: (id: string) => void;
  onMeta: (id: string, alt: string, kind: string) => void;
  busy: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: media.id,
  });
  const [editing, setEditing] = useState(false);

  const isVideo = media.src.endsWith('.mp4');

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'rounded border border-line bg-paper',
        isDragging && 'z-10 border-ink opacity-90',
      )}
    >
      <div className="relative aspect-plate overflow-hidden bg-paperDeep">
        {isVideo ? (
          <div className="flex h-full items-center justify-center text-badge uppercase text-inkMuted">
            Видео
          </div>
        ) : (
          <Image src={media.src} alt={media.alt ?? ''} fill sizes="200px" className="object-cover" />
        )}

        {media.isCover && (
          <span className="absolute left-2 top-2 rounded bg-forest px-2 py-1 text-badge uppercase text-paper">
            Обложка
          </span>
        )}

        {/* Ручка перетаскивания: и мышью, и с клавиатуры */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Переместить: ${media.alt ?? 'изображение'}`}
          className="absolute right-2 top-2 h-8 w-8 cursor-grab rounded border border-line bg-paper/90 text-body active:cursor-grabbing"
        >
          ⠿
        </button>
      </div>

      <div className="p-3">
        <p className="truncate text-badge uppercase text-inkMuted">
          {KIND_LABELS[media.kind] ?? media.kind}
        </p>

        {editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              onMeta(media.id, String(form.get('alt') ?? ''), String(form.get('kind') ?? 'PHOTO'));
              setEditing(false);
            }}
            className="mt-2 flex flex-col gap-2"
          >
            <input
              name="alt"
              defaultValue={media.alt ?? ''}
              placeholder="Описание для незрячих"
              className="w-full rounded border border-line px-2 py-1.5 text-badge normal-case"
            />
            <select
              name="kind"
              defaultValue={media.kind}
              className="w-full rounded border border-line px-2 py-1.5 text-badge normal-case"
            >
              {MEDIA_KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k] ?? k}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="text-badge uppercase text-ember underline">
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-badge uppercase text-inkMuted underline"
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="mt-1 line-clamp-2 text-badge normal-case text-ink">
              {media.alt || <span className="text-ember">Нет описания</span>}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-badge uppercase text-inkMuted underline hover:text-ink"
              >
                Править
              </button>
              {!media.isCover && !isVideo && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onCover(media.id)}
                  className="text-badge uppercase text-inkMuted underline hover:text-ink"
                >
                  В обложку
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => onDelete(media.id)}
                className="text-badge uppercase text-ember underline"
              >
                Удалить
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

export function MediaManager({
  media: initialMedia,
  projectId,
  workId,
  reviewId,
}: {
  media: AdminMedia[];
  projectId?: string;
  workId?: string;
  reviewId?: string;
}) {
  const [media, setMedia] = useState(initialMedia);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = media.findIndex((m) => m.id === active.id);
    const newIndex = media.findIndex((m) => m.id === over.id);
    const next = arrayMove(media, oldIndex, newIndex);
    setMedia(next);

    const form = new FormData();
    for (const item of next) form.append('mediaId', item.id);
    startTransition(async () => {
      try {
        await reorderMedia(form);
      } catch (err) {
        console.error(err);
        setError('Порядок не сохранился, обновите страницу');
      }
    });
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const form = new FormData();
      form.set('file', file);
      if (projectId) form.set('projectId', projectId);
      if (workId) form.set('workId', workId);
      if (reviewId) form.set('reviewId', reviewId);
      form.set('kind', 'PHOTO');

      try {
        const response = await fetch('/api/admin/media', { method: 'POST', body: form });
        const result = await response.json();
        if (result.ok) {
          setMedia((prev) => [...prev, result.media]);
        } else {
          setError(result.error ?? 'Не удалось загрузить файл');
        }
      } catch (err) {
        console.error(err);
        setError('Не удалось загрузить файл');
      }
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="inline-flex h-11 cursor-pointer items-center rounded border border-line px-5 font-sans text-badge uppercase transition-colors hover:border-ink">
          {uploading ? 'Загружаем…' : 'Добавить фото'}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/avif"
            multiple
            onChange={(event) => handleUpload(event.target.files)}
            className="sr-only"
          />
        </label>
        <p className="text-badge normal-case text-inkMuted">
          Порядок меняется перетаскиванием. С клавиатуры: Tab до ручки ⠿, пробел, стрелки, пробел.
        </p>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-badge normal-case text-ember">
          {error}
        </p>
      )}

      {media.length === 0 ? (
        <p className="rounded border border-line bg-paperDeep p-6 text-body text-inkMuted">
          Фотографий пока нет.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={media.map((m) => m.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {media.map((item) => (
                <SortableCard
                  key={item.id}
                  media={item}
                  busy={pending}
                  onDelete={(id) => {
                    setMedia((prev) => prev.filter((m) => m.id !== id));
                    const form = new FormData();
                    form.set('id', id);
                    startTransition(() => {
                      deleteMedia(form).catch(() => setError('Не удалось удалить'));
                    });
                  }}
                  onCover={(id) => {
                    setMedia((prev) => prev.map((m) => ({ ...m, isCover: m.id === id })));
                    const form = new FormData();
                    form.set('id', id);
                    startTransition(() => {
                      setMediaCover(form).catch(() => setError('Не удалось назначить обложку'));
                    });
                  }}
                  onMeta={(id, alt, kind) => {
                    setMedia((prev) => prev.map((m) => (m.id === id ? { ...m, alt, kind } : m)));
                    const form = new FormData();
                    form.set('id', id);
                    form.set('alt', alt);
                    form.set('kind', kind);
                    startTransition(() => {
                      updateMediaMeta(form).catch(() => setError('Не удалось сохранить описание'));
                    });
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
