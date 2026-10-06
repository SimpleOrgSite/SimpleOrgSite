"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { ICON_LIBRARY } from "@/components/icon-library";
import { Icon, LibraryIcon } from "@/components/icons";
import { MAX_ACTIONS, configItems, configList, configText, type BlockField, type HomeBlock, type LibraryLogo } from "@/lib/blocks";
import type { PageLink } from "@/lib/site";
import { RichEditor } from "../rich-editor";
import { deleteBlock, saveBlock, toggleBlock, type FormState } from "../actions";
import { button, dangerLink, file, input, label, tile } from "../ui";

const iconButton = "flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-30";

// An image input that keeps the existing file unless a new one is chosen or "remove" is ticked.
// "name" is both the file input and the prefix of its hidden "_path" / "_remove" / "_lib" companions read by saveBlock.
// With a "library", the owner can also pick a ready-made logo from the shared logo_library table.
function ImageInput({ name, path, urls, hint, library, libId }: { name: string; path: string; urls: Record<string, string>; hint?: string; library?: LibraryLogo[]; libId?: string }) {
  const url = path ? urls[path] : null;
  const [picked, setPicked] = useState(library?.some((l) => l.id === libId) ? (libId as string) : "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const chosen = library?.find((l) => l.id === picked);
  const q = query.trim().toLowerCase();
  const shown = (library ?? []).filter((l) => !q || l.name.toLowerCase().includes(q));
  return (
    <div className="space-y-2">
      <input type="hidden" name={`${name}_lib`} value={picked} />
      {chosen && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2 pr-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- shared library logo */}
          <img src={chosen.url} alt="" className="h-12 w-20 object-contain" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{chosen.name}</span>
          <button type="button" onClick={() => setPicked("")} className="text-sm text-gray-500 transition hover:text-red-600">Remove</button>
        </div>
      )}
      {url && !chosen && (
        <div className="space-y-2">
          <input type="hidden" name={`${name}_path`} value={path} />
          {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions */}
          <img src={url} alt="" className="h-24 w-auto max-w-full rounded-xl border border-gray-200 bg-white object-contain" />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" name={`${name}_remove`} className="h-4 w-4 accent-gray-900" />
            Remove this image
          </label>
        </div>
      )}
      {library && library.length > 0 && (
        <>
          <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium transition hover:bg-gray-50">
            Choose from our library <Icon name="chevron-down" className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="relative">
                <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                {/* Enter would submit the whole form, so swallow it here. */}
                <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} placeholder="Search" className={`${input} pl-10`} />
              </div>
              <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                {shown.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setPicked(l.id);
                      setOpen(false);
                      setQuery("");
                      // A leftover file would win over the pick on save, so clear it.
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 p-2 text-center transition hover:border-gray-400 hover:bg-gray-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- shared library logo */}
                    <img src={l.url} alt="" className="h-12 w-full object-contain" />
                    <span className="line-clamp-2 text-xs text-gray-600">{l.name}</span>
                  </button>
                ))}
                {shown.length === 0 && <p className="col-span-full py-6 text-center text-sm text-gray-500">No logos match “{query}”.</p>}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500">Or upload your own:</p>
        </>
      )}
      <input ref={fileRef} type="file" name={name} accept="image/png,image/jpeg,image/webp,image/svg+xml" className={file} />
      {hint !== undefined && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

const ICON_NAMES = Object.keys(ICON_LIBRARY);

// Opens inline (no modal) with a search box and a scrollable grid. Submits the chosen icon name, or "" for none, under "name".
function IconPicker({ name, defaultValue, label: ariaLabel }: { name: string; defaultValue: string; label?: string }) {
  const [value, setValue] = useState(Object.hasOwn(ICON_LIBRARY, defaultValue) ? defaultValue : "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? ICON_NAMES.filter((n) => `${n.replace(/-/g, " ")} ${ICON_LIBRARY[n].tags}`.includes(q)) : ICON_NAMES;
  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} />
      <button type="button" aria-label={ariaLabel} aria-expanded={open} onClick={() => setOpen((o) => !o)} className={`${input} flex items-center gap-3 text-left`}>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-700">{value ? <LibraryIcon name={value} className="h-5 w-5" /> : <Icon name="plus" className="h-4 w-4 text-gray-400" />}</span>
        <span className={value ? "" : "text-gray-400"}>{value ? value.replace(/-/g, " ") : "No icon"}</span>
        <Icon name="chevron-down" className={`ml-auto h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              {/* Enter would submit the whole form, so swallow it here. */}
              <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} placeholder="Search icons, e.g. heart, school, phone" className={`${input} pl-10`} />
            </div>
            {value && <button type="button" onClick={() => { setValue(""); setOpen(false); }} className="shrink-0 text-sm text-gray-500 transition hover:text-red-600">No icon</button>}
          </div>
          <div className="grid max-h-64 grid-cols-6 gap-1.5 overflow-y-auto sm:grid-cols-8">
            {shown.map((n) => (
              <button
                key={n}
                type="button"
                title={n.replace(/-/g, " ")}
                aria-label={n.replace(/-/g, " ")}
                onClick={() => { setValue(n); setOpen(false); setQuery(""); }}
                className={`flex aspect-square items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 ${value === n ? "bg-gray-900 !text-white hover:!bg-gray-800" : ""}`}
              >
                <LibraryIcon name={n} className="h-6 w-6" />
              </button>
            ))}
            {shown.length === 0 && <p className="col-span-full py-6 text-center text-sm text-gray-500">No icons match “{query}”.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function RichField({ name, label: text, initial }: { name: string; label: string; initial: string }) {
  const [html, setHtml] = useState(initial);
  return (
    <div className="space-y-1">
      <span className={label}>{text}</span>
      <input type="hidden" name={name} value={html} />
      <RichEditor initial={initial} onChange={setHtml} />
    </div>
  );
}

const CUSTOM = "__custom";

// Pick one of the site's own pages or sections, or type any other link. Submits a single value under "name".
function LinkInput({ name, defaultValue, pages, placeholder, label: ariaLabel }: { name: string; defaultValue: string; pages: PageLink[]; placeholder?: string; label?: string }) {
  const known = pages.some((p) => p.href === defaultValue);
  const [choice, setChoice] = useState(known ? defaultValue : defaultValue ? CUSTOM : "");
  const [custom, setCustom] = useState(known ? "" : defaultValue);
  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={choice === CUSTOM ? custom : choice} />
      <select value={choice} onChange={(e) => setChoice(e.target.value)} aria-label={ariaLabel} className={input}>
        <option value="">No link</option>
        <optgroup label="Pages on your site">
          {pages.map((p) => <option key={p.href} value={p.href}>{p.label}</option>)}
        </optgroup>
        <option value={CUSTOM}>Web address, phone or email…</option>
      </select>
      {choice === CUSTOM && <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={placeholder ?? "https://…, tel:5551234567 or name@example.com"} aria-label={ariaLabel ? `${ariaLabel} address` : undefined} className={input} />}
    </div>
  );
}

type Row = { uid: string; values: Record<string, string> };

// Repeatable rows. Inputs are uncontrolled and keyed by uid, so reordering and deleting keep what's been typed or picked.
function ListField({ field, initial, urls, library, pages }: { field: Extract<BlockField, { kind: "list" }>; initial: Record<string, string>[]; urls: Record<string, string>; library: LibraryLogo[]; pages: PageLink[] }) {
  const [rows, setRows] = useState<Row[]>(() => initial.map((values) => ({ uid: crypto.randomUUID(), values })));
  const move = (i: number, by: -1 | 1) =>
    setRows((all) => {
      const next = [...all];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return next;
    });
  return (
    <fieldset className="space-y-3">
      <legend className={`${label} mb-2`}>{field.label}</legend>
      {rows.map((row, i) => (
        <div key={row.uid} className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50/50 p-4">
          <input type="hidden" name={`${field.key}__rows`} value={row.uid} />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{field.itemLabel} {i + 1}</span>
            <div className="flex">
              <button type="button" aria-label="Move up" title="Move up" disabled={i === 0} onClick={() => move(i, -1)} className={iconButton}><Icon name="arrow-up" /></button>
              <button type="button" aria-label="Move down" title="Move down" disabled={i === rows.length - 1} onClick={() => move(i, 1)} className={iconButton}><Icon name="arrow-down" /></button>
              <button type="button" aria-label={`Delete ${field.itemLabel}`} title="Delete" onClick={() => setRows((all) => all.filter((r) => r.uid !== row.uid))} className={`${iconButton} hover:!bg-red-50 hover:!text-red-600`}><Icon name="trash" /></button>
            </div>
          </div>
          {field.fields.map((sub) => {
            const name = `${field.key}__${row.uid}__${sub.key}`;
            return (
              <div key={sub.key} className="space-y-1">
                <span className={label}>{sub.label}</span>
                {sub.kind === "link" ? (
                  <LinkInput name={name} defaultValue={row.values[sub.key] ?? ""} pages={pages} label={sub.label} />
                ) : sub.kind === "icon" ? (
                  <IconPicker name={name} defaultValue={row.values[sub.key] ?? ""} label={sub.label} />
                ) : sub.kind === "image" ? (
                  <ImageInput name={name} path={row.values[`${sub.key}_path`] ?? ""} urls={urls} library={sub.library ? library.filter((l) => l.category === sub.library) : undefined} libId={row.values[`${sub.key}_lib`]} />
                ) : sub.kind === "textarea" ? (
                  <textarea name={name} defaultValue={row.values[sub.key] ?? ""} rows={3} placeholder={sub.placeholder} className={input} />
                ) : (
                  <input name={name} defaultValue={row.values[sub.key] ?? ""} placeholder={sub.placeholder} className={input} />
                )}
              </div>
            );
          })}
        </div>
      ))}
      {rows.length < field.max && (
        <button
          type="button"
          onClick={() => setRows((all) => [...all, { uid: crypto.randomUUID(), values: {} }])}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-50"
        >
          <Icon name="plus" /> Add {field.itemLabel}
        </button>
      )}
      {field.hint && <p className="text-xs text-gray-500">{field.hint}</p>}
    </fieldset>
  );
}

// Renders whatever fields the block type declares in lib/blocks.ts.
export function BlockForm({ block, fields, urls, pages, library }: { block: HomeBlock; fields: readonly BlockField[]; urls: Record<string, string>; pages: PageLink[]; library: LibraryLogo[] }) {
  const [state, action, pending] = useActionState(saveBlock.bind(null, block.id), null as FormState);
  const c = block.config;
  return (
    <>
      <form action={action} className="space-y-5">
        <label className="block space-y-1">
          <span className={label}>Internal name</span>
          <input name="internal_name" defaultValue={configText(c, "internal_name")} maxLength={60} placeholder="e.g. Spring enrollment hero" className={input} />
          <span className="block text-xs text-gray-500">This doesn&apos;t show on your website. It&apos;s just for you, to name and label this section in your list of blocks.</span>
        </label>
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
              <div key={f.key} className="space-y-1">
                <span className={label}>{f.label}</span>
                <LinkInput name={f.key} defaultValue={configText(c, f.key)} pages={pages} placeholder={f.placeholder} label={f.label} />
              </div>
            );
          }
          if (f.kind === "video") {
            return (
              <label key={f.key} className="block space-y-1">
                <span className={label}>{f.label}</span>
                <input name={f.key} defaultValue={configText(c, f.key)} placeholder="https://www.youtube.com/watch?v=…" className={input} />
                {f.hint && <span className="block text-xs text-gray-500">{f.hint}</span>}
              </label>
            );
          }
          if (f.kind === "embed") {
            return (
              <label key={f.key} className="block space-y-1">
                <span className={label}>{f.label}</span>
                <textarea name={f.key} defaultValue={configText(c, f.key)} rows={4} placeholder='https://… or <iframe src="https://…"></iframe>' className={`${input} font-mono text-sm`} />
                {f.hint && <span className="block text-xs text-gray-500">{f.hint}</span>}
              </label>
            );
          }
          if (f.kind === "richtext") return <RichField key={f.key} name={f.key} label={f.label} initial={configText(c, f.key)} />;
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
            return (
              <div key={f.key} className="space-y-2">
                <span className={label}>{f.label}</span>
                <ImageInput name={f.key} path={configText(c, `${f.key}_path`)} urls={urls} hint={f.hint ?? "PNG, JPG, WebP or SVG, under 5 MB."} />
              </div>
            );
          }
          if (f.kind === "list") return <ListField key={f.key} field={f} initial={configList(c, f.key)} urls={urls} library={library} pages={pages} />;
          // actions
          const items = configItems(c);
          return (
            <fieldset key={f.key} className="space-y-3">
              <legend className={`${label} mb-2`}>{f.label}</legend>
              {Array.from({ length: MAX_ACTIONS }, (_, i) => (
                <div key={i} className="grid gap-2 rounded-2xl border border-gray-200 bg-gray-50/50 p-3 sm:grid-cols-2 sm:items-start">
                  <div className="sm:col-span-2"><IconPicker name={`item_icon_${i}`} defaultValue={items[i]?.icon ?? ""} label={`Button ${i + 1} icon`} /></div>
                  <input name={`item_label_${i}`} defaultValue={items[i]?.label ?? ""} placeholder="Button text" aria-label={`Button ${i + 1} text`} className={input} />
                  <LinkInput name={`item_link_${i}`} defaultValue={items[i]?.link ?? ""} pages={pages} label={`Button ${i + 1} link`} />
                </div>
              ))}
              <p className="text-xs text-gray-500">Leave the text empty to skip a button. Each button can link to one of your pages or sections, or to any web address, phone number or email.</p>
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
