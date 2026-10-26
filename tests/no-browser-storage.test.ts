import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
// Guard: the app must never persist anything in the browser's localStorage / sessionStorage / IndexedDB.
// (Sessions use httpOnly cookies; the theme uses a plain cookie.) The only allowed mention is removing the legacy "theme" key.
const walk = (d: string): string[] => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?)$/.test(p) ? [p] : []; });
describe("no browser storage", () => {
  it("source never reads or writes localStorage / sessionStorage / indexedDB", () => {
    const bad = ["app", "components", "lib"].flatMap(walk).flatMap(f => readFileSync(f, "utf8").split("\n").map((l, i) => ({ f, i: i + 1, l })))
      .filter(({ l }) => /\b(localStorage|sessionStorage|indexedDB)\b/.test(l.replace(/\/\/.*$/, "")) && !/localStorage\.removeItem\("theme"\)/.test(l));
    expect(bad.map(b => `${b.f}:${b.i}`)).toEqual([]);
  });
});
