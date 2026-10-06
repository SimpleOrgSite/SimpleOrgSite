"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import type { SitePage } from "@/lib/site";
import { addPage, deletePage, movePage, savePage, togglePageMenu, type FormState } from "../actions";
import { button, dangerLink, input, label, tile } from "../ui";

const iconButton = "flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-30";

// The Site tab's list of pages: open one, switch it in or out of the menu, reorder, or add a new one.
export function PagesList({ pages }: { pages: SitePage[] }) {
  const [state, action, pending] = useActionState(addPage, null as FormState);
  const others = pages.filter((p) => !p.is_home);
  return (
    <div className="space-y-5">
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
        {pages.map((p) => {
          const i = others.indexOf(p);
          return (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/dashboard?tab=p-${p.id}`} className="min-w-0 flex-1">
                <span className="block truncate font-medium">{p.title}</span>
                <span className="block truncate text-sm text-gray-500">{p.is_home ? "/ (your home page)" : `/${p.slug}`}</span>
              </Link>
              {p.is_home ? (
                <span className="hidden text-xs text-gray-400 sm:inline">Always in the menu</span>
              ) : (
                <>
                  <span className="hidden text-xs text-gray-500 sm:inline">In menu</span>
                  <form action={togglePageMenu.bind(null, p.id, !p.show_in_menu)}>
                    <button
                      role="switch"
                      aria-checked={p.show_in_menu}
                      aria-label={p.show_in_menu ? "Hide from menu" : "Show in menu"}
                      title={p.show_in_menu ? "Shown in your site's menu" : "Not in the menu (still reachable by its address)"}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${p.show_in_menu ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${p.show_in_menu ? "translate-x-5" : ""}`} />
                    </button>
                  </form>
                  <div className="flex">
                    <form action={movePage.bind(null, p.id, -1)}>
                      <button aria-label="Move up" title="Move up" disabled={i === 0} className={iconButton}><Icon name="arrow-up" /></button>
                    </form>
                    <form action={movePage.bind(null, p.id, 1)}>
                      <button aria-label="Move down" title="Move down" disabled={i === others.length - 1} className={iconButton}><Icon name="arrow-down" /></button>
                    </form>
                  </div>
                </>
              )}
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
