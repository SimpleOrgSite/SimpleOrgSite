"use client";

import { useEffect, useRef, useState } from "react";
import { sanitizeRichText } from "@/lib/richtext";
import { Icon } from "./icons";

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
