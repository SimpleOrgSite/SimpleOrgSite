"use client";

import { useActionState, useState } from "react";
import { logoHeight } from "@/lib/logo";
import { DIRECTOR_FIELDS, DIRECTOR_LAYOUTS, PHOTO_SHAPES, SHAPE_CLASSES, type DirectorLayout, type FieldLabels, type PhotoShape } from "@/lib/directors";
import type { AboutSectionType } from "@/lib/site";
import { addDomain, removeDomain, removeLogo, saveAbout, saveDirectorsSettings, saveLogoSize, saveMessage, saveSiteName, uploadLogo, verifySite, type FormState } from "./actions";

function Feedback({ state }: { state: FormState }) {
  if (state?.error) return <p className="text-sm text-red-600">{state.error}</p>;
  if (state?.ok) return <p className="text-sm text-green-700">{state.ok}</p>;
  return null;
}

const button = "rounded bg-black px-4 py-2 text-white disabled:opacity-50";

export function AddDomainForm() {
  const [state, action, pending] = useActionState(addDomain, null);
  return (
    <form action={action} className="space-y-3">
      <input name="domain" placeholder="example.com or www.example.com" required className="w-full rounded border p-2" />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? "Adding…" : "Add domain"}</button>
    </form>
  );
}

export function MessageForm({ message }: { message: string }) {
  const [state, action, pending] = useActionState(saveMessage, null);
  return (
    <form action={action} className="space-y-3">
      <input name="message" defaultValue={message} required className="w-full rounded border p-2" />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? "Saving…" : "Save message"}</button>
    </form>
  );
}

export function VerifyForm() {
  const [state, action, pending] = useActionState(verifySite, null);
  return (
    <form action={action} className="space-y-3">
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
      <button className="text-sm text-gray-500 underline">Remove domain</button>
    </form>
  );
}

export function SiteNameForm({ siteName }: { siteName: string }) {
  const [state, action, pending] = useActionState(saveSiteName, null);
  return (
    <form action={action} className="space-y-3">
      <input name="site_name" defaultValue={siteName} placeholder="Shown in the header if you have no logo" className="w-full rounded border p-2" />
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
    <div className="space-y-3">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
        <img src={logoUrl} alt="Current logo" style={{ height: logoHeight(size) }} className="w-auto max-w-full object-contain" />
      )}
      <form action={action} className="space-y-3">
        <input type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" required className="block text-sm" />
        <Feedback state={state} />
        <button disabled={pending} className={button}>{pending ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}</button>
      </form>
      {logoUrl && (
        <form action={sizeAction} className="space-y-3">
          <label className="flex items-center gap-3 text-sm">
            Size
            <input type="range" name="logo_size" min={1} max={10} step={1} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-48" />
            <span className="w-4 tabular-nums">{size}</span>
          </label>
          <Feedback state={sizeState} />
          <button disabled={sizePending} className={button}>{sizePending ? "Saving…" : "Save size"}</button>
        </form>
      )}
      {logoUrl && (
        <form action={removeLogo}>
          <button className="text-sm text-gray-500 underline">Remove logo</button>
        </form>
      )}
    </div>
  );
}

export function AboutForm({ enabled, label, sections }: { enabled: boolean; label: string; sections: AboutSectionType[] }) {
  const [state, action, pending] = useActionState(saveAbout, null);
  return (
    <form action={action} className="space-y-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" name="about_enabled" defaultChecked={enabled} />
        Show this page in my site&apos;s menu
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-gray-600">Menu and page title</span>
        <input name="about_label" defaultValue={label} placeholder="About Us" className="w-full rounded border p-2" />
      </label>
      <p className="text-sm text-gray-600">Fill in any of these. Empty ones won&apos;t appear on your page.</p>
      {sections.map((s) => (
        <label key={s.key} className="block space-y-1">
          <span className="font-medium">{s.label}</span>
          <textarea name={`section_${s.key}`} defaultValue={s.content} rows={5} className="w-full rounded border p-2" />
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
      <label className="flex items-center gap-2">
        <input type="checkbox" name="directors_enabled" defaultChecked={enabled} />
        Show this section on my About page
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-gray-600">Section title (also its menu entry)</span>
        <input name="directors_label" defaultValue={label} placeholder="Directors" className="w-full rounded border p-2" />
      </label>
      <fieldset className="space-y-2">
        <legend className="text-sm text-gray-600">How to show people</legend>
        {DIRECTOR_LAYOUTS.map((l) => (
          <label key={l.key} className="flex items-center gap-2">
            <input type="radio" name="directors_layout" value={l.key} checked={layoutChoice === l.key} onChange={() => setLayoutChoice(l.key)} />
            {l.label}
          </label>
        ))}
      </fieldset>
      {/* Hidden, not unmounted, so the chosen shape is still submitted with the "names only" layout. */}
      <fieldset className={layoutChoice === "list" ? "hidden" : "space-y-2"}>
        <legend className="text-sm text-gray-600">Photo shape</legend>
        <div className="flex flex-wrap gap-4">
          {PHOTO_SHAPES.map((s) => (
            <label key={s.key} className="flex flex-col items-center gap-1 text-sm">
              <span className={`w-12 bg-gray-300 ${SHAPE_CLASSES[s.key]}`} />
              <span className="flex items-center gap-1">
                <input type="radio" name="directors_photo_shape" value={s.key} defaultChecked={shape === s.key} />
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm text-gray-600">What you call each field</legend>
        <div className="grid grid-cols-2 gap-2">
          {DIRECTOR_FIELDS.map((f) => (
            <input key={f} name={`label_${f}`} defaultValue={labels[f]} aria-label={`Label for ${f}`} className="rounded border p-2" />
          ))}
        </div>
      </fieldset>
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}
