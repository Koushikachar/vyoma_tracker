import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { audit } from "@/lib/seller/audit";
import { PLANS, periodDays, periodPrice, type Interval, type Plan } from "@/lib/seller/plans";
import { getPlans } from "@/lib/seller/plans-db";
// One place that turns a PAID Razorpay payment link into a plan. The webhook, the return page and the "check payment" button all call it,
// so a plan is granted the same way whichever of them arrives first, and never twice (Payment.linkId is unique and the two writes are one transaction).
export type RzpLink = { id?: string; status?: string; amount?: number; amount_paid?: number; notes?: Record<string, unknown> | unknown[] };
const notesOf = (l: RzpLink) => (l.notes && !Array.isArray(l.notes) ? l.notes : {}) as Record<string, unknown>;
export async function activateFromLink(link: RzpLink): Promise<"activated" | "ignored" | "duplicate" | "underpaid"> {
  const n = notesOf(link); const merchantId = n.merchantId as string | undefined; const plan = n.plan as Plan | undefined; const interval: Interval = n.interval === "YEARLY" ? "YEARLY" : "MONTHLY";
  const paid = Number(link.amount_paid ?? link.amount);
  if (!link.id || !merchantId || !plan || plan === "FREE" || !(plan in PLANS) || !(paid > 0)) return "ignored";
  const expected = Number(n.price) > 0 ? Number(n.price) : periodPrice((await getPlans())[plan].price, interval) * 100; // the price the seller was shown when the link was made
  if (!(paid >= expected)) { console.error("[billing] underpaid link", link.id); return "underpaid"; } // never grant a plan for less than its price
  const m = await prisma.merchant.findUnique({ where: { id: merchantId } }); if (!m) return "ignored";
  if (await prisma.payment.findUnique({ where: { linkId: link.id }, select: { id: true } })) return "duplicate";
  const base = m.plan === plan && m.planUntil && m.planUntil > new Date() ? m.planUntil : new Date(); // renewing the same plan adds to the remaining time
  try {
    await prisma.$transaction([
      prisma.payment.create({ data: { merchantId, linkId: link.id, plan, amountPaise: paid } }),
      prisma.merchant.update({ where: { id: merchantId }, data: { plan, planUntil: new Date(+base + periodDays(interval) * 864e5) } }),
    ]);
  } catch { return "duplicate"; } // a parallel delivery won the race
  await audit(merchantId, "plan.activated", "payment", link.id, `${plan} ${interval.toLowerCase()}`);
  return "activated";
}
// Asks Razorpay itself (never trusts the browser) for the current state of a payment link.
export async function fetchLink(linkId: string): Promise<RzpLink | null> {
  const id = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET; if (!id || !secret || !/^plink_[A-Za-z0-9]+$/.test(linkId)) return null;
  const r = await fetch(`https://api.razorpay.com/v1/payment_links/${linkId}`, { signal: AbortSignal.timeout(15_000), headers: { authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}` }, cache: "no-store" }).catch(() => null);
  if (!r?.ok) return null; return (await r.json().catch(() => null)) as RzpLink | null;
}
// Links this seller started recently (recorded when each one was created), checked against Razorpay. Fixes "I paid but I am still on Free" when the webhook is late or not set up.
export async function syncPayments(merchantId: string, only?: string[]): Promise<number> {
  const rows = only?.length ? only.map(id => ({ entityId: id })) : await prisma.sellerAudit.findMany({ where: { merchantId, action: "billing.link", createdAt: { gt: new Date(Date.now() - 7 * 864e5) } }, orderBy: { createdAt: "desc" }, take: 10, select: { entityId: true } });
  let n = 0;
  for (const r of rows) { if (!r.entityId) continue; const l = await fetchLink(r.entityId); if (!l || l.status !== "paid") continue; if (notesOf(l).merchantId !== merchantId) continue; if ((await activateFromLink(l)) === "activated") n++; }
  return n;
}
// Razorpay sends the buyer back to our callback URL with a signature over  link_id|reference_id|status|payment_id  made with the key secret.
export function validReturn(q: Record<string, string | string[] | undefined>): string | null {
  const secret = process.env.RAZORPAY_KEY_SECRET; const g = (k: string) => (typeof q[k] === "string" ? (q[k] as string) : "");
  const sig = g("razorpay_signature"), link = g("razorpay_payment_link_id"); if (!secret || !sig || !link || g("razorpay_payment_link_status") !== "paid") return null;
  const want = createHmac("sha256", secret).update(`${link}|${g("razorpay_payment_link_reference_id")}|${g("razorpay_payment_link_status")}|${g("razorpay_payment_id")}`).digest("hex");
  const a = Buffer.from(sig), b = Buffer.from(want); return a.length === b.length && timingSafeEqual(a, b) ? link : null;
}
