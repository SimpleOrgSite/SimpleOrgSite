"use client";

import { useRef, useState } from "react";
import { SHAPE_CLASSES, type DirectorLayout, type PhotoShape } from "@/lib/directors";

export type DirectorView = {
  id: string;
  name: string;
  title: string;
  affiliation: string;
  bio: string;
  email: string;
  photoUrl: string | null;
};

function Photo({ d, shape, className = "" }: { d: DirectorView; shape: PhotoShape; className?: string }) {
  // A placeholder keeps the grid aligned for people without a photo.
  const box = `${SHAPE_CLASSES[shape]} ${className}`;
  return d.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
    <img src={d.photoUrl} alt={d.name} className={`${box} w-full object-cover`} />
  ) : (
    <div className={`${box} w-full bg-gray-100`} />
  );
}

function Heading({ d, center }: { d: DirectorView; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <h2 className="text-lg font-semibold">{d.name}</h2>
      {d.title && <p className="text-gray-600">{d.title}</p>}
      {d.affiliation && <p className="text-sm text-gray-500">{d.affiliation}</p>}
    </div>
  );
}

function BioText({ d }: { d: DirectorView }) {
  return (
    <>
      {d.bio && <p className="whitespace-pre-line text-gray-700">{d.bio}</p>}
      {d.email && <a href={`mailto:${d.email}`} className="block text-blue-700 underline">{d.email}</a>}
    </>
  );
}

const arrow = "absolute top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700";
const grid = "grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-x-6 gap-y-10";

export function DirectorsView({ directors, layout, shape }: { directors: DirectorView[]; layout: DirectorLayout; shape: PhotoShape }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const selected = index === null ? null : directors[index];
  // Wraps around: next from the last goes to the first, previous from the first goes to the last.
  const step = (by: number) => setIndex((i) => (i === null ? i : (i + by + directors.length) % directors.length));

  if (layout === "list") {
    return (
      <ul className="space-y-4">
        {directors.map((d) => (
          <li key={d.id}><Heading d={d} /></li>
        ))}
      </ul>
    );
  }

  if (layout === "side") {
    return (
      <div className="space-y-10">
        {directors.map((d) => (
          <section key={d.id} className="flex flex-col gap-5 sm:flex-row">
            <Photo d={d} shape={shape} className="max-w-48 shrink-0 sm:w-48" />
            <div className="space-y-3">
              <Heading d={d} />
              <BioText d={d} />
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (layout === "cards") {
    return (
      <div className={grid}>
        {directors.map((d) => (
          <section key={d.id} className="space-y-3">
            <Photo d={d} shape={shape} />
            <Heading d={d} center />
          </section>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={grid}>
        {directors.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              setIndex(directors.indexOf(d));
              dialog.current?.showModal();
            }}
            className="cursor-pointer space-y-3 text-left"
          >
            <Photo d={d} shape={shape} />
            <Heading d={d} center />
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        onKeyDown={(e) => {
          if (directors.length < 2) return;
          if (e.key === "ArrowLeft") step(-1);
          if (e.key === "ArrowRight") step(1);
        }}
        className="m-auto max-h-[85vh] w-[min(40rem,calc(100%-2rem))] overflow-y-auto rounded-3xl p-0 shadow-2xl outline-none transition duration-200 backdrop:bg-gray-900/40 backdrop:backdrop-blur-sm starting:open:translate-y-2 starting:open:opacity-0"
      >
        {selected && (
          <div className={`relative flex flex-col gap-6 p-8 sm:flex-row ${directors.length > 1 ? "sm:px-16" : ""}`}>
            <button
              onClick={() => dialog.current?.close()}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              {/* Tabler "x" */}
              <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 6l-12 12" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
            {directors.length > 1 && (
              <>
                <button onClick={() => step(-1)} aria-label="Previous" className={`${arrow} left-3`}>
                  {/* Tabler "chevron-left" */}
                  <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M15 6l-6 6l6 6" />
                  </svg>
                </button>
                <button onClick={() => step(1)} aria-label="Next" className={`${arrow} right-3`}>
                  {/* Tabler "chevron-right" */}
                  <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 6l6 6l-6 6" />
                  </svg>
                </button>
              </>
            )}
            {selected.photoUrl && <Photo d={selected} shape={shape} className="mx-auto w-40 shrink-0 sm:mx-0 sm:w-44" />}
            <div className="min-w-0 space-y-4 pr-6">
              <div>
                <h2 className="text-2xl font-semibold">{selected.name}</h2>
                {selected.title && <p className="text-gray-600">{selected.title}</p>}
                {selected.affiliation && <p className="text-sm text-gray-500">{selected.affiliation}</p>}
              </div>
              <BioText d={selected} />
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
