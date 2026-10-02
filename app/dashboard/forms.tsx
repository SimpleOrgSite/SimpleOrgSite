"use client";

import { useActionState, useState } from "react";
import { button, dangerLink, file, input, label as labelText, tile } from "./ui";
import { logoHeight } from "@/lib/logo";
import { DEFAULT_FIELD_LABELS, DIRECTOR_FIELDS, DIRECTOR_LAYOUTS, PHOTO_SHAPES, SHAPE_CLASSES, type DirectorLayout, type FieldLabels, type PhotoShape } from "@/lib/directors";
import type { AboutSectionType } from "@/lib/site";
import { addDomain, removeDomain, removeLogo, saveAbout, saveDirectorsSettings, saveLogoSize, saveMessage, saveSiteName, uploadLogo, verifySite, type FormState } from "./actions";

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

export function AboutForm({ enabled, label, sections }: { enabled: boolean; label: string; sections: AboutSectionType[] }) {
  const [state, action, pending] = useActionState(saveAbout, null);
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
      <p className="border-t border-gray-100 pt-4 text-sm text-gray-500">Fill in any of these. Empty ones won&apos;t appear on your page.</p>
      {sections.map((s) => (
        <label key={s.key} className="block space-y-1">
          <span className={labelText}>{s.label}</span>
          <textarea name={`section_${s.key}`} defaultValue={s.content} rows={5} className={input} />
        </label>
      ))}
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}

export function DirectorsSettingsForm({
  enabled, label, labels, layout, shape,
}: { enabled: boolean; label: string; labels: FieldLabels; layout: DirectorLayout; shape: PhotoShape }) {
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
      <fieldset className="space-y-2">
        <legend className={`${labelText} mb-2`}>What you call each field</legend>
        <div className="grid grid-cols-2 gap-3">
          {DIRECTOR_FIELDS.map((f) => (
            <label key={f} className="space-y-1">
              <span className="text-xs text-gray-500">{DEFAULT_FIELD_LABELS[f]}</span>
              <input name={`label_${f}`} defaultValue={labels[f]} className={input} />
            </label>
          ))}
        </div>
      </fieldset>
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}
