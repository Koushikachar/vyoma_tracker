"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
// Lenis smooth scrolling on desktop public pages only. Created once and kept alive across navigations (it used to be
// torn down and rebuilt on every click). Skipped for reduced-motion users, touch/small screens and the admin area.
type L = { raf(t: number): void; destroy(): void; scrollTo(y: number, o?: { immediate?: boolean }): void };
export default function SmoothScroll() {
  const path = usePathname(); const admin = path.startsWith("/control"); const lenis = useRef<L | null>(null);
  useEffect(() => {
    if (admin || matchMedia("(prefers-reduced-motion: reduce)").matches || matchMedia("(pointer: coarse)").matches || matchMedia("(max-width: 1023px)").matches) return;
    let raf = 0, dead = false;
    import("lenis").then(({ default: Lenis }) => { if (dead) return; const l = new Lenis(); lenis.current = l; const loop = (t: number) => { l.raf(t); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); });
    return () => { dead = true; cancelAnimationFrame(raf); lenis.current?.destroy(); lenis.current = null; };
  }, [admin]);
  useEffect(() => { lenis.current?.scrollTo(0, { immediate: true }); }, [path]); // new page starts at the top
  return null;
}
