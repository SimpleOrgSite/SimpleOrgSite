"use client";

import { useActionState } from "react";
import { addDomain, removeDomain, saveMessage, verifySite, type FormState } from "./actions";

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
