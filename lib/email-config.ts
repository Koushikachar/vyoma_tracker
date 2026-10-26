// Email is sent through Gmail SMTP only. Configuration comes from environment variables (no database, so it is easy to test).
//   GMAIL_USER          the Gmail address that sends the mail
//   GMAIL_APP_PASSWORD  a 16-character Google "App password" (NOT your normal Gmail password)
//   EMAIL_FROM          optional display name, e.g. "Vyoma Route <you@gmail.com>". Gmail always sends from the authenticated account.
export type Provider = "gmail";
const env = (k: string) => process.env[k]?.trim() || "";
export function gmailConfig(): { user: string; pass: string; from: string } | null {
  const user = env("GMAIL_USER"); const pass = env("GMAIL_APP_PASSWORD").replace(/\s+/g, ""); // Google shows the app password in groups of 4 with spaces
  if (!user || !pass) return null;
  const f = parseFrom(env("EMAIL_FROM"));
  return { user, pass, from: `"${(f.name || "Vyoma Route").replace(/["\r\n]/g, "")}" <${user}>` };
}
export function emailProvider(): Provider | null { return gmailConfig() ? "gmail" : null; }
// "Vyoma Route <no-reply@example.com>" or just "no-reply@example.com"
export function parseFrom(v: string): { name: string; email: string } {
  const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(v); return m ? { name: m[1].trim() || "Vyoma Route", email: m[2].trim() } : { name: "Vyoma Route", email: v.trim() };
}
