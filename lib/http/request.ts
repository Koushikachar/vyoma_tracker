import { createHash, timingSafeEqual } from "crypto";
// One place for the request facts every route needs, so rate limits and CSRF checks behave the same everywhere.
// Prefer the platform-set header (Vercel overwrites it, a client cannot forge it) before the generic forwarded chain.
export function clientIp(req: { headers: Headers }): string {
  const h = req.headers;
  return (h.get("x-vercel-forwarded-for") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim() || "unknown";
}
// CSRF defence in depth on top of SameSite cookies: a browser always sends Origin on cross-site POSTs; if it is present it must be us.
export function sameOrigin(req: Request & { nextUrl: URL }): boolean {
  const o = req.headers.get("origin"); return !o || o === req.nextUrl.origin;
}
// Compare secrets without leaking length or content through timing.
export function safeEqual(a: string, b: string): boolean {
  const x = createHash("sha256").update(a).digest(), y = createHash("sha256").update(b).digest(); return timingSafeEqual(x, y);
}
// Cron endpoints: Authorization: Bearer <CRON_SECRET>, constant-time.
export function cronAuthorized(req: Request): boolean {
  const s = process.env.CRON_SECRET; return !!s && safeEqual(req.headers.get("authorization") ?? "", `Bearer ${s}`);
}
