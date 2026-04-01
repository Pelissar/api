import { prisma } from './prisma';
export async function createAuditLog(input) {
    return prisma.auditLog.create({
        data: {
            tenantId: input.tenantId,
            adminUserId: input.adminUserId ?? null,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId ?? null,
            metadata: input.metadata ?? undefined
        }
    });
}
