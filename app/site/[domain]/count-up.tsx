"use client";

import { useEffect, useRef } from "react";

const DURATION_MS = 1600;

// Splits "$1,200+" into prefix "$", number "1,200" and suffix "+". Anything without a number (e.g. "24/7"-style text) is left alone.
const PARTS = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/;

// Server-rendered with the final text (so it's right without JavaScript), then on the client it
// drops to 0 and counts up the first time it scrolls into view. The DOM is written directly rather
// than through state so the animation doesn't re-render React on every frame.
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const m = PARTS.exec(value);
    if (!el || !m || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const [, prefix, digits, suffix] = m;
    const target = parseFloat(digits.replace(/,/g, ""));
    const decimals = digits.split(".")[1]?.length ?? 0;
    const commas = digits.includes(",");
    const format = (n: number) =>
      prefix + (commas ? n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : n.toFixed(decimals)) + suffix;

    el.textContent = format(0);
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        el.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
        el.style.opacity = "1";
        el.style.transform = "none";
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / DURATION_MS, 1);
          el.textContent = format(t === 1 ? target : target * t);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  // tabular-nums keeps digits a fixed width so the number doesn't jitter while it counts.
  return <span ref={ref} className="inline-block tabular-nums">{value}</span>;
}
