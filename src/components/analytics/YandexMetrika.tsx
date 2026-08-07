import Script from 'next/script';

/**
 * Подключение Яндекс.Метрики. Номер счётчика задаётся в админке
 * (настройка integrations.metrikaId) или в NEXT_PUBLIC_YANDEX_METRIKA_ID.
 *
 * Пока номера нет, скрипт не подключается вовсе — ни одного лишнего
 * запроса и никакого влияния на метрики производительности.
 * Свой сбор событий работает независимо от Метрики.
 */
export function YandexMetrika({ counterId }: { counterId?: string }) {
  const id = (counterId || process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || '').trim();
  if (!/^\d+$/.test(id)) return null;

  return (
    <>
      <Script id="yandexMetrika" strategy="lazyOnload">
        {`
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
          ym(${id}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:false });
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${id}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
