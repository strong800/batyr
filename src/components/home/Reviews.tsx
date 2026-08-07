import { Section } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { Picture } from '@/components/media/Picture';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import type { MediaLite } from '@/lib/media';

export type ReviewData = {
  id: string;
  authorName: string;
  authorInfo: string | null;
  text: string | null;
  format: string;
  media: MediaLite[];
};

/**
 * Отзывы. У компании они видеоформатные, поэтому карточка отзыва —
 * это сам ролик с постером, а не пересказ чужих слов.
 *
 * Ролики играют в родном вертикальном формате и не грузятся,
 * пока их не запустили: preload="none" внутри плеера.
 */
export function Reviews({ reviews }: { reviews: ReviewData[] }) {
  if (reviews.length === 0) return null;

  return (
    <Section
      id="reviews"
      num="08"
      title="Отзывы"
      lead="Записаны в построенных домах. Мы не переписывали их в текст — пусть заказчики говорят сами."
      deep
    >
      <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review, i) => {
          const video = review.media.find((m) => m.src.endsWith('.mp4'));
          const photo = review.media.find((m) => !m.src.endsWith('.mp4'));

          return (
            <Reveal key={review.id} as="li" index={i}>
              <article>
                {video ? (
                  <VideoPlayer
                    src={video.src}
                    poster={video.poster}
                    title={review.authorInfo ?? review.authorName}
                    ratio="vertical"
                  />
                ) : (
                  photo && <Picture media={photo} ratio="plate" sizes="(max-width: 640px) 100vw, 33vw" />
                )}

                {review.text && <p className="mt-5 text-body text-ink">{review.text}</p>}

                <p className="mt-5 font-display text-[1.0625rem] uppercase tracking-wide">
                  {review.authorName}
                </p>
                {review.authorInfo && (
                  <p className="mt-1 font-sans text-badge uppercase text-inkMuted">
                    {review.authorInfo}
                  </p>
                )}
              </article>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
