"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";

type Photo = { url: string; caption: string };

// A photo grid; clicking one opens it large over the page. Escape or a click outside closes it, arrows move between photos.
export function Gallery({ photos, columns }: { photos: Photo[]; columns: 3 | 4 }) {
  const [open, setOpen] = useState<number | null>(null);
  const n = photos.length;

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % n));
      else if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + n) % n));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, n]);

  const nav = "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 transition hover:bg-white";
  const current = open === null ? null : photos[open];
  return (
    <>
      <ul className={`grid grid-cols-2 gap-3 sm:gap-4 ${columns === 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
        {photos.map((p, i) => (
          <li key={i}>
            <button type="button" onClick={() => setOpen(i)} aria-label={p.caption ? `Enlarge: ${p.caption}` : `Enlarge photo ${i + 1}`} className="group block aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions */}
              <img src={p.url} alt={p.caption} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            </button>
          </li>
        ))}
      </ul>
      {current && (
        <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions */}
            <img src={current.url} alt={current.caption} className="max-h-[82vh] w-auto max-w-full rounded-xl object-contain" />
            {current.caption && <figcaption className="pt-3 text-center text-white">{current.caption}</figcaption>}
          </figure>
          <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-900 transition hover:bg-white"><Icon name="x" className="h-5 w-5" /></button>
          {n > 1 && (
            <>
              <button type="button" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); setOpen((open! - 1 + n) % n); }} className={`${nav} left-4`}><Icon name="arrow-right" className="h-5 w-5 rotate-180" /></button>
              <button type="button" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); setOpen((open! + 1) % n); }} className={`${nav} right-4`}><Icon name="arrow-right" className="h-5 w-5" /></button>
            </>
          )}
        </div>
      )}
    </>
  );
}
