"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { BLOCK_TYPES, blockSummary, blockType, type HomeBlock } from "@/lib/blocks";
import { addBlock, moveBlock, toggleBlock } from "../actions";

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
              <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline ${b.enabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {b.enabled ? "On" : "Off"}
              </span>
              <form action={toggleBlock.bind(null, b.id, !b.enabled)}>
                <button aria-label={b.enabled ? "Turn off" : "Turn on"} title={b.enabled ? "Turn off" : "Turn on"} className={iconButton}>
                  <Icon name={b.enabled ? "eye" : "eye-off"} />
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
