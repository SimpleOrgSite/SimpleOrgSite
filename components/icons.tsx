// Tabler outline icons (paths copied from github.com/tabler/tabler-icons).
const PATHS = {
  bold: ["M7 5h6a3.5 3.5 0 0 1 0 7h-6l0 -7", "M13 12h1a3.5 3.5 0 0 1 0 7h-7v-7"],
  italic: ["M11 5l6 0", "M7 19l6 0", "M14 5l-4 14"],
  underline: ["M7 5v5a5 5 0 0 0 10 0v-5", "M5 19h14"],
  list: ["M9 6l11 0", "M9 12l11 0", "M9 18l11 0", "M5 6l0 .01", "M5 12l0 .01", "M5 18l0 .01"],
  "list-numbers": ["M11 6h9", "M11 12h9", "M12 18h8", "M4 16a2 2 0 1 1 4 0c0 .591 -.5 1 -1 1.5l-3 2.5h4", "M6 10v-6l-2 2"],
  trash: ["M4 7l16 0", "M10 11l0 6", "M14 11l0 6", "M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12", "M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"],
  "arrow-up": ["M12 5l0 14", "M18 11l-6 -6", "M6 11l6 -6"],
  "arrow-down": ["M12 5l0 14", "M18 13l-6 6", "M6 13l6 6"],
  link: ["M9 15l6 -6", "M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464", "M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"],
  eye: ["M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0", "M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"],
  "eye-off": ["M10.585 10.587a2 2 0 0 0 2.829 2.828", "M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87", "M3 3l18 18"],
  search: ["M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0", "M21 21l-6 -6"],
  x: ["M18 6l-12 12", "M6 6l12 12"],
  "arrow-right": ["M5 12l14 0", "M13 18l6 -6", "M13 6l6 6"],
  "chevron-down": ["M6 9l6 6l6 -6"],
  plus: ["M12 5l0 14", "M5 12l14 0"],
} as const;

export function Icon({ name, className = "h-4 w-4" }: { name: keyof typeof PATHS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} stroke-current`} fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
