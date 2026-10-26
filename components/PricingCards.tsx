"use client";
import Link from "next/link";
import { useState } from "react";
import { planFeatures, periodPrice, YEARLY_MONTHS_CHARGED, type Interval, type Plan } from "@/lib/seller/plans";
type Info = { label: string; price: number; orders: number; seats: number };
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export default function PricingCards({ plans }: { plans: Record<Plan, Info> }) {
  const [iv, setIv] = useState<Interval>("MONTHLY"); const seg = (on: boolean) => `h-10 rounded-full px-4 text-sm font-medium transition ${on ? "bg-brand text-white shadow dark:text-[rgb(6_8_18)]" : "text-muted hover:text-fg"}`;
  return (<>
    <div className="mt-8 flex flex-wrap items-center gap-3"><div role="group" aria-label="Billing period" className="inline-flex gap-1 rounded-full border border-line bg-card p-1"><button aria-pressed={iv === "MONTHLY"} onClick={() => setIv("MONTHLY")} className={seg(iv === "MONTHLY")}>Monthly</button><button aria-pressed={iv === "YEARLY"} onClick={() => setIv("YEARLY")} className={seg(iv === "YEARLY")}>Yearly</button></div>
      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">Yearly: pay {YEARLY_MONTHS_CHARGED} months, get 12</span></div>
    <div className="mt-6 grid gap-5 md:grid-cols-3">{(Object.keys(plans) as Plan[]).map(k => { const price = periodPrice(plans[k].price, iv); return (<div key={k} className={`flex flex-col rounded-3xl border p-6 ${k === "GROWTH" ? "border-brand bg-brand/5" : "border-line bg-card/70"}`}>
      <h2 className="text-lg font-semibold">{plans[k].label}</h2><div className="mt-2 text-4xl font-bold">{inr(price)}<span className="text-sm font-normal text-muted"> / {iv === "YEARLY" ? "year" : "30 days"}</span></div>
      <div className="h-5 text-xs text-muted">{k !== "FREE" && iv === "YEARLY" ? `${inr(Math.round(price / 12))} a month · save ${inr(plans[k].price * 12 - price)}` : ""}</div>
      <ul className="mt-4 flex-1 space-y-2 text-sm">{planFeatures(k, plans[k]).map(f => <li key={f} className="flex gap-2"><span className="text-emerald-500" aria-hidden>✓</span>{f}</li>)}</ul>
      <Link href="/seller/login" className="btn-primary mt-6 h-11 rounded-xl">{k === "FREE" ? "Start free" : `Choose ${plans[k].label}`}</Link></div>); })}</div>
  </>);
}
