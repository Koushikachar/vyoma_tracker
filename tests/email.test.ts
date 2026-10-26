import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { emailProvider, gmailConfig, parseFrom } from "@/lib/email-config";
const KEYS = ["GMAIL_USER", "GMAIL_APP_PASSWORD", "EMAIL_FROM"]; let saved: Record<string, string | undefined> = {};
beforeEach(() => { saved = Object.fromEntries(KEYS.map(k => [k, process.env[k]])); KEYS.forEach(k => delete process.env[k]); });
afterEach(() => { KEYS.forEach(k => saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])); });
describe("gmail email config", () => {
  it("is off when nothing is set or either value is missing", () => { expect(emailProvider()).toBeNull(); process.env.GMAIL_USER = "a@gmail.com"; expect(emailProvider()).toBeNull(); delete process.env.GMAIL_USER; process.env.GMAIL_APP_PASSWORD = "x"; expect(emailProvider()).toBeNull(); });
  it("is on with a user and app password, and strips the spaces Google shows", () => { process.env.GMAIL_USER = "a@gmail.com"; process.env.GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop"; expect(emailProvider()).toBe("gmail"); expect(gmailConfig()!.pass).toBe("abcdefghijklmnop"); });
  it("always sends from the Gmail account and only takes the display name from EMAIL_FROM", () => { process.env.GMAIL_USER = "a@gmail.com"; process.env.GMAIL_APP_PASSWORD = "x"; expect(gmailConfig()!.from).toBe('"Vyoma Route" <a@gmail.com>'); process.env.EMAIL_FROM = '"Acme" <someone-else@evil.com>'; expect(gmailConfig()!.from).toBe('"Acme" <a@gmail.com>'); });
  it("cannot be header-injected through the display name", () => { process.env.GMAIL_USER = "a@gmail.com"; process.env.GMAIL_APP_PASSWORD = "x"; process.env.EMAIL_FROM = 'Evil\r\nBcc: x@y.com <z@y.com>'; expect(gmailConfig()!.from).not.toMatch(/[\r\n]/); });
});
describe("sender address", () => {
  it("reads a display name and address", () => expect(parseFrom('"Vyoma Route" <no-reply@x.com>')).toEqual({ name: "Vyoma Route", email: "no-reply@x.com" }));
  it("reads a bare address", () => expect(parseFrom("no-reply@x.com")).toEqual({ name: "Vyoma Route", email: "no-reply@x.com" }));
});
