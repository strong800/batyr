import Image from 'next/image';
import { db, safeQuery } from '@/lib/db';
import { deleteReview, saveReview } from '../actions';
import {
  AdminCard,
  AdminCheckbox,
  AdminField,
  AdminHeader,
  AdminTextArea,
  SubmitButton,
} from '@/components/admin/Fields';

export const dynamic = 'force-dynamic';

const PLACEHOLDER_NAMES = ['Заказчик', 'Заказчица', 'Семья заказчиков'];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;

  const [reviews, visibleSetting] = await Promise.all([
    safeQuery(
      'adminReviews',
      () =>
        db.review.findMany({
          orderBy: { sortOrder: 'asc' },
          include: { media: { orderBy: { sortOrder: 'asc' } } },
        }),
      [],
    ),
    safeQuery(
      'reviewsVisible',
      () => db.setting.findUnique({ where: { key: 'blocks.reviewsVisible' } }),
      null,
    ),
  ]);

  const unnamed = reviews.filter((r) => PLACEHOLDER_NAMES.includes(r.authorName)).length;

  return (
    <>
      <AdminHeader
        title="Отзывы"
        description="Видеоотзывы показываются карточками с постером. Текст под видео не обязателен."
      />

      {saved && (
        <p className="mb-6 rounded border border-line bg-paperDeep p-4 text-body">Сохранено.</p>
      )}

      {visibleSetting?.value !== 'true' && (
        <p className="mb-6 rounded border border-ember bg-paperDeep p-4 text-body">
          Блок отзывов сейчас скрыт на сайте. Включить можно в разделе «Тексты и контакты»,
          настройка «Показывать блок отзывов».
        </p>
      )}

      {unnamed > 0 && (
        <p className="mb-6 rounded border border-ember bg-paperDeep p-4 text-body">
          У {unnamed} отзывов стоят нейтральные подписи вместо имён — в исходных материалах
          имён не было. Подставьте настоящие: отзыв без имени работает слабее.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {reviews.map((review) => {
          const video = review.media.find((m) => m.src.endsWith('.mp4'));
          const poster = video?.poster ?? review.media.find((m) => !m.src.endsWith('.mp4'))?.src;

          return (
            <AdminCard key={review.id}>
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-3">
                  <div className="relative aspect-plate overflow-hidden rounded border border-line bg-paperDeep">
                    {poster && (
                      <Image src={poster} alt="" fill sizes="200px" className="object-cover" />
                    )}
                  </div>
                  {video && (
                    <a
                      href={video.src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-badge uppercase text-inkMuted underline"
                    >
                      Открыть видео ↗
                    </a>
                  )}
                </div>

                <form action={saveReview} className="lg:col-span-9">
                  <input type="hidden" name="id" value={review.id} />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <AdminField
                      label="Имя заказчика"
                      name="authorName"
                      defaultValue={review.authorName}
                      required
                    />
                    <AdminField
                      label="Подпись под именем"
                      name="authorInfo"
                      defaultValue={review.authorInfo}
                      placeholder="Дом «Семейка», Уфимский район"
                    />
                    <AdminTextArea
                      label="Текст отзыва (не обязателен)"
                      name="text"
                      defaultValue={review.text}
                      rows={3}
                      className="sm:col-span-2"
                      hint="Если оставить пустым, карточка покажет только видео"
                    />
                    <AdminField
                      label="Позиция"
                      name="sortOrder"
                      type="number"
                      defaultValue={review.sortOrder}
                    />
                    <div className="flex items-end">
                      <AdminCheckbox
                        label="Показывать"
                        name="visible"
                        defaultChecked={review.visible}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <SubmitButton>Сохранить</SubmitButton>
                  </div>
                </form>
              </div>

              <form action={deleteReview} className="mt-5 border-t border-line pt-5">
                <input type="hidden" name="id" value={review.id} />
                <SubmitButton variant="danger">Удалить отзыв</SubmitButton>
              </form>
            </AdminCard>
          );
        })}
      </div>

      {reviews.length === 0 && (
        <p className="text-body text-inkMuted">
          Отзывов нет. Видеоотзывы попадают сюда после запуска импорта медиа.
        </p>
      )}
    </>
  );
}
