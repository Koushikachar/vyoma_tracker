import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { activateFromLink } from "@/lib/seller/billing";
// Razorpay -> us. Trusted only after the HMAC signature of the RAW body matches. Idempotent: a repeated delivery changes nothing.
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET; if (!secret) return NextResponse.json({ ok: false }, { status: 503 });
  const raw = await req.text(); const a = Buffer.from(req.headers.get("x-razorpay-signature") ?? ""), b = Buffer.from(createHmac("sha256", secret).update(raw).digest("hex"));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ ok: false }, { status: 401 });
  let ev: any; try { ev = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (ev.event !== "payment_link.paid") return NextResponse.json({ ok: true });
  try { await activateFromLink(ev.payload?.payment_link?.entity ?? {}); } catch (e) { console.error("[billing] webhook", (e as Error).message); return NextResponse.json({ ok: false }, { status: 500 }); } // 500 makes Razorpay retry
  return NextResponse.json({ ok: true });
}
