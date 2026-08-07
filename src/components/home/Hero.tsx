'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ui } from '@/config/site';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { Button } from '@/components/ui/Button';
import type { PictureMedia } from '@/components/media/Picture';

type HeroProps = {
  title: string;
  accent: string;
  lead: string;
  facts: string[];
  image: PictureMedia | null;
  city: string;
};

/**
 * Первый экран: разрез 5/7.
 *
 * Фотография стоит плашкой в своём родном формате 4:5, а не растягивается
 * на всю высоту экрана. Причина простая: на снимках компании напечатан
 * собственный текст, и при object-cover его верх и низ срезало бы.
 * Плашка сохраняет кадр целиком — вместе с его типографикой.
 */
export function Hero({ title, accent, lead, facts, image, city }: HeroProps) {
  const { animate } = useMotionPreference();
  const sectionRef = useRef<HTMLElement>(null);

  // При prefers-reduced-motion подписка на скролл не создаётся вовсе
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '8%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '3%']);

  /**
   * Параллакс включаем только на широких экранах.
   * На телефоне он почти незаметен, зато пересчёт трансформаций на каждом
   * кадре бьёт по первой отрисовке: главный поток и так занят гидратацией.
   * Значение вычисляем в эффекте, поэтому серверная разметка совпадает
   * с первым клиентским кадром.
   */
  const [wideScreen, setWideScreen] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const sync = () => setWideScreen(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const parallax = animate && wideScreen;

  // Заголовок с подчёркнутой частью — одно из пяти мест для акцента
  const accentIndex = accent ? title.toLowerCase().indexOf(accent.toLowerCase()) : -1;
  const titleParts =
    accentIndex >= 0
      ? {
          before: title.slice(0, accentIndex),
          accent: title.slice(accentIndex, accentIndex + accent.length),
          after: title.slice(accentIndex + accent.length),
        }
      : { before: title, accent: '', after: '' };

  return (
    <section
      ref={sectionRef}
      className="relative border-b border-forestLine bg-forest text-paper"
      aria-label="Дома из профилированного бруса под ключ"
    >
      {/* min-w-0 на колонках обязателен: у элементов сетки min-width по
          умолчанию auto, и длинное слово раздвигает колонку поверх соседней */}
      <div className="grid items-center lg:grid-cols-12">
        {/* Фото: плашка 4:5 в родном формате, кадр не обрезается */}
        <div className="relative order-1 flex min-w-0 justify-center px-gutterSm pt-12 md:px-gutterMd lg:order-2 lg:col-span-6 lg:px-0 lg:py-16 lg:pr-gutterLg">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 hidden w-px bg-forestLine lg:block"
          />
          <motion.div
            style={parallax ? { y: imageY } : undefined}
            className="relative aspect-plate w-full max-w-[34rem] overflow-hidden border border-forestLine lg:ml-14 lg:max-w-none"
          >
            {image?.src && (
              <Image
                src={image.src}
                alt={image.alt ?? ''}
                fill
                priority
                // Эта картинка — LCP-элемент страницы. Одного priority мало:
                // Next кладёт preload-ссылку, но подсказку приоритета
                // самому <img> не проставляет, и Lighthouse это ловит.
                fetchPriority="high"
                sizes="(max-width: 1024px) 100vw, 45vw"
                placeholder={image.blurDataUrl ? 'blur' : 'empty'}
                blurDataURL={image.blurDataUrl ?? undefined}
                className="object-cover"
              />
            )}
          </motion.div>
        </div>

        {/* Текст */}
        <motion.div
          style={parallax ? { y: textY } : undefined}
          className="order-2 flex min-w-0 flex-col justify-center px-gutterSm py-14 md:px-gutterMd lg:order-1 lg:col-span-6 lg:py-24 lg:pl-gutterLg lg:pr-10"
        >
          <p className="font-sans text-nums uppercase text-timberLight">
            {city} · собственное производство
          </p>

          {/* hyphens-auto — страховка: если в админке впишут заголовок
              с ещё более длинным словом, оно перенесётся, а не порвёт сетку */}
          <h1 className="mt-6 hyphens-auto break-words text-display text-paper" lang="ru">
            {titleParts.before}
            {titleParts.accent && (
              <span className="border-b-2 border-emberOnDark pb-1">{titleParts.accent}</span>
            )}
            {titleParts.after}
          </h1>

          <p className="mt-8 max-w-prose text-lead text-sand">{lead}</p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button href="/catalog" variant="sand" size="lg">
              {ui.cta.catalog}
            </Button>
            <Button href="/#calc" variant="outline" size="lg" onDark>
              {ui.cta.calc}
            </Button>
          </div>

          {facts.length > 0 && (
            <>
              <span aria-hidden className="mt-12 block h-px w-full bg-forestLine" />
              <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3 font-sans text-badge uppercase text-sand">
                {facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
