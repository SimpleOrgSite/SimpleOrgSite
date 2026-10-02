"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Director, FieldLabels } from "@/lib/directors";
import { deleteDirector, saveDirector, type FormState } from "../actions";

const input = "w-full rounded border p-2";

export function DirectorForm({ director, labels, photoUrl }: { director: Director | null; labels: FieldLabels; photoUrl: string | null }) {
  const [state, action, pending] = useActionState(saveDirector.bind(null, director?.id ?? null), null as FormState);
  return (
    <>
      <form action={action} className="space-y-4">
        <label className="block space-y-1">
          <span className="font-medium">{labels.name}</span>
          <input name="name" defaultValue={director?.name} required className={input} />
        </label>
        <label className="block space-y-1">
          <span className="font-medium">{labels.title}</span>
          <input name="title" defaultValue={director?.title} className={input} />
        </label>
        <label className="block space-y-1">
          <span className="font-medium">{labels.affiliation}</span>
          <input name="affiliation" defaultValue={director?.affiliation} className={input} />
        </label>
        <div className="space-y-2">
          <span className="font-medium">{labels.photo}</span>
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded
            <img src={photoUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
          )}
          <input type="file" name="photo" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="block text-sm" />
          {photoUrl && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" name="remove_photo" /> Remove current photo
            </label>
          )}
        </div>
        <label className="block space-y-1">
          <span className="font-medium">{labels.bio}</span>
          <textarea name="bio" defaultValue={director?.bio} rows={6} className={input} />
        </label>
        <label className="block space-y-1">
          <span className="font-medium">{labels.email}</span>
          <input type="email" name="email" defaultValue={director?.email} className={input} />
        </label>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <div className="flex items-center gap-4">
          <button disabled={pending} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">{pending ? "Saving…" : "Save"}</button>
          <Link href="/dashboard" className="text-sm text-gray-500 underline">Cancel</Link>
        </div>
      </form>
      {director && (
        <form
          action={deleteDirector.bind(null, director.id)}
          onSubmit={(e) => {
            if (!confirm("Delete this person?")) e.preventDefault();
          }}
          className="mt-8"
        >
          <button className="text-sm text-gray-500 underline">Delete</button>
        </form>
      )}
    </>
  );
}
