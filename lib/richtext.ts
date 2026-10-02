// Whitelist sanitizer for the About editor's HTML. Pure string code (no DOM), so it runs on the
// server when saving, in the browser when loading the editor, and again when rendering public pages.
// Anything not explicitly allowed is dropped; text is kept but always HTML-safe.

const SIZES = { s: "0.8em", l: "1.35em", xl: "1.8em" } as const;
export const SIZE_EM = SIZES;

// execCommand's fontSize (1-7) and its CSS keywords, collapsed onto our S / M / L / XL.
const KEYWORD_TO_EM: Record<string, string | null> = {
  "x-small": SIZES.s, small: SIZES.s,
  medium: null,
  large: SIZES.l, "x-large": SIZES.l,
  "xx-large": SIZES.xl, "xxx-large": SIZES.xl, "-webkit-xxx-large": SIZES.xl,
  [SIZES.s]: SIZES.s, [SIZES.l]: SIZES.l, [SIZES.xl]: SIZES.xl,
};
const FONT_ATTR_TO_EM: Record<string, string | null> = { "1": SIZES.s, "2": SIZES.s, "3": null, "4": SIZES.l, "5": SIZES.l, "6": SIZES.xl, "7": SIZES.xl };

const COLOR = /^(#[0-9a-f]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/i;

const SIMPLE: Record<string, string> = { b: "strong", strong: "strong", i: "em", em: "em", u: "u", ul: "ul", ol: "ol", li: "li", p: "p", div: "p" };
const DROP_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "noscript", "template"]);

function attr(source: string, name: string) {
  const m = source.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return m ? (m[1] ?? m[2]) : null;
}

function spanStyle(color: string | null, size: string | null | undefined) {
  const parts = [];
  if (color && COLOR.test(color.trim())) parts.push(`color:${color.trim().toLowerCase()}`);
  if (size) parts.push(`font-size:${size}`);
  return parts.length ? `<span style="${parts.join(";")}">` : null;
}

export function sanitizeRichText(html: string): string {
  const out: string[] = [];
  // Open input tags with the closing tag we emitted for them ("" when the open tag was dropped).
  const stack: { name: string; close: string }[] = [];
  let skipping: string | null = null;

  for (const token of html.split(/(<[^>]*>)/)) {
    const tag = token.match(/^<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>$/);
    if (!tag) {
      if (!skipping) out.push(token.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
      continue;
    }
    const closing = tag[1] === "/";
    const name = tag[2].toLowerCase();
    const rest = tag[3];

    if (skipping) {
      if (closing && name === skipping) skipping = null;
      continue;
    }
    if (DROP_WITH_CONTENT.has(name)) {
      if (!closing && !/\/\s*$/.test(rest)) skipping = name;
      continue;
    }
    if (name === "br") {
      if (!closing) out.push("<br>");
      continue;
    }

    if (closing) {
      const at = stack.map((s) => s.name).lastIndexOf(name);
      if (at === -1) continue;
      for (const s of stack.splice(at).reverse()) out.push(s.close);
      continue;
    }

    // Browsers' editors can nest lists inside <p>, which is invalid; end the paragraph first.
    if (name === "ul" || name === "ol" || name === "p" || name === "div") {
      const p = stack.map((s) => s.name).lastIndexOf("p");
      if (p !== -1) for (const s of stack.splice(p).reverse()) out.push(s.close);
    }

    // Any allowed tag may carry color / font-size (execCommand puts them on <u>, <li>, etc.), so read them for all.
    let color: string | null = null;
    let size: string | null | undefined;
    if (name === "font") {
      color = attr(rest, "color");
      const fs = attr(rest, "size");
      size = fs ? FONT_ATTR_TO_EM[fs.trim()] : undefined;
    }
    for (const decl of (attr(rest, "style") ?? "").split(";")) {
      const [prop, ...v] = decl.split(":");
      const value = v.join(":").trim().toLowerCase();
      if (prop.trim().toLowerCase() === "color") color = value;
      if (prop.trim().toLowerCase() === "font-size") size = KEYWORD_TO_EM[value];
    }
    const span = spanStyle(color, size);

    let open: string | null = null;
    let close = "";
    if (SIMPLE[name]) {
      open = `<${SIMPLE[name]}>${span ?? ""}`;
      close = `${span ? "</span>" : ""}</${SIMPLE[name]}>`;
    } else if (name === "span" || name === "font") {
      open = span;
      close = span ? "</span>" : "";
    }
    if (open) out.push(open);
    // Self-closing syntax or void-ish input must not be left on the stack.
    if (!/\/\s*$/.test(rest)) stack.push({ name, close });
    else if (close) out.push(close);
  }
  for (const s of stack.reverse()) out.push(s.close);
  // Closing a <p> early (to fit a list) can leave an empty one behind.
  return out.join("").replace(/<p><\/p>/g, "");
}

// True when there's visible text (so an empty editor, "<p><br></p>", counts as empty).
export function hasText(html: string) {
  return sanitizeRichText(html).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
}
