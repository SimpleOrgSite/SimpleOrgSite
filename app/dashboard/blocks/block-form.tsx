"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { ACTION_ICONS, MAX_ACTIONS, configItems, configText, type BlockField, type HomeBlock } from "@/lib/blocks";
import { deleteBlock, saveBlock, toggleBlock, type FormState } from "../actions";
import { button, dangerLink, file, input, label, tile } from "../ui";

// Renders whatever fields the block type declares in lib/blocks.ts.
export function BlockForm({ block, fields, imageUrls }: { block: HomeBlock; fields: readonly BlockField[]; imageUrls: Record<string, string | null> }) {
  const [state, action, pending] = useActionState(saveBlock.bind(null, block.id), null as FormState);
  const c = block.config;
  return (
    <>
      <form action={action} className="space-y-5">
        {fields.map((f) => {
          if (f.kind === "text") {
            return (
              <label key={f.key} className="block space-y-1">
                <span className={label}>{f.label}</span>
                <input name={f.key} defaultValue={configText(c, f.key)} placeholder={f.placeholder} className={input} />
              </label>
            );
          }
          if (f.kind === "link") {
            return (
              <label key={f.key} className="block space-y-1">
                <span className={label}>{f.label}</span>
                <input name={f.key} defaultValue={configText(c, f.key)} placeholder={f.placeholder} className={input} />
              </label>
            );
          }
          if (f.kind === "textarea") {
            return (
              <label key={f.key} className="block space-y-1">
                <span className={label}>{f.label}</span>
                <textarea name={f.key} defaultValue={configText(c, f.key)} rows={3} className={input} />
              </label>
            );
          }
          if (f.kind === "choice") {
            return (
              <fieldset key={f.key} className="space-y-2">
                <legend className={`${label} mb-2`}>{f.label}</legend>
                <div className="grid grid-cols-2 gap-2">
                  {f.options.map((o) => (
                    <label key={o.value} className={tile}>
                      <input type="radio" name={f.key} value={o.value} defaultChecked={(configText(c, f.key) || f.options[0].value) === o.value} className="accent-gray-900" />
                      {o.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          }
          if (f.kind === "image") {
            const url = imageUrls[f.key];
            return (
              <div key={f.key} className="space-y-2">
                <span className={label}>{f.label}</span>
                {url && (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions */}
                    <img src={url} alt="" className="h-32 w-auto max-w-full rounded-xl border border-gray-200 object-cover" />
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" name={`${f.key}_remove`} className="h-4 w-4 accent-gray-900" />
                      Remove this image
                    </label>
                  </div>
                )}
                <input type="file" name={f.key} accept="image/png,image/jpeg,image/webp,image/svg+xml" className={file} />
                <p className="text-xs text-gray-500">{f.hint ?? "PNG, JPG, WebP or SVG, under 2 MB."}</p>
              </div>
            );
          }
          // actions
          const items = configItems(c);
          return (
            <fieldset key={f.key} className="space-y-3">
              <legend className={`${label} mb-2`}>{f.label}</legend>
              {Array.from({ length: MAX_ACTIONS }, (_, i) => (
                <div key={i} className="grid gap-2 rounded-2xl border border-gray-200 bg-gray-50/50 p-3 sm:grid-cols-[auto_1fr_1fr]">
                  <select name={`item_icon_${i}`} defaultValue={items[i]?.icon ?? ACTION_ICONS[0]} aria-label={`Button ${i + 1} icon`} className={`${input} sm:w-44`}>
                    {ACTION_ICONS.map((n) => <option key={n} value={n}>{n.replace(/-/g, " ")}</option>)}
                  </select>
                  <input name={`item_label_${i}`} defaultValue={items[i]?.label ?? ""} placeholder="Button text" aria-label={`Button ${i + 1} text`} className={input} />
                  <input name={`item_link_${i}`} defaultValue={items[i]?.link ?? ""} placeholder="Link" aria-label={`Button ${i + 1} link`} className={input} />
                </div>
              ))}
              <p className="text-xs text-gray-500">Leave the text empty to skip a button. Links can be a web address, a page like /about, or tel: and mailto: links.</p>
            </fieldset>
          );
        })}
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        {state?.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{state.ok}</p>}
        <div className="flex items-center gap-4">
          <button disabled={pending} className={button}>{pending ? "Saving…" : "Save"}</button>
          <Link href="/dashboard?tab=home" className={dangerLink}>Back to list</Link>
        </div>
      </form>

      <div className="mt-8 flex items-center gap-6 border-t border-gray-100 pt-5">
        <form action={toggleBlock.bind(null, block.id, !block.enabled)}>
          <button className="flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-900">
            <Icon name={block.enabled ? "eye-off" : "eye"} />
            {block.enabled ? "Turn off" : "Turn on"}
          </button>
        </form>
        <form
          action={deleteBlock.bind(null, block.id)}
          onSubmit={(e) => {
            if (!confirm("Delete this block?")) e.preventDefault();
          }}
        >
          <button className={dangerLink}>Delete</button>
        </form>
      </div>
    </>
  );
}
