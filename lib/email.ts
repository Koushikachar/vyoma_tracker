import { getSettings } from "@/lib/settings";
import { emailProvider, gmailConfig } from "@/lib/email-config";
export { emailProvider } from "@/lib/email-config";
export type Mail = { to: string; subject: string; text: string; html?: string; replyTo?: string };
// One place that actually sends mail: Gmail SMTP via nodemailer (see lib/email-config.ts). Errors never contain secrets.
let transport: import("nodemailer").Transporter | null = null;
async function deliver(m: Mail) {
  const cfg = gmailConfig(); if (!cfg) throw new Error(NOT_CONFIGURED);
  if (!transport) {
    const nm = (await import("nodemailer")).default;
    transport = nm.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: cfg.user, pass: cfg.pass }, connectionTimeout: 12_000, greetingTimeout: 12_000, socketTimeout: 20_000 });
  }
  try { await transport.sendMail({ from: cfg.from, to: m.to, subject: m.subject, text: m.text, html: m.html, replyTo: m.replyTo }); }
  catch (e) { transport = null; throw new Error(`Gmail: ${gmailReason(e)}`); } // rebuild the connection next time; never echo credentials
}
const NOT_CONFIGURED = "Email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD (see docs/EMAIL_SETUP.md).";
function gmailReason(e: unknown) {
  const x = e as { code?: string; responseCode?: number; message?: string };
  if (x.code === "EAUTH" || x.responseCode === 535) return "login was refused. Check GMAIL_USER and use a Google App Password (2-Step Verification must be on).";
  if (x.responseCode === 550 || x.responseCode === 552 || x.responseCode === 554) return "Gmail rejected the message (daily sending limit or blocked content).";
  if (x.code === "ETIMEDOUT" || x.code === "ECONNECTION" || x.code === "ESOCKET") return "could not reach smtp.gmail.com (network or firewall).";
  return (x.message ?? "send failed").replace(/\s+/g, " ").slice(0, 160);
}
// Contact-form notification to the site owner. Best-effort: failures are swallowed and message content is never logged.
export async function notifyAdmin(name: string, email: string, company: string | undefined, message: string) {
  const to = (await getSettings()).notifyEmail || process.env.ADMIN_NOTIFY_EMAIL; if (!emailProvider() || !to) return;
  const clean = (x: string) => x.replace(/[\r\n]+/g, " ").slice(0, 80);
  try { await deliver({ to, replyTo: email, subject: `New VYOMA ROUTE contact: ${clean(name)}`, text: `From: ${clean(name)} <${email}>${company ? `\nCompany: ${clean(company)}` : ""}\n\n${message}` }); } catch { console.error("contact notification failed"); }
}
export async function sendAdminEmail(subject: string, text: string) {
  const to = (await getSettings()).notifyEmail || process.env.ADMIN_NOTIFY_EMAIL; if (!emailProvider() || !to) return false;
  try { await deliver({ to, subject, text }); return true; } catch { return false; }
}
// Transactional mail for sellers (verification / password reset / invitations). In development with nothing configured the message is
// printed to the server console so you can click the link locally. In production a missing set-up is an error, never silently dropped.
export async function sendEmail(m: { to: string; subject: string; text: string; html: string }) {
  if (!emailProvider()) {
    if (process.env.NODE_ENV !== "production") { console.log(`\n[email:dev] To: ${m.to}\nSubject: ${m.subject}\n${m.text}\n`); return; }
    throw new Error(NOT_CONFIGURED);
  }
  await deliver(m);
}
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
export const actionEmail = (o: { name: string; heading: string; intro: string; button: string; url: string; note: string }) => ({
  text: `Hi ${o.name},\n\n${o.intro}\n\n${o.button}: ${o.url}\n\n${o.note}\n\nVyoma Route`,
  html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#111"><h2 style="margin:0 0 12px">${esc(o.heading)}</h2><p>Hi ${esc(o.name)},</p><p>${esc(o.intro)}</p><p style="margin:24px 0"><a href="${esc(o.url)}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">${esc(o.button)}</a></p><p style="color:#555;font-size:13px">${esc(o.note)}</p><p style="color:#999;font-size:12px">If the button does not work, paste this link into your browser:<br>${esc(o.url)}</p></div>`,
});
