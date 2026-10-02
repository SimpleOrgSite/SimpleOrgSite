"use client";

import { useActionState } from "react";
import { addDomain, removeDomain, removeLogo, saveAbout, saveMessage, saveSiteName, uploadLogo, verifySite, type FormState } from "./actions";

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

export function LogoForm({ logoUrl }: { logoUrl: string | null }) {
  const [state, action, pending] = useActionState(uploadLogo, null);
  return (
    <div className="space-y-3">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions
        <img src={logoUrl} alt="Current logo" className="h-12 w-auto max-w-[220px] object-contain" />
      )}
      <form action={action} className="space-y-3">
        <input type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" required className="block text-sm" />
        <Feedback state={state} />
        <button disabled={pending} className={button}>{pending ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}</button>
      </form>
      {logoUrl && (
        <form action={removeLogo}>
          <button className="text-sm text-gray-500 underline">Remove logo</button>
        </form>
      )}
    </div>
  );
}

export function AboutForm({ enabled, content }: { enabled: boolean; content: string }) {
  const [state, action, pending] = useActionState(saveAbout, null);
  return (
    <form action={action} className="space-y-3">
      <label className="flex items-center gap-2">
        <input type="checkbox" name="about_enabled" defaultChecked={enabled} />
        Show “About Us” in my site&apos;s menu
      </label>
      <textarea name="about_content" defaultValue={content} rows={8} placeholder="Tell visitors who you are…" className="w-full rounded border p-2" />
      <Feedback state={state} />
      <button disabled={pending} className={button}>{pending ? "Saving…" : "Save About Us"}</button>
    </form>
  );
}
