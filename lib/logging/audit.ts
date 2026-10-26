import { clientIp } from "@/lib/http/request";
import { prisma } from "@/lib/db/prisma";
export async function audit(actor: string, action: string, req?: Request, resource?: string, resourceId?: string) {
  try { await prisma.auditLog.create({ data: { actor, action, resource, resourceId,
    ip: req ? clientIp(req) : undefined, userAgent: req?.headers.get("user-agent")?.slice(0, 200) } }); } catch {}
}
