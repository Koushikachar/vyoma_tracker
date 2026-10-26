import { sameOrigin } from "@/lib/http/request";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMerchant } from "@/lib/seller/auth";
import { canDo } from "@/lib/seller/roles";
import { getPlans } from "@/lib/seller/plans-db";
import { periodLabel, periodPrice } from "@/lib/seller/plans";
import { audit } from "@/lib/seller/audit";
import { syncPayments } from "@/lib/seller/billing";
import { rateLimit } from "@/lib/tracking/rate-limit";
const fail = (message: string, status = 400) => NextResponse.json({ success: false, error: { message } }, { status });
const body = z.union([z.object({ action: z.literal("sync") }), z.object({ plan: z.enum(["GROWTH", "SCALE"]), interval: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY") })]);
// Creates a Razorpay hosted payment link for one billing period (30 days or a year). The plan is activated only after Razorpay confirms the payment
// (verified webhook, signed return page, or the "check payment" button that asks Razorpay directly), never by this request.
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return new NextResponse(null, { status: 403 }); // CSRF defence in depth (cookies are also SameSite=Lax)
  const m = await getMerchant(); if (!m) return fail("Please sign in.", 401); if (!m.verified) return fail("Please verify your email first.", 403);
  const p = body.safeParse(await req.json().catch(() => null)); if (!p.success) return fail("Choose a plan.");
  if ("action" in p.data) { // "I have paid" button
    if (!(await rateLimit(`billing-sync:${m.id}`, 20, 10 * 60_000))) return fail("Too many checks. Please wait a few minutes.", 429);
    return NextResponse.json({ success: true, activated: await syncPayments(m.id) });
  }
  if (!canDo(m.role, "billing")) return fail("Only the workspace owner can manage billing.", 403);
  const id = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET; if (!id || !secret) return fail("Online payments are not set up yet. Please contact support.", 503);
  if (!(await rateLimit(`billing:${m.id}`, 10, 60 * 60_000))) return fail("Too many attempts. Please try again later.", 429);
  const { plan: key, interval } = p.data; const plan = (await getPlans())[key]; const site = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin; const amount = periodPrice(plan.price, interval) * 100;
  const r = await fetch("https://api.razorpay.com/v1/payment_links", { method: "POST", signal: AbortSignal.timeout(15_000), headers: { authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "content-type": "application/json" },
    body: JSON.stringify({ amount, currency: "INR", accept_partial: false, description: `Vyoma Route ${plan.label} plan (${periodLabel(interval)})`, customer: { name: m.name, email: m.email }, notify: { email: true }, reminder_enable: false, notes: { merchantId: m.id, plan: key, interval, price: String(amount) }, callback_url: `${site}/seller?paid=1`, callback_method: "get" }) }).catch(() => null);
  const j = await r?.json().catch(() => ({})) as { id?: string; short_url?: string; error?: { description?: string } } | undefined;
  if (!r?.ok || !j?.short_url) { console.error("[billing] Razorpay error", r?.status, j?.error?.description); return fail("Could not start the payment. Please try again.", 502); }
  if (j.id) await audit(m.id, "billing.link", "paymentLink", j.id, `${key} ${interval.toLowerCase()}`); // lets us ask Razorpay about this link later
  return NextResponse.json({ success: true, url: j.short_url });
}
