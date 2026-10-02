"use client";

import { useActionState, useState } from "react";
import { Icon } from "./icons";
import { RichEditor } from "./rich-editor";
import { button, dangerLink, file, input, label as labelText, tile } from "./ui";
import { logoHeight } from "@/lib/logo";
import { DIRECTOR_LAYOUTS, PHOTO_SHAPES, SHAPE_CLASSES, type DirectorLayout, type PhotoShape } from "@/lib/directors";
import type { AboutSection } from "@/lib/site";
import { addDomain, removeDomain, removeLogo, saveAbout, saveDirectorsSettings, saveHeaderStyle, saveLogoSize, saveMessage, saveSiteName, uploadLogo, verifySite, type FormState } from "./actions";

function Feedback({ state }: { state: FormState }) {
  if (state?.error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>;
  if (state?.ok) return <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{state.ok}</p>;
  return null;
}


export function AddDomainForm() {
  const [state, action, pending] = useActionState(addDomain, null);
  return (
    <form action={action} className="space-y-4">
      <input name="domain" placeholder="example.com or www.example.com" required className={input} />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? "Adding…" : "Add domain"}</button>
    </form>
  );
}

export function MessageForm({ message }: { message: string }) {
  const [state, action, pending] = useActionState(saveMessage, null);
  return (
    <form action={action} className="space-y-4">
      <input name="message" defaultValue={message} required className={input} />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? "Saving…" : "Save message"}</button>
    </form>
  );
}

export function VerifyForm() {
  const [state, action, pending] = useActionState(verifySite, null);
  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? "Checking…" : "Check my domain"}</button>
    </form>
  );
}

export function RemoveDomainForm() {
  return (
    <form
      action={removeDomain}
      onSubmit={(e) => {
        if (!confirm("Remove this domain and its site?")) e.preventDefault();
      }}
    >
      <button className={dangerLink}>Remove domain</button>
    </form>
  );
}

export function SiteNameForm({ siteName }: { siteName: string }) {
  const [state, action, pending] = useActionState(saveSiteName, null);
  return (
    <form action={action} className="space-y-4">
      <input name="site_name" defaultValue={siteName} placeholder="Shown in the header if you have no logo" className={input} />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? "Saving…" : "Save name"}</button>
    </form>
  );
}

export function LogoForm({ logoUrl, logoSize }: { logoUrl: string | null; logoSize: number }) {
  const [state, action, pending] = useActionState(uploadLogo, null);
  const [sizeState, sizeAction, sizePending] = useActionState(saveLogoSize, null);
  const [size, setSize] = useState(logoSize);
  return (
    <div className="space-y-6">
      {/* Preview on a header-like strip, so size changes read the way visitors will see them. */}
      <div className="flex min-h-24 items-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
          <img src={logoUrl} alt="Current logo" style={{ height: logoHeight(size) }} className="w-auto max-w-full object-contain" />
        ) : (
          <p className="text-sm text-gray-500">No logo yet. Upload one below.</p>
        )}
      </div>
      <form action={action} className="space-y-3">
        <input type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" required className={file} />
        <p className="text-xs text-gray-500">PNG, JPG, WebP or SVG, up to 2 MB.</p>
        <Feedback state={state} />
        <button disabled={pending} className={button}>{pending ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}</button>
      </form>
      {logoUrl && (
        <>
          <form action={sizeAction} className="space-y-3 border-t border-gray-100 pt-6">
            <label className="flex items-center gap-4">
              <span className={labelText}>Size</span>
              <input type="range" name="logo_size" min={1} max={10} step={1} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-56 accent-gray-900" />
              <span className="w-5 text-sm tabular-nums text-gray-600">{size}</span>
            </label>
            <Feedback state={sizeState} />
            <button disabled={sizePending} className={button}>{sizePending ? "Saving…" : "Save size"}</button>
          </form>
          <form action={removeLogo}>
            <button className={dangerLink}>Remove logo</button>
          </form>
        </>
      )}
    </div>
  );
}

type EditableSection = { id: string; title: string; body: string };

