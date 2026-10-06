"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Icon, LibraryIcon } from "@/components/icons";
import type { SitePage } from "@/lib/pages";
import { addPage, deletePage, movePage, savePage, savePagePlacement, togglePageActive, type FormState } from "../actions";
import { button, dangerLink, input, label, tile } from "../ui";

const iconButton = "flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-30";

// The Site tab's list of pages: switch one on or off, edit it, delete it, reorder, or add a new one.
export function PagesList({ pages }: { pages: SitePage[] }) {
  const [state, action, pending] = useActionState(addPage, null as FormState);
  return (
    <div className="space-y-5">
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
        {pages.map((p) => {
          // Arrows move a page among its siblings: other top-level pages, or the other sub pages under the same parent.
          const parent = pages.find((x) => x.id === p.parent_id);
          const sibs = pages.filter((x) => !x.is_home && (parent ? x.parent_id === parent.id : !x.parent_id || !pages.some((y) => y.id === x.parent_id)));
          const i = sibs.indexOf(p);
          return (
            <li key={p.id} className={`flex items-center gap-3 px-4 py-3 ${parent ? "bg-gray-50/60 pl-10" : ""}`}>
              <Link href={`/dashboard?tab=p-${p.id}`} className="min-w-0 flex-1">
                <span className={`block truncate font-medium ${p.active ? "" : "text-gray-400"}`}>{p.title}</span>
                <span className="block truncate text-sm text-gray-500">
                  {p.is_home ? "/ (your home page)" : `/${p.slug}`}
                  {parent && ` · sub page of ${parent.title}`}
                  {!p.is_home && !p.active && " · inactive: hidden from visitors"}
                  {!p.is_home && p.active && !p.show_in_menu && " · not in the menu"}
                </span>
              </Link>
              {p.is_home ? (
                <span className="hidden text-xs text-gray-400 sm:inline">Always active</span>
              ) : (
                <form action={togglePageActive.bind(null, p.id, !p.active)}>
                  <button
                    role="switch"
                    aria-checked={p.active}
                    aria-label={p.active ? "Make inactive" : "Make active"}
                    title={p.active ? "Active: visitors can see this page" : "Inactive: hidden from visitors and the menu"}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${p.active ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${p.active ? "translate-x-5" : ""}`} />
                  </button>
                </form>
              )}
              <div className="flex">
                {!p.is_home && (
                  <>
                    <form action={movePage.bind(null, p.id, -1)}>
                      <button aria-label="Move up" title="Move up" disabled={i <= 0} className={iconButton}><Icon name="arrow-up" /></button>
                    </form>
                    <form action={movePage.bind(null, p.id, 1)}>
                      <button aria-label="Move down" title="Move down" disabled={i === sibs.length - 1} className={iconButton}><Icon name="arrow-down" /></button>
                    </form>
                  </>
                )}
                <Link href={`/dashboard?tab=p-${p.id}`} aria-label="Edit" title="Edit" className={iconButton}><LibraryIcon name="pencil" className="h-4 w-4" /></Link>
                {!p.is_home && (
                  <form
                    action={deletePage.bind(null, p.id)}
                    onSubmit={(e) => {
                      if (!confirm(`Delete "${p.title}" and all its blocks? This can't be undone.`)) e.preventDefault();
                    }}
                  >
                    <button aria-label="Delete" title="Delete" className={`${iconButton} hover:!bg-red-50 hover:!text-red-600`}><Icon name="trash" /></button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <form action={action} className="space-y-3 border-t border-gray-100 pt-5">
        <label className="block space-y-1">
          <span className={label}>Add a page</span>
          <div className="flex gap-2">
            <input name="title" required maxLength={60} placeholder="e.g. About Us, Services, Contact" className={input} />
            <button disabled={pending} className={`${button} shrink-0`}>{pending ? "Adding…" : "Add page"}</button>
          </div>
        </label>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <p className="text-xs text-gray-500">The new page gets its own tab above, where you add blocks to it just like on your home page.</p>
      </form>
    </div>
  );
}

// A page's name, address and menu setting. Home keeps its address and always shows in the menu.
export function PageSettingsForm({ page }: { page: SitePage }) {
  const [state, action, pending] = useActionState(savePage.bind(null, page.id), null as FormState);
  return (
    <>
      <form action={action} className="space-y-4">
        <label className="block space-y-1">
          <span className={label}>Page name</span>
          <input name="title" defaultValue={page.title} required maxLength={60} className={input} />
          <span className="block text-xs text-gray-500">Shown in your site&apos;s menu and in the tabs here.</span>
        </label>
        {!page.is_home && (
          <>
            <label className="block space-y-1">
              <span className={label}>Web address</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">/</span>
                <input name="slug" defaultValue={page.slug} required className={input} />
              </div>
              <span className="block text-xs text-gray-500">Changing this breaks any button you&apos;ve already pointed at the old address.</span>
            </label>
            <label className={tile}>
              <input type="checkbox" name="active" defaultChecked={page.active} className="h-4 w-4 accent-gray-900" />
              Active: visitors can see this page
            </label>
            <label className={tile}>
              <input type="checkbox" name="show_in_menu" defaultChecked={page.show_in_menu} className="h-4 w-4 accent-gray-900" />
              Show in my site&apos;s menu
            </label>
          </>
        )}
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        {state?.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{state.ok}</p>}
        <button disabled={pending} className={button}>{pending ? "Saving…" : "Save"}</button>
      </form>
      {!page.is_home && (
        <form
          action={deletePage.bind(null, page.id)}
          onSubmit={(e) => {
            if (!confirm("Delete this page and all its blocks? This can't be undone.")) e.preventDefault();
          }}
          className="mt-6 border-t border-gray-100 pt-5"
        >
          <button className={dangerLink}>Delete this page</button>
        </form>
      )}
    </>
  );
}

// Top-level page or sub page. Only top-level pages can be parents, and a page that has sub pages can't become one.
export function PagePlacementForm({ page, parents, hasSubPages }: { page: SitePage; parents: SitePage[]; hasSubPages: boolean }) {
  const [state, action, pending] = useActionState(savePagePlacement.bind(null, page.id), null as FormState);
  const [placement, setPlacement] = useState<"top" | "sub">(page.parent_id ? "sub" : "top");
  const canBeSub = !hasSubPages && parents.length > 0;
  return (
    <form action={action} className="space-y-3">
      <label className={tile}>
        <input type="radio" name="placement" value="top" checked={placement === "top"} onChange={() => setPlacement("top")} className="accent-gray-900" />
        Its own item in the main menu
      </label>
      <label className={`${tile} ${canBeSub ? "" : "pointer-events-none opacity-50"}`}>
        <input type="radio" name="placement" value="sub" checked={placement === "sub"} disabled={!canBeSub} onChange={() => setPlacement("sub")} className="accent-gray-900" />
        A sub page: in a dropdown under another page
      </label>
      {placement === "sub" && canBeSub && (
        <label className="block space-y-1 pl-1">
          <span className={label}>Under which page?</span>
          <select name="parent_id" defaultValue={page.parent_id ?? parents[0]?.id} className={input}>
            {parents.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </label>
      )}
      {!canBeSub && (
        <p className="text-xs text-gray-500">{hasSubPages ? "This page has sub pages of its own, so it can't be a sub page itself." : "Add another page first to put this one under it."}</p>
      )}
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{state.ok}</p>}
      <button disabled={pending} className={button}>{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}
