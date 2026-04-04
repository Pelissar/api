import type { FastifyInstance } from 'fastify'
import { paginationQuerySchema, planSchema } from '@nexus/shared'
import { prisma } from '../../lib/prisma.js'
import { parseWithSchema } from '../../lib/validation.js'
import { requireAdminAuth } from '../../plugins/auth.js'
import { AppError } from '../../lib/errors.js'
import { createAuditLog } from '../../lib/audit.js'

export async function planRoutes(app: FastifyInstance) {
  app.get('/plans', { preHandler: requireAdminAuth }, async (request) => {
    const query = parseWithSchema(paginationQuerySchema, request.query)
    const where = {
      tenantId: request.auth!.tenantId,
      ...(query.status ? { status: query.status as 'ATIVO' | 'INATIVO' } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { description: { contains: query.search, mode: 'insensitive' as const } }
            ]
          }
        : {})
    }

    const [items, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { _count: { select: { licenses: true } } }
      }),
      prisma.plan.count({ where })
    ])

    return {
      items: items.map((item) => ({
        ...item,
        price: Number(item.price)
      })),
      total,
      page: query.page,
      pageSize: query.pageSize
    }
  })

  app.get('/plans/:id', { preHandler: requireAdminAuth }, async (request) => {
    const { id } = request.params as { id: string }
    const item = await prisma.plan.findFirst({
      where: { id, tenantId: request.auth!.tenantId }
    })
    if (!item) throw new AppError('Plano nao encontrado.', 404)
    return {
      ...item,
      price: Number(item.price)
    }
  })

  app.post('/plans', { preHandler: requireAdminAuth }, async (request) => {
    const input = parseWithSchema(planSchema, request.body)
    const item = await prisma.plan.create({
      data: {
        tenantId: request.auth!.tenantId,
        name: input.name,
        interval: input.interval,
        price: input.price,
        description: input.description ?? null,
        deviceLimit: input.deviceLimit,
        features: input.features,
        enabledEditions: input.enabledEditions,
        status: input.status
      }
    })

    await createAuditLog({
      tenantId: request.auth!.tenantId,
      adminUserId: request.auth!.adminUserId,
      action: 'PLAN_CREATE',
      entityType: 'PLAN',
      entityId: item.id,
      metadata: { name: item.name }
    })

    return {
      ...item,
      price: Number(item.price)
    }
  })

  app.put('/plans/:id', { preHandler: requireAdminAuth }, async (request) => {
    const { id } = request.params as { id: string }
    const input = parseWithSchema(planSchema, request.body)
    const existing = await prisma.plan.findFirst({
      where: { id, tenantId: request.auth!.tenantId }
    })
    if (!existing) throw new AppError('Plano nao encontrado.', 404)

    const item = await prisma.plan.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        interval: input.interval,
        price: input.price,
        description: input.description ?? null,
        deviceLimit: input.deviceLimit,
        features: input.features,
        enabledEditions: input.enabledEditions,
        status: input.status
      }
    })

    await createAuditLog({
      tenantId: request.auth!.tenantId,
      adminUserId: request.auth!.adminUserId,
      action: 'PLAN_UPDATE',
      entityType: 'PLAN',
      entityId: item.id,
      metadata: { name: item.name }
    })

    return {
      ...item,
      price: Number(item.price)
    }
  })

  app.delete('/plans/:id', { preHandler: requireAdminAuth }, async (request) => {
    const { id } = request.params as { id: string }
    const existing = await prisma.plan.findFirst({
      where: { id, tenantId: request.auth!.tenantId },
      include: { _count: { select: { licenses: true } } }
    })
    if (!existing) throw new AppError('Plano nao encontrado.', 404)
    if (existing._count.licenses > 0) {
      throw new AppError('Nao e possivel excluir plano com licencas vinculadas.', 409)
    }

    await prisma.plan.delete({ where: { id: existing.id } })
    await createAuditLog({
      tenantId: request.auth!.tenantId,
      adminUserId: request.auth!.adminUserId,
      action: 'PLAN_DELETE',
      entityType: 'PLAN',
      entityId: existing.id,
      metadata: { name: existing.name }
    })

    return { success: true }
  })
}

