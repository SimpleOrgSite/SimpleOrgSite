"use client";

import { useEffect, useRef, useState } from "react";
import { sanitizeRichText } from "@/lib/richtext";
import { Icon } from "@/components/icons";

const COLORS = [
  { name: "Default", value: "#374151" },
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#16a34a" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Purple", value: "#7c3aed" },
];
// execCommand fontSize levels: small / normal / x-large / xx-large.
const SIZES = [
  { label: "S", level: "2", name: "Small" },
  { label: "M", level: "3", name: "Medium" },
  { label: "L", level: "5", name: "Large" },
  { label: "XL", level: "6", name: "Extra large" },
];

const toolButton = "flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-xs font-semibold transition-colors";

// A small contenteditable editor. document.execCommand is formally deprecated but is still supported by
// every browser and keeps this dependency-free; everything it produces goes through sanitizeRichText.
export function RichEditor({ initial, onChange }: { initial: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  // Fixed for the editor's lifetime so React never rewrites the DOM under the cursor.
  const [start] = useState(() => sanitizeRichText(initial));
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [size, setSize] = useState("3");
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [hasExisting, setHasExisting] = useState(false);
  // Opening the URL box moves focus out of the editor, so remember what was selected.
  const saved = useRef<Range | null>(null);

  useEffect(() => {
    const update = () => {
      const sel = document.getSelection();
      if (!sel?.anchorNode || !ref.current?.contains(sel.anchorNode)) return;
      setActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
        link: !!anchorAt(sel.anchorNode),
      });
      const level = document.queryCommandValue("fontSize");
      setSize(level >= "6" ? "6" : level >= "4" ? "5" : level && level < "3" ? "2" : "3");
    };
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, []);

  function run(command: string, value?: string) {
    ref.current?.focus();
    // CSS spans only for color/size; bold/italic/underline stay real <b>/<i>/<u> tags, which the sanitizer maps to strong/em/u.
    document.execCommand("styleWithCSS", false, command === "foreColor" || command === "fontSize" ? "true" : "false");
    document.execCommand(command, false, value);
    onChange(ref.current?.innerHTML ?? "");
  }

  function anchorAt(node: Node | null): HTMLAnchorElement | null {
    const el = node instanceof Element ? node : node?.parentElement;
    const a = el?.closest("a") ?? null;
    return a && ref.current?.contains(a) ? a : null;
  }

  function openLink() {
    const sel = getSelection();
    if (!sel?.rangeCount || !ref.current?.contains(sel.anchorNode)) return;
    saved.current = sel.getRangeAt(0).cloneRange();
    const existing = anchorAt(sel.anchorNode);
    setHasExisting(!!existing);
    setUrl(existing?.getAttribute("href") ?? "");
    setLinkOpen(true);
  }

  function restoreSelection() {
    ref.current?.focus();
    const sel = getSelection();
    if (saved.current && sel) {
      sel.removeAllRanges();
      sel.addRange(saved.current);
    }
  }

  function applyLink() {
    let href = url.trim();
    if (!href) return;
    // People type "example.com"; make it a real link. Emails and phones get their own scheme.
    if (!/^[a-z][a-z0-9+.-]*:/i.test(href)) href = /^\S+@\S+\.\S+$/.test(href) ? `mailto:${href}` : `https://${href}`;
    if (!/^(https?:|mailto:|tel:)/i.test(href)) return;
    restoreSelection();
    // Editing an existing link: target the whole link even if only the cursor is inside it.
    const existing = anchorAt(getSelection()?.anchorNode ?? null);
    if (existing) getSelection()?.getRangeAt(0).selectNodeContents(existing);
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand("createLink", false, href);
    onChange(ref.current?.innerHTML ?? "");
    setLinkOpen(false);
  }

  function removeLink() {
    restoreSelection();
    const existing = anchorAt(getSelection()?.anchorNode ?? null);
    if (existing) getSelection()?.getRangeAt(0).selectNodeContents(existing);
    document.execCommand("unlink");
    onChange(ref.current?.innerHTML ?? "");
    setLinkOpen(false);
  }

  const canLink = hasExisting || (saved.current !== null && !saved.current.collapsed);

  // preventDefault on mousedown keeps the text selection while a toolbar button is clicked.
  const keepSelection = (e: React.MouseEvent) => e.preventDefault();
  const toggle = (on?: boolean) => `${toolButton} ${on ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-200"}`;
  const divider = <span className="mx-1 h-5 w-px bg-gray-200" />;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition focus-within:border-gray-400 focus-within:ring-4 focus-within:ring-gray-900/5">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <button type="button" aria-label="Bold" title="Bold" onMouseDown={keepSelection} onClick={() => run("bold")} className={toggle(active.bold)}><Icon name="bold" /></button>
        <button type="button" aria-label="Italic" title="Italic" onMouseDown={keepSelection} onClick={() => run("italic")} className={toggle(active.italic)}><Icon name="italic" /></button>
        <button type="button" aria-label="Underline" title="Underline" onMouseDown={keepSelection} onClick={() => run("underline")} className={toggle(active.underline)}><Icon name="underline" /></button>
        {divider}
        <button type="button" aria-label="Bulleted list" title="Bulleted list" onMouseDown={keepSelection} onClick={() => run("insertUnorderedList")} className={toggle(active.ul)}><Icon name="list" /></button>
        <button type="button" aria-label="Numbered list" title="Numbered list" onMouseDown={keepSelection} onClick={() => run("insertOrderedList")} className={toggle(active.ol)}><Icon name="list-numbers" /></button>
        <button type="button" aria-label="Link" title="Add link" onMouseDown={keepSelection} onClick={openLink} className={toggle(active.link || linkOpen)}><Icon name="link" /></button>
        {divider}
        {SIZES.map((s) => (
          <button key={s.label} type="button" aria-label={`Text size ${s.name}`} title={`Text size: ${s.name}`} onMouseDown={keepSelection} onClick={() => run("fontSize", s.level)} className={toggle(size === s.level)}>
            {s.label}
          </button>
        ))}
        {divider}
        <div className="flex items-center gap-1.5 px-1">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-label={`Text color ${c.name}`}
              title={c.name}
              onMouseDown={keepSelection}
              onClick={() => run("foreColor", c.value)}
              className="h-5 w-5 rounded-full ring-2 ring-white transition hover:scale-110 hover:ring-gray-300"
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>
      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // otherwise Enter would submit the whole About form
                applyLink();
              }
              if (e.key === "Escape") setLinkOpen(false);
            }}
            placeholder="Paste or type the web address"
            aria-label="Link address"
            className="min-w-48 flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-gray-400"
          />
          <button type="button" onClick={applyLink} disabled={!url.trim() || !canLink} className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-40">
            {hasExisting ? "Update" : "Add link"}
          </button>
          {hasExisting && (
            <button type="button" onClick={removeLink} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-red-600">Remove link</button>
          )}
          <button type="button" onClick={() => setLinkOpen(false)} className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100">Cancel</button>
          {!canLink && <p className="w-full text-xs text-gray-500">Select the text you want to turn into a link first.</p>}
        </div>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => document.execCommand("defaultParagraphSeparator", false, "p")}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="rich min-h-36 px-4 py-3 text-gray-700 outline-none"
        dangerouslySetInnerHTML={{ __html: start }}
      />
    </div>
  );
}
