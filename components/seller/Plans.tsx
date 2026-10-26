"use client";
import { fmtDate } from "@/lib/format";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { planFeatures, periodPrice, YEARLY_MONTHS_CHARGED, type Interval, type Plan } from "@/lib/seller/plans";
type Info = { label: string; price: number; orders: number; seats: number };
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export default function Plans({ plan, until, justPaid, plans }: { plan: Plan; until: string | null; justPaid: boolean; plans: Record<Plan, Info> }) {
  const r = useRouter(); const [busy, setBusy] = useState<string | null>(null); const [err, setErr] = useState(""); const [note, setNote] = useState(""); const [iv, setIv] = useState<Interval>("MONTHLY"); const asked = useRef(false);
  const buy = async (p: string) => { setBusy(p); setErr("");
    try { const res = await fetch("/api/seller/billing", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan: p, interval: iv }) }); const j = await res.json(); if (j.success) window.location.assign(j.url); else setErr(j.error?.message ?? "Something went wrong."); }
    catch { setErr("Network error. Please try again."); } finally { setBusy(null); } };
  // Asks Razorpay directly whether a payment went through (covers a late or missing webhook).
  const check = async (quiet = false) => { setBusy("sync"); setErr(""); if (!quiet) setNote("");
    try { const res = await fetch("/api/seller/billing", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "sync" }) }); const j = await res.json();
      if (!j.success) setErr(j.error?.message ?? "Could not check the payment."); else if (j.activated) { setNote("Payment confirmed. Your plan is active."); r.refresh(); } else if (!quiet) setNote("No new payment found yet. If you just paid, wait a few seconds and try again."); }
    catch { setErr("Network error. Please try again."); } finally { setBusy(null); } };
  useEffect(() => { if (justPaid && plan === "FREE" && !asked.current) { asked.current = true; void check(true); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const seg = (on: boolean) => `h-10 rounded-full px-4 text-sm font-medium transition ${on ? "bg-brand text-white shadow dark:text-[rgb(6_8_18)]" : "text-muted hover:text-fg"}`;
  return (<section className="space-y-5" aria-label="Plan and billing">
    {justPaid && <p role="status" className="rounded-xl border border-emerald-500/40 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">{plan === "FREE" ? "Thank you! We are confirming your payment with Razorpay. This usually takes a few seconds." : "Thank you! Your payment is confirmed and your plan is active."}</p>}
    <p className="text-sm text-muted">You are on the <b className="text-fg">{plans[plan].label}</b> plan{plan !== "FREE" && until ? <> until <b className="text-fg">{fmtDate(until)}</b></> : ""}. Pay monthly (30 days) or yearly. There are no automatic charges, so renew whenever you like.</p>
    <div className="flex flex-wrap items-center gap-3"><div role="group" aria-label="Billing period" className="inline-flex gap-1 rounded-full border border-line bg-card p-1"><button aria-pressed={iv === "MONTHLY"} onClick={() => setIv("MONTHLY")} className={seg(iv === "MONTHLY")}>Monthly</button><button aria-pressed={iv === "YEARLY"} onClick={() => setIv("YEARLY")} className={seg(iv === "YEARLY")}>Yearly</button></div>
      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">Yearly: pay {YEARLY_MONTHS_CHARGED} months, get 12</span></div>
    <div className="grid gap-4 md:grid-cols-3">{(Object.keys(plans) as Plan[]).map(k => { const cur = k === plan; const price = periodPrice(plans[k].price, iv); return (
      <div key={k} className={`flex flex-col rounded-3xl border p-5 backdrop-blur sm:p-6 ${cur ? "border-brand bg-brand/5" : "border-line bg-card/70"}`}>
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{plans[k].label}</h2>{cur && <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs text-brand">Current</span>}</div>
        <div className="mt-2 text-3xl font-bold">{inr(price)}<span className="text-sm font-normal text-muted"> / {iv === "YEARLY" ? "year" : "30 days"}</span></div>
        <div className="h-5 text-xs text-muted">{k !== "FREE" && iv === "YEARLY" ? `${inr(Math.round(price / 12))} a month · you save ${inr(plans[k].price * 12 - price)}` : ""}</div>
        <ul className="mt-3 flex-1 space-y-2 text-sm">{planFeatures(k, plans[k]).map(f => <li key={f} className="flex gap-2"><span className="text-emerald-500" aria-hidden>✓</span>{f}</li>)}</ul>
        {k !== "FREE" && <button disabled={!!busy} onClick={() => buy(k)} className="btn-primary mt-5 h-11 rounded-xl">{busy === k ? "Opening payment…" : cur ? (iv === "YEARLY" ? "Renew for 1 year" : "Renew for 30 days") : `Choose ${plans[k].label} ${iv === "YEARLY" ? "yearly" : "monthly"}`}</button>}
      </div>); })}</div>
    <div className="flex flex-wrap items-center gap-3"><button disabled={!!busy} onClick={() => check()} className="inline-flex h-10 items-center rounded-xl border border-line bg-card px-4 text-sm font-medium hover:border-brand disabled:opacity-60">{busy === "sync" ? "Checking…" : "I have paid, check my payment"}</button>{note && <span role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{note}</span>}</div>
    {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
    <p className="text-xs text-muted">Only the workspace owner can pay. Payments are processed by Razorpay. If a plan expires, your data stays safe and the account returns to Free limits.</p>
  </section>);
}
