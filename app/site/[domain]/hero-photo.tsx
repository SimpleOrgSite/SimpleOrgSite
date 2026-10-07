"use client";

import { useEffect, useRef } from "react";

// Server-rendered fully visible (right without JavaScript or with reduced motion); the effect then
// sets the starting pose and plays the animation. DOM is written directly so scroll-driven parallax
// doesn't re-render React on every frame.
export function HeroPhoto({ src, animation, fromLeft }: { src: string; animation: string; fromLeft: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const box = frame.current;
    const el = img.current;
    if (!box || !el || animation === "none" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (animation === "float") {
      // The frame moves (not the clipped photo inside it) so no gap opens at the edge.
      const a = box.animate([{ transform: "translateY(0)" }, { transform: "translateY(-12px)" }, { transform: "translateY(0)" }], { duration: 6000, iterations: Infinity, easing: "ease-in-out" });
      return () => a.cancel();
    }

    if (animation === "parallax") {
      // The photo is oversized inside a clipped frame, then slides within it as the page scrolls.
      let raf = 0;
      const update = () => {
        raf = 0;
        const r = box.getBoundingClientRect();
        const progress = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight; // -1..1 around centre
        el.style.transform = `translateY(${Math.max(-1, Math.min(1, progress)) * -7}%) scale(1.18)`;
      };
      const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        cancelAnimationFrame(raf);
      };
    }

    const from: Keyframe =
      animation === "slide" ? { opacity: 0, transform: `translateX(${fromLeft ? "-" : ""}80px)` }
      : animation === "zoom" ? { opacity: 0, transform: "scale(0.85)" }
      : { opacity: 0, transform: "translateY(40px)" };
    el.style.opacity = "0";
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      el.style.opacity = "";
      el.animate([from, { opacity: 1, transform: "none" }], { duration: 900, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" });
    }, { threshold: 0.2 });
    observer.observe(box);
    return () => observer.disconnect();
  }, [animation, fromLeft]);

  return (
    <div ref={frame} className={`aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-lg`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded, arbitrary dimensions */}
      <img ref={img} src={src} alt="" className="h-full w-full object-cover" />
    </div>
  );
}
