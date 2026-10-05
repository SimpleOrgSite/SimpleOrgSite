"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";

type Slide = { url: string; caption: string };

const nextFrame = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn));

// One photo at a time, sliding forward on a timer. To loop forever without rewinding across every slide,
// a copy of the first slide sits after the last: sliding onto it and then silently jumping back to the real first is invisible.
export function PhotoCarousel({ slides, seconds }: { slides: Slide[]; seconds: number }) {
  const n = slides.length;
  const [index, setIndex] = useState(0);
  const [instant, setInstant] = useState(false); // true while jumping without animation
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const next = () => setIndex((i) => Math.min(i + 1, n));
  const prev = () => {
    if (index > 0) return setIndex(index - 1);
    setInstant(true);
    setIndex(n);
    nextFrame(() => {
      setInstant(false);
      setIndex(n - 1);
    });
  };

  // Restarts after every change, so tapping an arrow or dot gives that photo its full time.
  useEffect(() => {
    if (n < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(next, seconds * 1000);
    return () => clearTimeout(id);
  }, [index, paused, n, seconds]); // eslint-disable-line react-hooks/exhaustive-deps -- next only uses setIndex and n

  const control = "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-900 shadow-md backdrop-blur transition hover:bg-white";
  const shown = [...slides, ...(n > 1 ? [slides[0]] : [])];

  return (
    <div
      className="space-y-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="relative overflow-hidden rounded-3xl bg-gray-100 shadow-lg"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const start = touchX.current;
          touchX.current = null;
          if (start === null || n < 2) return;
          const dx = e.changedTouches[0].clientX - start;
          if (dx < -50) next();
          else if (dx > 50) prev();
        }}
      >
        <div
          className={`flex ${instant ? "" : "transition-transform duration-700 ease-in-out"}`}
          style={{ transform: `translateX(-${index * 100}%)` }}
          onTransitionEnd={(e) => {
            if (e.target !== e.currentTarget || index !== n) return;
            setInstant(true);
            setIndex(0);
            nextFrame(() => setInstant(false));
          }}
        >
          {shown.map((s, i) => (
            <figure key={i} className="relative aspect-[4/3] w-full shrink-0 sm:aspect-[16/9]" aria-hidden={i >= n}>
              {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions */}
              <img src={s.url} alt={s.caption} loading={i === 0 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
              {s.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-6 pb-5 pt-16 text-lg font-medium text-white sm:px-8 sm:text-xl">{s.caption}</figcaption>
              )}
            </figure>
          ))}
        </div>
        {n > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={prev} className={`${control} left-4`}><Icon name="arrow-right" className="h-5 w-5 rotate-180" /></button>
            <button type="button" aria-label="Next photo" onClick={next} className={`${control} right-4`}><Icon name="arrow-right" className="h-5 w-5" /></button>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-current={index % n === i}
              onClick={() => setIndex(i)}
              className="h-2.5 rounded-full transition-all"
              style={{ width: index % n === i ? 28 : 10, backgroundColor: index % n === i ? "var(--theme-color, #111827)" : "#d1d5db" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
