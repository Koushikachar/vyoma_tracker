import { describe, it, expect, vi } from "vitest";
vi.mock("@/lib/db/prisma", () => ({ prisma: {} })); // the signature check never touches the database
import { createHmac } from "crypto";
import { periodDays, periodPrice, YEARLY_MONTHS_CHARGED } from "@/lib/seller/plans";
import { validReturn } from "@/lib/seller/billing";
import { DEMO, demoOrderRows } from "@/lib/seller/demo";
import { assessRisk } from "@/lib/seller/risk";
describe("yearly billing", () => {
  it("charges 10 months for a year and lasts 365 days", () => { expect(periodPrice(999, "YEARLY")).toBe(999 * YEARLY_MONTHS_CHARGED); expect(periodPrice(999, "MONTHLY")).toBe(999); expect(periodDays("YEARLY")).toBe(365); expect(periodDays("MONTHLY")).toBe(30); });
});
describe("Razorpay return signature", () => {
  const secret = "test_secret"; const sign = (l: string, r: string, s: string, p: string) => createHmac("sha256", secret).update(`${l}|${r}|${s}|${p}`).digest("hex");
  const q = (over: Record<string, string> = {}) => ({ razorpay_payment_link_id: "plink_ABC123", razorpay_payment_link_reference_id: "", razorpay_payment_link_status: "paid", razorpay_payment_id: "pay_XYZ", razorpay_signature: sign("plink_ABC123", "", "paid", "pay_XYZ"), ...over });
  it("accepts a correctly signed paid return", () => { process.env.RAZORPAY_KEY_SECRET = secret; expect(validReturn(q())).toBe("plink_ABC123"); });
  it("rejects a forged signature, another link, or an unpaid status", () => { process.env.RAZORPAY_KEY_SECRET = secret; expect(validReturn(q({ razorpay_signature: "0".repeat(64) }))).toBeNull(); expect(validReturn(q({ razorpay_payment_link_id: "plink_OTHER" }))).toBeNull(); expect(validReturn(q({ razorpay_payment_link_status: "cancelled" }))).toBeNull(); });
  it("rejects everything when the key secret is missing", () => { delete process.env.RAZORPAY_KEY_SECRET; expect(validReturn(q())).toBeNull(); });
});
describe("demo data", () => {
  it("builds 12 DEMO- orders with valid test-carrier tracking numbers and mixed statuses", () => {
    const rows = demoOrderRows("m1", assessRisk); expect(rows).toHaveLength(DEMO.length); expect(rows.every(r => r.orderNo.startsWith("DEMO-"))).toBe(true);
    expect(rows.filter(r => r.awb).every(r => /^VYT-[A-Z]+-\d+$/.test(r.awb!))).toBe(true); expect(new Set(rows.map(r => r.status)).size).toBeGreaterThanOrEqual(4); expect(rows.some(r => r.riskLevel === "HIGH")).toBe(true);
  });
});
