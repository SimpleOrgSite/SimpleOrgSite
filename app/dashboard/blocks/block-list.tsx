"use client";

import Link from "next/link";
import { Icon, LibraryIcon } from "@/components/icons";
import { BLOCK_TYPES, blockSummary, blockType, type HomeBlock } from "@/lib/blocks";
import { addBlock, deleteBlock, moveBlock, toggleBlock } from "../actions";

const iconButton = "flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-30";

export function BlockList({ blocks }: { blocks: HomeBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.length > 0 ? (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
          {blocks.map((b, i) => (
            <li key={b.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/dashboard/blocks/${b.id}`} className="min-w-0 flex-1">
                <span className={`block font-medium ${b.enabled ? "" : "text-gray-400"}`}>{blockType(b.type)?.label ?? b.type}</span>
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
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">No blocks yet. Add one below.</p>
      )}

      <div className="space-y-2 border-t border-gray-100 pt-5">
        <p className="text-sm font-medium text-gray-700">Add a block</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {BLOCK_TYPES.map((t) => (
            <form key={t.type} action={addBlock.bind(null, t.type)}>
              <button className="flex h-full w-full items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left transition hover:bg-gray-50">
                <Icon name="plus" className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                <span>
                  <span className="block font-medium">{t.label}</span>
                  <span className="block text-sm text-gray-500">{t.hint}</span>
                </span>
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
