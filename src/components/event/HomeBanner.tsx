'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const AUTOPLAY_MS = 9000;
const RESUME_AFTER_IDLE_MS = 700;

/** WITA (UTC+8), sama dengan zona untuk Bali, Sulawesi, Nusa Tenggara, dll. */
const WITA_TIMEZONE = 'Asia/Makassar';

const PROMO_START_HOUR_WITA = 17;
const PROMO_START_MINUTE_WITA = 20;

const BASE_BANNER_ITEMS = [
  { src: '/assets/banner-2.webp', alt: 'Banner promosi 2' },
  { src: '/assets/banner-3.webp', alt: 'Banner promosi 3' },
] as const;

const PROMO_BANNER_ITEM = {
  src: '/assets/banner-promo-new.webp',
  alt: 'Banner promosi khusus',
} as const;

function getWitaHourMinute(now: Date): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: WITA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return { hour, minute };
}

/** Banner promo (jika aktif) diposisikan pertama dalam carousel; slot waktu mengikuti konstanta jam/menit WITA di atas. */
function isPromoBannerSlotActiveWITA(now: Date): boolean {
  const { hour, minute } = getWitaHourMinute(now);
  const minutesNow = hour * 60 + minute;
  const minutesStart = PROMO_START_HOUR_WITA * 60 + PROMO_START_MINUTE_WITA;
  return minutesNow >= minutesStart;
}

export function HomeBanner() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const programmaticRef = useRef(false);
  const scrollToSlideRef = useRef<(index: number) => void>(() => {});
  const [active, setActive] = useState(0);

  const [promoSlotActive, setPromoSlotActive] = useState(false);

  useEffect(() => {
    const tick = () =>
      setPromoSlotActive(isPromoBannerSlotActiveWITA(new Date()));
    tick();
    const intervalId = window.setInterval(tick, 15_000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const bannerItems = useMemo(() => {
    if (!promoSlotActive) return [...BASE_BANNER_ITEMS];
    return [PROMO_BANNER_ITEM, ...BASE_BANNER_ITEMS];
  }, [promoSlotActive]);

  const scrollSlideIntoView = useCallback((index: number) => {
    scrollToSlideRef.current(index);
  }, []);

  useEffect(() => {
    const root = viewportRef.current;
    if (!root) return;

    const n = bannerItems.length;
    let intervalId: number | undefined;
    let idleId: number | undefined;

    const clearProgrammaticSoon = () => {
      window.setTimeout(() => {
        programmaticRef.current = false;
      }, 520);
    };

    const beginAutoplay = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = window.setInterval(() => {
        const w = root.clientWidth;
        if (w <= 0) return;
        setActive((prev) => {
          const next = (prev + 1) % n;
          programmaticRef.current = true;
          root.scrollTo({ left: next * w, behavior: 'smooth' });
          clearProgrammaticSoon();
          return next;
        });
      }, AUTOPLAY_MS);
    };

    const pauseAutoplayThenResumeAfterIdle = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
      if (idleId) clearTimeout(idleId);
      idleId = window.setTimeout(beginAutoplay, RESUME_AFTER_IDLE_MS);
    };

    scrollToSlideRef.current = (index: number) => {
      const w = root.clientWidth;
      if (w <= 0) return;
      const clamped = Math.min(n - 1, Math.max(0, index));
      programmaticRef.current = true;
      root.scrollTo({ left: clamped * w, behavior: 'smooth' });
      setActive(clamped);
      clearProgrammaticSoon();
      pauseAutoplayThenResumeAfterIdle();
    };

    const wInit = root.clientWidth;
    if (wInit > 0) {
      setActive((prev) => {
        const clamped = Math.min(prev, n - 1);
        programmaticRef.current = true;
        root.scrollTo({ left: clamped * wInit, behavior: 'auto' });
        clearProgrammaticSoon();
        return clamped;
      });
    }

    let ticking = false;
    const syncActiveFromScroll = () => {
      ticking = false;
      const w = root.clientWidth;
      if (!w) return;
      const idx = Math.min(n - 1, Math.max(0, Math.round(root.scrollLeft / w)));
      setActive((prev) => (prev !== idx ? idx : prev));
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(syncActiveFromScroll);
      }
      if (!programmaticRef.current) {
        pauseAutoplayThenResumeAfterIdle();
      }
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    syncActiveFromScroll();
    beginAutoplay();

    return () => {
      root.removeEventListener('scroll', onScroll);
      if (intervalId) clearInterval(intervalId);
      if (idleId) clearTimeout(idleId);
    };
  }, [bannerItems.length]);

  return (
    <section
      className='w-full'
      aria-roledescription='carousel'
      aria-label='Banner promosi'>
      <div
        ref={viewportRef}
        className='flex w-full snap-x snap-mandatory snap-always gap-0 overflow-x-auto overscroll-x-contain scroll-smooth touch-pan-x py-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        {bannerItems.map((item, index) => (
          <article
            key={item.src}
            data-banner-slide
            data-banner-index={index}
            className='snap-start shrink-0 basis-full min-w-full max-w-full'>
            <div className='relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-100 border-3 border-rc-red'>
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className='object-cover'
                draggable={false}
                sizes='100vw'
                priority={index === 0}
              />
            </div>
          </article>
        ))}
      </div>

      <div className='mt-4 flex items-center justify-center gap-3 sm:gap-5'>
        <div
          className='flex flex-nowrap items-center justify-center gap-2'
          role='tablist'
          aria-label='Pilih banner'>
          {bannerItems.map((_, index) => {
            const selected = index === active;
            return (
              <button
                key={index}
                type='button'
                role='tab'
                aria-selected={selected}
                aria-label={`Banner ${index + 1}${selected ? ', aktif' : ''}`}
                onClick={() => scrollSlideIntoView(index)}
                className={`cursor-pointer h-2 rounded-full transition-all ${
                  selected
                    ? 'w-6 bg-rc-red'
                    : 'w-2 bg-rc-red/20 hover:bg-rc-red/30'
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
