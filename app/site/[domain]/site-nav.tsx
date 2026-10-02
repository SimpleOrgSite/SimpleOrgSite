"use client";

import Link from "next/link";
import { useState } from "react";

export type NavItem = { href: string; label: string; children: { href: string; label: string }[] };

// Tabler icons: chevron-down, menu-2, x.
const ICONS = {
  chevron: ["M6 9l6 6l6 -6"],
  menu: ["M4 6l16 0", "M4 12l16 0", "M4 18l16 0"],
  close: ["M18 6l-12 12", "M6 6l12 12"],
};
function Icon({ name, className = "h-4 w-4" }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} stroke-current`} fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

const linkClass = "text-current opacity-75 transition-opacity hover:opacity-100";

// Wide screens: inline links with hover dropdowns. Narrow screens: a hamburger that opens a full-width panel
// below the header (the header itself must be `relative`), with sub-pages tucked into expandable rows.
export function SiteNav({ nav, dark, color }: { nav: NavItem[]; dark: boolean; color: string }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const close = () => setOpen(false);

  return (
    <>
      <nav className="hidden items-center gap-8 md:flex">
        {nav.map((item) => (
          <div key={item.href} className="group relative flex items-center">
            <Link href={item.href} className={`flex items-center gap-1 ${linkClass}`}>
              {item.label}
              {item.children.length > 0 && <Icon name="chevron" />}
            </Link>
            {item.children.length > 0 && (
              // The outer box is padded (not margined) so the pointer never crosses a gap that would close the menu.
              // -left offset = panel padding + item padding, so item text lines up with the trigger text.
              <div className="invisible absolute -left-[1.125rem] top-full z-10 translate-y-1 pt-3 opacity-0 transition duration-150 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <ul style={dark ? undefined : { color }} className="w-max min-w-28 rounded-2xl bg-white p-1.5 text-gray-700 shadow-xl ring-1 shadow-gray-900/10 ring-gray-900/5">
                  {item.children.map((c) => (
                    <li key={c.href}>
                      <Link href={c.href} className="block rounded-xl px-3 py-2 text-current opacity-80 transition hover:bg-gray-50 hover:opacity-100">{c.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </nav>

      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="-mr-2 rounded-xl p-2 transition-opacity hover:opacity-70 md:hidden"
      >
        <Icon name={open ? "close" : "menu"} className="h-6 w-6" />
      </button>

      {open && (
        <nav
          className={`absolute inset-x-0 top-full z-20 border-t px-6 py-3 shadow-lg md:hidden ${dark ? "border-white/15" : "border-gray-200 bg-white"}`}
          style={dark ? { backgroundColor: color } : undefined}
        >
          <ul className="mx-auto max-w-6xl">
            {nav.map((item) => (
              <li key={item.href}>
                <div className="flex items-center justify-between">
                  <Link href={item.href} onClick={close} className="flex-1 py-3 text-lg font-medium">{item.label}</Link>
                  {item.children.length > 0 && (
                    <button
                      type="button"
                      aria-label={`Show ${item.label} sections`}
                      aria-expanded={expanded === item.href}
                      onClick={() => setExpanded(expanded === item.href ? null : item.href)}
                      className="rounded-lg p-2 opacity-75 transition-opacity hover:opacity-100"
                    >
                      <Icon name="chevron" className={`h-5 w-5 transition-transform ${expanded === item.href ? "rotate-180" : ""}`} />
                    </button>
                  )}
                </div>
                {expanded === item.href && (
                  <ul className="mb-2 ml-3 space-y-0.5 border-l border-current/20 pl-4">
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} onClick={close} className="block py-2 opacity-80 hover:opacity-100">{c.label}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
