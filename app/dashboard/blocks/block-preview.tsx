"use client";

import { useEffect } from "react";
import { Icon } from "@/components/icons";
import { blockType } from "@/lib/blocks";
import { previewBlock, SAMPLE_NEWS } from "@/lib/block-samples";
import { AnnouncementBar, BlockView } from "../../site/[domain]/blocks";
import { addBlock } from "../actions";
import { button } from "../ui";

// A sheet that slides up from the bottom showing the block as visitors would see it, filled with sample content.
// The preview itself is inert: nothing in it can be clicked, so sample links never navigate away.
export function BlockPreview({ type, pageId, color, onClose }: { type: string; pageId: string; color: string; onClose: () => void }) {
  const def = blockType(type);
  const sample = previewBlock(type, color);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!def || !sample) return null;
  return (
    <div className="sheet-fade fixed inset-0 z-50 flex items-end justify-center bg-gray-900/40" onClick={onClose}>
      <div
        role="dialog"
        aria-label={`Preview of ${def.label}`}
        className="sheet-up flex max-h-[88vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">{def.label}</h2>
            <p className="truncate text-sm text-gray-500">Preview with sample content, in your theme color</p>
          </div>
          <form action={addBlock.bind(null, pageId, type)}>
            <button className={button}>Add this block</button>
          </form>
          <button type="button" aria-label="Close preview" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto bg-white">
          <div inert className="pointer-events-none text-gray-900" style={{ "--theme-color": color } as React.CSSProperties}>
            {type === "announcement" ? <AnnouncementBar block={sample.block} /> : <BlockView block={sample.block} urls={sample.urls} news={SAMPLE_NEWS} preview />}
          </div>
        </div>
      </div>
    </div>
  );
}
