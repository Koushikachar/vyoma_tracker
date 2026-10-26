import { createHash } from "crypto";
// Password policy shared by every flow that sets a password (seller sign-up, reset, invite, admin change).
// Breach check uses Have I Been Pwned's k-anonymity range API: only the first 5 characters of the SHA-1 hash leave the server.
// If the service is unreachable we do NOT block the user (availability), the other rules still apply.
const COMMON = new Set(["password", "password1", "password123", "1234567890", "12345678910", "qwertyuiop", "iloveyou12", "letmein123", "admin12345", "welcome123", "vyomaroute"]);
export function passwordProblem(pw: string, email?: string): string | null {
  if (pw.length < 10) return "Use at least 10 characters.";
  if (COMMON.has(pw.toLowerCase())) return "That password is too common. Please choose another.";
  if (/^(.)\1+$/.test(pw)) return "Please avoid repeating a single character.";
  const local = email?.split("@")[0]?.toLowerCase(); if (local && local.length >= 4 && pw.toLowerCase().includes(local)) return "Your password should not contain your email name.";
  return null;
}
export async function isBreached(pw: string): Promise<boolean> {
  try {
    const h = createHash("sha1").update(pw).digest("hex").toUpperCase(); const pre = h.slice(0, 5), suf = h.slice(5);
    const r = await fetch(`https://api.pwnedpasswords.com/range/${pre}`, { headers: { "Add-Padding": "true", "user-agent": "vyoma-route" }, signal: AbortSignal.timeout(2500), cache: "no-store" });
    if (!r.ok) return false;
    return (await r.text()).split("\n").some(l => { const [s, n] = l.trim().split(":"); return s === suf && Number(n) > 0; });
  } catch { return false; }
}
// null = acceptable, otherwise a message safe to show the user.
export async function checkPassword(pw: string, email?: string): Promise<string | null> {
  const p = passwordProblem(pw, email); if (p) return p;
  return (await isBreached(pw)) ? "That password has appeared in a known data breach. Please choose a different one." : null;
}
