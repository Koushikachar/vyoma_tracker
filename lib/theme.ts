// Client-side theme helper. The choice lives in a first-party cookie only (no localStorage), so the server renders the
// right class on the very first paint, even after a refresh.
export function setTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.cookie = `theme=${dark ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
}