export function AboutForm({ enabled, label, sections: initial }: { enabled: boolean; label: string; sections: AboutSection[] }) {
  const [state, action, pending] = useActionState(saveAbout, null);
  const [sections, setSections] = useState<EditableSection[]>(initial.map(({ id, title, body }) => ({ id, title, body })));

  const update = (id: string, patch: Partial<EditableSection>) => setSections((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const move = (i: number, by: number) =>
    setSections((all) => {
      const next = [...all];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return next;
    });
  const iconButton = "flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <form action={action} className="space-y-4">
      <label className={tile}>
        <input type="checkbox" name="about_enabled" defaultChecked={enabled} className="h-4 w-4 accent-gray-900" />
        Show this page in my site&apos;s menu
      </label>
      <label className="block space-y-1">
        <span className={labelText}>Menu and page title</span>
        <input name="about_label" defaultValue={label} placeholder="About Us" className={input} />
      </label>

      <div className="space-y-4 border-t border-gray-100 pt-5">
        <p className="text-sm text-gray-500">Each section appears on your page and as a choice in the menu dropdown.</p>
        {sections.map((s, i) => (
          <div key={s.id} className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50/50 p-4">
            <input type="hidden" name="section_id" value={s.id} />
            <input type="hidden" name="section_body" value={s.body} />
            <div className="flex items-center gap-2">
              <input
                name="section_title"
                value={s.title}
                onChange={(e) => update(s.id, { title: e.target.value })}
                placeholder="Section name, e.g. Our mission"
                className={`${input} font-medium`}
              />
              <button type="button" aria-label="Move up" title="Move up" disabled={i === 0} onClick={() => move(i, -1)} className={iconButton}><Icon name="arrow-up" /></button>
              <button type="button" aria-label="Move down" title="Move down" disabled={i === sections.length - 1} onClick={() => move(i, 1)} className={iconButton}><Icon name="arrow-down" /></button>
              <button
                type="button"
                aria-label="Delete section"
                title="Delete section"
                onClick={() => setSections((all) => all.filter((x) => x.id !== s.id))}
                className={`${iconButton} hover:!bg-red-50 hover:!text-red-600`}
              >
                <Icon name="trash" />
              </button>
            </div>
            <RichEditor initial={s.body} onChange={(body) => update(s.id, { body })} />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSections((all) => [...all, { id: crypto.randomUUID(), title: "", body: "" }])}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-50"
        >
          <Icon name="plus" /> Add section
        </button>
      </div>

      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}

export function DirectorsSettingsForm({
  enabled, label, layout, shape,
}: { enabled: boolean; label: string; layout: DirectorLayout; shape: PhotoShape }) {
  const [state, action, pending] = useActionState(saveDirectorsSettings, null);
  const [layoutChoice, setLayoutChoice] = useState(layout);
  return (
    <form action={action} className="space-y-4">
      <label className={tile}>
        <input type="checkbox" name="directors_enabled" defaultChecked={enabled} className="h-4 w-4 accent-gray-900" />
        Show this section on my About page
      </label>
      <label className="block space-y-1">
        <span className={labelText}>Section title (also its menu entry)</span>
        <input name="directors_label" defaultValue={label} placeholder="Directors" className={input} />
      </label>
      <fieldset className="space-y-2">
        <legend className={`${labelText} mb-2`}>How to show people</legend>
        {DIRECTOR_LAYOUTS.map((l) => (
          <label key={l.key} className={tile}>
            <input type="radio" name="directors_layout" className="accent-gray-900" value={l.key} checked={layoutChoice === l.key} onChange={() => setLayoutChoice(l.key)} />
            {l.label}
          </label>
        ))}
      </fieldset>
      {/* Hidden, not unmounted, so the chosen shape is still submitted with the "names only" layout. */}
      <fieldset className={layoutChoice === "list" ? "hidden" : "space-y-2"}>
        <legend className={`${labelText} mb-2`}>Photo shape</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PHOTO_SHAPES.map((s) => (
            <label key={s.key} className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-gray-200 px-2 py-3 text-sm transition hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
              <span className={`w-10 bg-gray-300 ${SHAPE_CLASSES[s.key]}`} />
              <span className="flex items-center gap-1.5">
                <input type="radio" name="directors_photo_shape" value={s.key} defaultChecked={shape === s.key} className="accent-gray-900" />
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}

const THEME_COLORS = ["#1f2937", "#2563eb", "#0f766e", "#16a34a", "#dc2626", "#ea580c", "#7c3aed", "#db2777"];

export function HeaderStyleForm({
  style: initialStyle, color: initialColor, siteName, logoUrl, logoSize,
}: { style: "light" | "dark"; color: string; siteName: string; logoUrl: string | null; logoSize: number }) {
  const [state, action, pending] = useActionState(saveHeaderStyle, null);
  const [style, setStyle] = useState(initialStyle);
  const [color, setColor] = useState(initialColor);
  const dark = style === "dark";
  return (
    <form action={action} className="space-y-5">
      {/* Mini header so the choice can be judged before saving. */}
      <div
        className={`flex items-center justify-between rounded-xl px-5 py-3 ${dark ? "" : "border border-gray-200 bg-white"}`}
        style={dark ? { backgroundColor: color, color: "#fff" } : { color }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
          <img src={logoUrl} alt="" style={{ height: Math.min(logoHeight(logoSize), 40) }} className="w-auto max-w-[50%] object-contain" />
        ) : (
          <span className="text-lg font-bold">{siteName || "Your site"}</span>
        )}
        <span className="flex gap-6 text-sm opacity-80"><span>Home</span><span>About</span></span>
      </div>

      <fieldset className="space-y-2">
        <legend className={`${labelText} mb-2`}>Header style</legend>
        <div className="grid grid-cols-2 gap-2">
          {([["light", "Light", "White background, text in your theme color"], ["dark", "Dark", "Your theme color background, white text"]] as const).map(([value, name, hint]) => (
            <label key={value} className={`${tile} items-start`}>
              <input type="radio" name="header_style" value={value} checked={style === value} onChange={() => setStyle(value)} className="mt-1 accent-gray-900" />
              <span>
                <span className="block font-medium">{name}</span>
                <span className="block text-sm text-gray-500">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className={`${labelText} mb-2`}>Theme color</legend>
        <input type="hidden" name="theme_color" value={color} />
        <div className="flex flex-wrap items-center gap-2.5">
          {THEME_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Theme color ${c}`}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full ring-offset-2 transition hover:scale-110 ${color === c ? "ring-2 ring-gray-900" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="ml-2 flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0" />
            Custom
          </label>
        </div>
        {dark && <p className="text-xs text-gray-500">Text is white on a dark header, so pick a darker color.</p>}
      </fieldset>

      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? "Saving…" : "Save header style"}</button>
    </form>
  );
}
