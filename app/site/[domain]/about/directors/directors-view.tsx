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

const grid = "grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-x-6 gap-y-10";

export function DirectorsView({ directors, layout, shape }: { directors: DirectorView[]; layout: DirectorLayout; shape: PhotoShape }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<DirectorView | null>(null);

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
              setSelected(d);
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
        className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-lg p-6 backdrop:bg-black/40"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <Heading d={selected} />
              <button onClick={() => dialog.current?.close()} className="text-sm text-gray-500 underline">Close</button>
            </div>
            <BioText d={selected} />
          </div>
        )}
      </dialog>
    </>
  );
}
