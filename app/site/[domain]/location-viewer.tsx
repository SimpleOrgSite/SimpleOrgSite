"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

type Location = { name: string; description: string; address: string; phone: string };

// A list of locations beside a single map. Choosing a location swaps the map to it.
export function LocationViewer({ locations, preview }: { locations: Location[]; preview?: boolean }) {
  const [selected, setSelected] = useState(0);
  const current = locations[selected] ?? locations[0];
  const oneLine = (a: string) => a.replace(/\s*\n\s*/g, ", ");
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <ul className="space-y-3">
        {locations.map((l, i) => {
          const active = i === selected;
          return (
            <li key={i}>
              <div
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 transition"
                style={active ? { ["--tw-ring-color" as string]: "var(--theme-color, #111827)", boxShadow: "0 0 0 2px var(--theme-color, #111827)" } : { ["--tw-ring-color" as string]: "rgba(17,24,39,0.05)" }}
              >
                {/* The name is the control: it selects the location and swaps the map. */}
                <button type="button" onClick={() => setSelected(i)} aria-pressed={active} className="flex w-full items-center justify-between gap-3 text-left">
                  <span className="text-xl font-semibold text-gray-900">{l.name || l.address}</span>
                  <span className={`text-sm font-medium transition ${active ? "" : "text-gray-400"}`} style={active ? { color: "var(--theme-color, #111827)" } : undefined}>{active ? "Showing on map" : "Show on map"}</span>
                </button>
                {l.description && <p className="mt-2 leading-relaxed text-gray-600">{l.description}</p>}
                <div className="mt-3 space-y-2 text-gray-700">
                  {l.address && (
                    <p className="flex gap-3">
                      <span style={{ color: "var(--theme-color, #111827)" }}><Icon name="map-pin" className="mt-1 h-5 w-5" /></span>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(oneLine(l.address))}`} target="_blank" rel="noopener noreferrer" className="whitespace-pre-line underline-offset-4 hover:underline">{l.address}</a>
                    </p>
                  )}
                  {l.phone && (
                    <p className="flex gap-3">
                      <span style={{ color: "var(--theme-color, #111827)" }}><Icon name="phone" className="mt-1 h-5 w-5" /></span>
                      <a href={`tel:${l.phone.replace(/[^+0-9]/g, "")}`} className="underline-offset-4 hover:underline">{l.phone}</a>
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="h-80 overflow-hidden rounded-3xl bg-gray-100 shadow-sm ring-1 ring-gray-900/5 lg:sticky lg:top-6 lg:h-[34rem]">
        {preview ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-500">
            <Icon name="map-pin" className="h-10 w-10" />
            <span className="font-medium">Your map appears here</span>
          </div>
        ) : current?.address ? (
          <iframe
            key={selected}
            title={`Map of ${current.name || current.address}`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(oneLine(current.address))}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full border-0"
          />
        ) : null}
      </div>
    </div>
  );
}
