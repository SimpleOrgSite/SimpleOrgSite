"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { normalizeTags } from "@/lib/news";

// Free-form tags: type and press Enter or comma. Existing tags from other stories are offered as one-click suggestions.
export function TagInput({ initial, suggestions }: { initial: string[]; suggestions: string[] }) {
  const [tags, setTags] = useState(initial);
  const [text, setText] = useState("");

  const add = (raw: string) => {
    setTags((current) => normalizeTags([...current, ...raw.split(",")]));
    setText("");
  };
  const remove = (tag: string) => setTags((current) => current.filter((t) => t !== tag));
  const unused = suggestions.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()));

  return (
    <div className="space-y-2">
      {tags.map((t) => <input key={t} type="hidden" name="tag" value={t} />)}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 transition focus-within:border-gray-400 focus-within:ring-4 focus-within:ring-gray-900/5">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-3 pr-1.5 text-sm text-gray-700">
            {t}
            <button type="button" aria-label={`Remove tag ${t}`} onClick={() => remove(t)} className="rounded-full p-0.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700">
              <Icon name="x" className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setText(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Enter must add the tag, not submit the story
              add(text);
            } else if (e.key === "Backspace" && !text && tags.length) {
              setTags(tags.slice(0, -1));
            }
          }}
          onBlur={() => text.trim() && add(text)}
          placeholder={tags.length ? "Add another…" : "Type a tag and press Enter"}
          className="min-w-32 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-gray-400"
        />
      </div>
      {unused.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Your tags:</span>
          {unused.map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-sm text-gray-600 transition hover:border-gray-400 hover:bg-gray-50">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
