"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Director } from "@/lib/directors";
import { button, dangerLink, file, input, label } from "../ui";
import { deleteDirector, saveDirector, type FormState } from "../actions";


export function DirectorForm({ director, photoUrl }: { director: Director | null; photoUrl: string | null }) {
  const [state, action, pending] = useActionState(saveDirector.bind(null, director?.id ?? null), null as FormState);
  return (
    <>
      <form action={action} className="space-y-4">
        <label className="block space-y-1">
          <span className={label}>Name</span>
          <input name="name" defaultValue={director?.name} required className={input} />
        </label>
        <label className="block space-y-1">
          <span className={label}>Title</span>
          <input name="title" defaultValue={director?.title} className={input} />
        </label>
        <label className="block space-y-1">
          <span className={label}>Affiliation</span>
          <input name="affiliation" defaultValue={director?.affiliation} className={input} />
        </label>
        <div className="space-y-2">
          <span className={label}>Photo</span>
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded
            <img src={photoUrl} alt="" className="h-24 w-24 rounded-2xl object-cover" />
          )}
          <input type="file" name="photo" accept="image/png,image/jpeg,image/webp,image/svg+xml" className={file} />
          {photoUrl && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" name="remove_photo" className="accent-gray-900" /> Remove current photo
            </label>
          )}
        </div>
        <label className="block space-y-1">
          <span className={label}>Bio</span>
          <textarea name="bio" defaultValue={director?.bio} rows={6} className={input} />
        </label>
        <label className="block space-y-1">
          <span className={label}>Email</span>
          <input type="email" name="email" defaultValue={director?.email} className={input} />
        </label>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <div className="flex items-center gap-4">
          <button disabled={pending} className={button}>{pending ? "Saving…" : "Save"}</button>
          <Link href="/dashboard?tab=about" className={dangerLink}>Cancel</Link>
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
          <button className={dangerLink}>Delete</button>
        </form>
      )}
    </>
  );
}
