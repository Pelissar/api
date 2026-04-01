import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { paginationQuerySchema } from '@nexus/shared'
import { prisma } from '../../lib/prisma'
import { createAuditLog } from '../../lib/audit'
import { parseWithSchema } from '../../lib/validation'
import { requireAdminAuth } from '../../plugins/auth'

const auditLogsQuerySchema = paginationQuerySchema.extend({
  days: z.coerce.number().int().min(1).max(90).default(30)
})

const auditCleanupQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(90)
})

export async function auditRoutes(app: FastifyInstance) {
  app.get('/audit-logs', { preHandler: requireAdminAuth }, async (request) => {
    const query = parseWithSchema(auditLogsQuerySchema, request.query)
    const createdAtFrom = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000)
    const where = {
      tenantId: request.auth!.tenantId,
      createdAt: {
        gte: createdAtFrom
      },
      ...(query.search
        ? {
            OR: [
              { action: { contains: query.search, mode: 'insensitive' as const } },
              { entityType: { contains: query.search, mode: 'insensitive' as const } },
              { entityId: { contains: query.search, mode: 'insensitive' as const } }
            ]
          }
        : {})
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          adminUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      prisma.auditLog.count({ where })
    ])

    return { items, total, page: query.page, pageSize: query.pageSize }
  })

  app.delete('/audit-logs/cleanup', { preHandler: requireAdminAuth }, async (request) => {
    const query = parseWithSchema(auditCleanupQuerySchema, request.query)
    const createdAtBefore = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000)

    const result = await prisma.auditLog.deleteMany({
      where: {
        tenantId: request.auth!.tenantId,
        createdAt: {
          lt: createdAtBefore
        }
      }
    })

    await createAuditLog({
      tenantId: request.auth!.tenantId,
      adminUserId: request.auth!.adminUserId,
      action: 'CLEANUP',
      entityType: 'AUDIT_LOGS',
      metadata: {
        removed: result.count,
        retainedDays: query.days
      }
    })

    return {
      removed: result.count,
      days: query.days
    }
  })
}
