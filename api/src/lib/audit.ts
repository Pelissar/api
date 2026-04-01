import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'

interface AuditInput {
  tenantId: string
  adminUserId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  metadata?: Prisma.InputJsonValue | null
}

export async function createAuditLog(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      adminUserId: input.adminUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? undefined
    }
  })
}
