"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon, LibraryIcon } from "@/components/icons";
import { BLOCK_GROUPS, BLOCK_TYPES, blockSummary, blockType, configText, type PageBlock } from "@/lib/blocks";
import { BlockPreview } from "./block-preview";
import { addBlock, deleteBlock, moveBlock, toggleBlock } from "../actions";

const iconButton = "flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-30";

export function BlockList({ blocks, themeColor, pageId }: { blocks: PageBlock[]; themeColor: string; pageId: string }) {
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  // Matches a block's name or description; sections with nothing left are hidden.
  const matches = (t: (typeof BLOCK_TYPES)[number]) => !q || t.label.toLowerCase().includes(q) || t.hint.toLowerCase().includes(q);
  const groups = BLOCK_GROUPS.map((g) => ({ ...g, types: BLOCK_TYPES.filter((t) => t.group === g.key && matches(t)) })).filter((g) => g.types.length > 0);
  return (
    <div className="space-y-5">
      {blocks.length > 0 ? (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
          {blocks.map((b, i) => (
            <li key={b.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/dashboard/blocks/${b.id}`} className="min-w-0 flex-1">
                <span className={`flex items-baseline gap-2 ${b.enabled ? "" : "text-gray-400"}`}>
                  <span className="truncate font-medium">{configText(b.config, "internal_name") || blockType(b.type)?.label || b.type}</span>
                  {configText(b.config, "internal_name") && <span className="shrink-0 text-xs font-normal text-gray-400">{blockType(b.type)?.label ?? b.type}</span>}
                </span>
                <span className="block truncate text-sm text-gray-500">{blockSummary(b.type, b.config) || "Not filled in yet"}</span>
              </Link>
              <form action={toggleBlock.bind(null, b.id, !b.enabled)}>
                <button
                  role="switch"
                  aria-checked={b.enabled}
                  aria-label={b.enabled ? "Turn off" : "Turn on"}
                  title={b.enabled ? "On: shown on your site" : "Off: hidden from your site"}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${b.enabled ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${b.enabled ? "translate-x-5" : ""}`} />
                </button>
              </form>
              <div className="flex">
                <form action={moveBlock.bind(null, b.id, -1)}>
                  <button aria-label="Move up" title="Move up" disabled={i === 0} className={iconButton}><Icon name="arrow-up" /></button>
                </form>
                <form action={moveBlock.bind(null, b.id, 1)}>
                  <button aria-label="Move down" title="Move down" disabled={i === blocks.length - 1} className={iconButton}><Icon name="arrow-down" /></button>
                </form>
              </div>
              <Link href={`/dashboard/blocks/${b.id}`} aria-label="Edit" title="Edit" className={iconButton}><LibraryIcon name="pencil" className="h-4 w-4" /></Link>
              <form
                action={deleteBlock.bind(null, b.id)}
                onSubmit={(e) => {
                  if (!confirm("Delete this block? This can't be undone.")) e.preventDefault();
                }}
              >
                <button aria-label="Delete" title="Delete" className={`${iconButton} hover:!bg-red-50 hover:!text-red-600`}><Icon name="trash" /></button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">No blocks on this page yet. Add one below.</p>
      )}

      <div className="space-y-6 border-t border-gray-100 pt-5">
        <p className="text-sm font-medium text-gray-700">Add a block</p>
        <div className="relative">
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          {/* Enter would otherwise do nothing useful, so it just keeps focus here. */}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            placeholder="Search blocks, e.g. photos, insurance, form"
            aria-label="Search blocks"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-4 focus:ring-gray-900/5"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
              <Icon name="x" className="h-4 w-4" />
            </button>
          )}
        </div>
        {groups.length === 0 && <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">No blocks match “{query}”.</p>}
        {groups.map((g) => (
          <div key={g.key} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{g.label}</h3>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {g.types.map((t) => (
                <div key={t.type} className="relative">
                  <form action={addBlock.bind(null, pageId, t.type)} className="h-full">
                    <button className="flex h-full w-full items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 pr-28 text-left transition hover:bg-gray-50">
                      <Icon name="plus" className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                      <span>
                        <span className="block font-medium">{t.label}</span>
                        <span className="block text-sm text-gray-500">{t.hint}</span>
                      </span>
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setPreviewing(t.type)}
                    className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Icon name="eye" className="h-4 w-4" /> Preview
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {previewing && <BlockPreview type={previewing} pageId={pageId} color={themeColor} onClose={() => setPreviewing(null)} />}
    </div>
  );
}
