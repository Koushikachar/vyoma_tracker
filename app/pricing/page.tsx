import Link from "next/link";
import type { Metadata } from "next";
import PricingCards from "@/components/PricingCards";
import { getPlans } from "@/lib/seller/plans-db";
export const metadata: Metadata = { title: "Pricing", description: "Simple monthly and yearly plans for e-commerce sellers." };
export const dynamic = "force-dynamic";
export default async function Pricing() {
  const plans = await getPlans();
  return (<main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
    <h1 className="text-4xl font-bold sm:text-5xl">Pricing</h1><p className="mt-3 max-w-2xl text-muted">Start free. Pay monthly (30 days) or yearly (two months free) when you need more orders and more tools. There are no automatic charges.</p>
    <PricingCards plans={plans} />
    <p className="mt-6 text-sm text-muted">Need custom limits, SLAs or dedicated support? <Link href="/contact" className="font-medium text-brand">Contact us</Link> about Enterprise. Prices may change. WhatsApp message charges, where offered, are billed by the messaging provider and are not included.</p>
  </main>);
}
