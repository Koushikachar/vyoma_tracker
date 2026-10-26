import { randomBytes } from "crypto";
// Sample orders so a new seller can try every screen without real shipments. Tracking numbers use the built-in test carrier (VYT-<SCENARIO>-<n>),
// so the Refresh button works on them too. Every demo order number starts with DEMO- so "Remove demo data" can never touch real orders.
export const DEMO_PREFIX = "DEMO-";
type Demo = { n: number; name: string; phone: string; pin: string; pay: "COD" | "PREPAID"; amt: number; scenario?: string; status: "NEW" | "IN_TRANSIT" | "NDR" | "DELIVERED" | "RTO"; days: number; ndr?: { reason: string; choice?: "REATTEMPT" | "UPDATE_ADDRESS" | "CANCEL"; note?: string } };
export const DEMO: Demo[] = [
  { n: 1001, name: "Asha Rao", phone: "9876543210", pin: "560001", pay: "PREPAID", amt: 1299, scenario: "DELIVERED", status: "DELIVERED", days: 9 },
  { n: 1002, name: "Rohan Mehta", phone: "9822012345", pin: "411001", pay: "COD", amt: 2199, scenario: "INTRANSIT", status: "IN_TRANSIT", days: 3 },
  { n: 1003, name: "Priya Nair", phone: "9847011223", pin: "682001", pay: "COD", amt: 4599, scenario: "ATTEMPTED", status: "NDR", days: 5, ndr: { reason: "Delivery attempted: customer not available", choice: "REATTEMPT", note: "Please come after 6 pm." } },
  { n: 1004, name: "Imran Khan", phone: "9811122233", pin: "110001", pay: "COD", amt: 899, scenario: "RTO", status: "RTO", days: 8 },
  { n: 1005, name: "Sneha Iyer", phone: "9840098765", pin: "600001", pay: "PREPAID", amt: 2999, scenario: "OUTFORDELIVERY", status: "IN_TRANSIT", days: 2 },
  { n: 1006, name: "Vikram Singh", phone: "9899988877", pin: "302001", pay: "COD", amt: 5200, scenario: "EXCEPTION", status: "NDR", days: 4, ndr: { reason: "Shipment held: address could not be found" } },
  { n: 1007, name: "Kavya Reddy", phone: "9701234567", pin: "500001", pay: "PREPAID", amt: 799, status: "NEW", days: 0 },
  { n: 1008, name: "Arjun Das", phone: "12345", pin: "12", pay: "COD", amt: 1800, status: "NEW", days: 0 },
  { n: 1009, name: "Meera Joshi", phone: "9867012345", pin: "400001", pay: "PREPAID", amt: 1499, scenario: "DELIVERED", status: "DELIVERED", days: 7 },
  { n: 1010, name: "Farhan Ali", phone: "9810012300", pin: "500032", pay: "COD", amt: 3499, scenario: "DESTINATION", status: "IN_TRANSIT", days: 3 },
  { n: 1011, name: "Lakshmi Pillai", phone: "9446012345", pin: "695001", pay: "PREPAID", amt: 2499, scenario: "RETURNED", status: "RTO", days: 10 },
  { n: 1012, name: "Deepak Verma", phone: "9936012345", pin: "226001", pay: "COD", amt: 1299, scenario: "PICKED", status: "IN_TRANSIT", days: 1 },
];
const ago = (d: number) => new Date(Date.now() - d * 864e5);
export const demoOrderRows = (merchantId: string, risk: (o: { paymentType: string; amount: number; phone: string; pincode: string }) => { level: string; reasons: string[] }) => DEMO.map(d => {
  const k = risk({ paymentType: d.pay, amount: d.amt, phone: d.phone, pincode: d.pin });
  return { merchantId, orderNo: `${DEMO_PREFIX}${d.n}`, customerName: d.name, phone: d.phone, pincode: d.pin, paymentType: d.pay, amount: d.amt, awb: d.scenario ? `VYT-${d.scenario}-${9000 + (d.n - 1000)}` : null, carrierCode: d.scenario ? "vyoma_test" : null,
    carrierName: d.scenario ? "VYOMA Test Carrier" : null, status: d.status, riskLevel: k.level, riskReasons: k.reasons, notifyOptIn: d.n % 2 === 0, shippedAt: d.scenario ? ago(d.days) : null, deliveredAt: d.status === "DELIVERED" ? ago(Math.max(0, d.days - 3)) : null,
    lastRefreshedAt: d.scenario ? new Date() : null, createdAt: ago(d.days + 1), trackToken: d.ndr ? randomBytes(12).toString("base64url") : null };
});
export const demoCases = (merchantId: string, ids: Map<string, string>) => DEMO.flatMap(d => { const orderId = ids.get(`${DEMO_PREFIX}${d.n}`); if (!d.ndr || !orderId) return [];
  return [{ merchantId, orderId, reason: d.ndr.reason, status: d.ndr.choice ? "CUSTOMER_REPLIED" : "OPEN", customerChoice: d.ndr.choice ?? null, customerNote: d.ndr.note ?? null, repliedAt: d.ndr.choice ? new Date() : null }]; });
