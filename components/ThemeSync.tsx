"use client";
import { useEffect } from "react";
// Safety net: re-applies the saved theme after hydration (React can reset <html class> if hydration falls back to a client render),
// and writes the cookie once so later page loads are rendered with the right theme on the server. Cookie only, no localStorage.
export default function ThemeSync() {
  useEffect(() => {
    try { localStorage.removeItem("theme"); } catch {} // one-time cleanup of the key older versions wrote; nothing is ever stored there now
    const m = document.cookie.match(/(?:^|; )theme=(dark|light)/);
    const want = m?.[1] ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", want === "dark");
    if (!m) document.cookie = `theme=${want}; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
  }, []);
  return null;
}
