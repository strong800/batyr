'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ui } from '@/config/site';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import type { MediaLite } from '@/lib/media';

type LightboxProps = {
  items: MediaLite[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

/** Длительность затухания при закрытии, мс */
const LEAVE_MS = 200;

/**
 * Просмотр изображения во весь экран.
 *
 * Клавиатура: ← → листают, Escape закрывает, Tab не выпускает фокус
 * за пределы окна. Открывшая карточка получает фокус обратно.
 *
 * Затухание при закрытии сделано вручную, без AnimatePresence: та не
 * доводила выход до конца и оставляла в DOM невидимый слой с opacity 0,
 * который растягивался на весь экран и перехватывал клики по странице.
 */
export function Lightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const { animate } = useMotionPreference();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<Element | null>(null);
  const leaveTimerRef = useRef<number | null>(null);
  const [leaving, setLeaving] = useState(false);

  const isOpen = index !== null;

  /** Закрытие: сначала затухание, потом снятие с монтирования. */
  const requestClose = useCallback(() => {
    if (!animate) {
      onClose();
      return;
    }
    setLeaving(true);
    leaveTimerRef.current = window.setTimeout(() => {
      setLeaving(false);
      onClose();
    }, LEAVE_MS);
  }, [animate, onClose]);

  const goPrev = useCallback(() => {
    if (index === null) return;
    onNavigate((index - 1 + items.length) % items.length);
  }, [index, items.length, onNavigate]);

  const goNext = useCallback(() => {
    if (index === null) return;
    onNavigate((index + 1) % items.length);
  }, [index, items.length, onNavigate]);

  // Клавиатура, блокировка прокрутки фона, возврат фокуса
  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'Tab') {
        // Фокус не должен уходить за пределы окна просмотра
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button');
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (restoreFocusRef.current instanceof HTMLElement) {
        restoreFocusRef.current.focus();
      }
    };
  }, [isOpen, goPrev, goNext, requestClose]);

  // Таймер затухания не должен пережить размонтирование
  useEffect(
    () => () => {
      if (leaveTimerRef.current !== null) window.clearTimeout(leaveTimerRef.current);
    },
    [],
  );

  if (typeof document === 'undefined') return null;
  if (!isOpen) return null;

  const current = items[index];
  if (!current) return null;

  return createPortal(
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={current.alt ?? 'Просмотр фотографии'}
      tabIndex={-1}
      initial={animate ? { opacity: 0 } : false}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: LEAVE_MS / 1000 }}
      className="fixed inset-0 z-[100] flex flex-col bg-forest/[0.97] outline-none"
    >
      <div className="flex items-center justify-between px-gutterSm py-5 md:px-gutterMd">
        <p className="font-sans text-badge uppercase tabularNums text-sand">
          {index + 1} / {items.length}
        </p>
        <button
          type="button"
          onClick={requestClose}
          className="h-11 px-3 font-sans text-badge uppercase text-paper transition-colors hover:text-emberOnDark"
        >
          {ui.cta.close} ✕
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-gutterSm pb-6 md:px-gutterMd">
        <motion.div
          key={current.id}
          initial={animate ? { opacity: 0, scale: 0.98 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-full w-full"
        >
          <Image
            src={current.src}
            alt={current.alt ?? ''}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </motion.div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Предыдущее фото"
              className="absolute left-gutterSm top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-forestLine bg-forest/70 text-paper transition-colors hover:border-sand md:left-gutterMd"
            >
              ←
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Следующее фото"
              className="absolute right-gutterSm top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-forestLine bg-forest/70 text-paper transition-colors hover:border-sand md:right-gutterMd"
            >
              →
            </button>
          </>
        )}
      </div>

      {(current.caption || current.alt) && (
        <p className="px-gutterSm pb-6 text-center text-body text-sand md:px-gutterMd">
          {current.caption ?? current.alt}
        </p>
      )}
    </motion.div>,
    document.body,
  );
}
