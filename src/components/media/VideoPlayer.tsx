'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ui } from '@/config/site';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analyticsClient';

type VideoPlayerProps = {
  src: string;
  poster?: string | null;
  title: string;
  /** Родной формат ролика — вертикальный 9:16 */
  ratio?: 'vertical' | 'wide';
  /** Ширина плеера в раскладке — нужна, чтобы постер не грузился крупнее нужного */
  sizes?: string;
  className?: string;
};

/**
 * Плеер с постером и ленивой загрузкой.
 *
 * preload="none" — видео не тянется, пока пользователь не нажал play,
 * поэтому мегабайты ролика не участвуют в загрузке первого экрана.
 *
 * Атрибут poster у <video> сознательно НЕ задан. Браузер грузит его
 * немедленно и в полном размере, игнорируя preload="none": на мобильном
 * это отнимало почти 200 КБ у картинки первого экрана. Вместо него —
 * обычный next/image поверх: он ленивый и отдаёт размер под вёрстку.
 */
export function VideoPlayer({
  src,
  poster,
  title,
  ratio = 'vertical',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  async function handlePlay() {
    const video = videoRef.current;
    if (!video) return;
    try {
      setStarted(true);
      await video.play();
      trackEvent('videoPlay', { title });
    } catch (error) {
      // Автовоспроизведение могло быть заблокировано — показываем контролы
      console.error('[video] воспроизведение:', error);
      setStarted(true);
    }
  }

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
  }

  if (failed) {
    return (
      <div
        className={cn(
          'plateOnDark flex items-center justify-center p-8 text-center',
          ratio === 'vertical' ? 'aspect-vertical' : 'aspect-[16/9]',
          className,
        )}
      >
        <p className="text-body text-sand">
          Видео не удалось загрузить. Обновите страницу или посмотрите материалы в Telegram.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'plateOnDark relative',
        ratio === 'vertical' ? 'aspect-vertical' : 'aspect-[16/9]',
        className,
      )}
    >
      <video
        ref={videoRef}
        src={src}
        preload="none"
        playsInline
        muted={muted}
        controls={started}
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
        aria-label={title}
      />

      {/* Постер и кнопка запуска до первого play */}
      {!started && (
        <button
          type="button"
          onClick={handlePlay}
          className="group absolute inset-0 flex items-end justify-start"
          aria-label={`Смотреть: ${title}`}
        >
          {poster && (
            <Image src={poster} alt="" fill sizes={sizes} className="object-cover" />
          )}
          <span className="relative m-5 inline-flex items-center gap-3 border border-paper/40 bg-forest/80 px-5 py-3 font-sans text-badge uppercase text-paper backdrop-blur-sm transition-colors group-hover:border-paper">
            <span aria-hidden>▶</span>
            {title}
          </span>
        </button>
      )}

      {started && (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute right-4 top-4 border border-paper/40 bg-forest/80 px-3 py-2 font-sans text-badge uppercase text-paper backdrop-blur-sm"
        >
          {muted ? ui.cta.sound : ui.cta.soundOff}
        </button>
      )}
    </div>
  );
}
