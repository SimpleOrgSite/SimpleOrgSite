"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { NewsItem } from "@/lib/news";
import { deleteNewsItem, saveNewsItem, type FormState } from "../actions";
import { RichEditor } from "../rich-editor";
import { button, dangerLink, input, label, tile } from "../ui";
import { TagInput } from "./tag-input";

export function NewsForm({ item, tagSuggestions, today, back }: { item: NewsItem | null; tagSuggestions: string[]; today: string; back: string }) {
  const [state, action, pending] = useActionState(saveNewsItem.bind(null, item?.id ?? null), null as FormState);
  const [story, setStory] = useState(item?.story ?? "");
  return (
    <>
      <form action={action} className="space-y-5">
        <input type="hidden" name="back" value={back} />
        <label className="block space-y-1">
          <span className={label}>Name</span>
          <input name="name" defaultValue={item?.name} required placeholder="Headline" className={input} />
        </label>
        <div className="space-y-1">
          <span className={label}>Story</span>
          <input type="hidden" name="story" value={story} />
          <RichEditor initial={item?.story ?? ""} onChange={setStory} />
        </div>
        <label className="block space-y-1">
          <span className={label}>Date</span>
          <input type="date" name="published_on" defaultValue={item ? (item.published_on ?? "") : today} className={`${input} sm:w-56`} />
        </label>
        <label className="block space-y-1">
          <span className={label}>Link</span>
          <input name="link" defaultValue={item?.link} placeholder="https://example.com/the-full-story (optional)" className={input} />
        </label>
        <div className="space-y-1">
          <span className={label}>Tags</span>
          <TagInput initial={item?.tags ?? []} suggestions={tagSuggestions} />
        </div>
        <label className={tile}>
          <input type="checkbox" name="visible" defaultChecked={item?.visible ?? true} className="h-4 w-4 accent-gray-900" />
          Show on my site
        </label>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <div className="flex items-center gap-4">
          <button disabled={pending} className={button}>{pending ? "Saving…" : "Save"}</button>
          <Link href={back} className={dangerLink}>Cancel</Link>
        </div>
      </form>
      {item && (
        <form
          action={deleteNewsItem.bind(null, item.id, back)}
          onSubmit={(e) => {
            if (!confirm("Delete this story?")) e.preventDefault();
          }}
          className="mt-8"
        >
          <button className={dangerLink}>Delete</button>
        </form>
      )}
    </>
  );
}
