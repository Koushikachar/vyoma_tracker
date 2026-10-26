import { lookup } from "dns/promises";
import { BlockList, isIP } from "net";
// Seller-supplied store URLs are fetched by our server, so only public https hosts are allowed (blocks localhost, private networks, cloud metadata).
const bl = new BlockList();
for (const [n, p] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4]] as [string, number][]) bl.addSubnet(n, p, "ipv4");
for (const [n, p] of [["::", 128], ["::1", 128], ["64:ff9b::", 96], ["100::", 64], ["2001:db8::", 32], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8]] as [string, number][]) bl.addSubnet(n, p, "ipv6");
export function isPrivateIp(ip: string): boolean {
  const v = isIP(ip); if (!v) return true;
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip); if (mapped) return bl.check(mapped[1], "ipv4"); // IPv4-mapped IPv6 is judged as the IPv4 it wraps
  if (/^::ffff:/i.test(ip)) return true;
  return bl.check(ip, v === 4 ? "ipv4" : "ipv6");
}
export async function publicHttpsOrigin(input: string) {
  let u: URL; try { u = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`); } catch { throw new Error("Enter a valid store address."); }
  if (u.protocol !== "https:") throw new Error("The store address must start with https://"); if (u.username || u.password || (u.port && u.port !== "443")) throw new Error("Please use the plain store address.");
  const host = u.hostname.replace(/^\[|\]$/g, ""); if (!host.includes(".") && !isIP(host)) throw new Error("That address cannot be used.");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (!addrs.length || addrs.some(a => isPrivateIp(a.address))) throw new Error("That address cannot be used.");
  return u.origin;
}
