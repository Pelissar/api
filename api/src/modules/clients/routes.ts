import type { FastifyInstance } from 'fastify'
import { clientSchema, paginationQuerySchema } from '@nexus/shared'
import { prisma } from '../../lib/prisma'
import { parseWithSchema } from '../../lib/validation'
import { requireAdminAuth } from '../../plugins/auth'
import { AppError } from '../../lib/errors'
import { createAuditLog } from '../../lib/audit'

export async function clientRoutes(app: FastifyInstance) {
  app.get('/clients', { preHandler: requireAdminAuth }, async (request) => {
    const query = parseWithSchema(paginationQuerySchema, request.query)
    const tenantId = request.auth!.tenantId

    const where = {
      tenantId,
      ...(query.status ? { status: query.status as 'ATIVO' | 'INATIVO' } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { tradeName: { contains: query.search, mode: 'insensitive' as const } },
              { cpfCnpj: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } }
            ]
          }
        : {})
    }

    const [items, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          _count: { select: { licenses: true, portalUsers: true, supportTickets: true } },
          portalUsers: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
              mustResetPassword: true,
              lastLoginAt: true
            },
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      }),
      prisma.client.count({ where })
    ])

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize
    }
  })

  app.get('/clients/:id', { preHandler: requireAdminAuth }, async (request) => {
    const { id } = request.params as { id: string }
    const item = await prisma.client.findFirst({
      where: { id, tenantId: request.auth!.tenantId },
      include: {
        licenses: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' }
        },
        portalUsers: {
          orderBy: { createdAt: 'desc' }
        },
        supportTickets: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })
    if (!item) throw new AppError('Cliente nao encontrado.', 404)
    return item
  })

  app.post('/clients', { preHandler: requireAdminAuth }, async (request) => {
    const input = parseWithSchema(clientSchema, request.body)
    const item = await prisma.client.create({
      data: {
        tenantId: request.auth!.tenantId,
        name: input.name,
        tradeName: input.tradeName ?? null,
        cpfCnpj: input.cpfCnpj,
        email: input.email ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        zipCode: input.zipCode ?? null,
        notes: input.notes ?? null,
        status: input.status
      }
    })

    await createAuditLog({
      tenantId: request.auth!.tenantId,
      adminUserId: request.auth!.adminUserId,
      action: 'CLIENT_CREATE',
      entityType: 'CLIENT',
      entityId: item.id,
      metadata: { name: item.name }
    })

    return item
  })

  app.put('/clients/:id', { preHandler: requireAdminAuth }, async (request) => {
    const { id } = request.params as { id: string }
    const input = parseWithSchema(clientSchema, request.body)
    const existing = await prisma.client.findFirst({
      where: { id, tenantId: request.auth!.tenantId }
    })
    if (!existing) throw new AppError('Cliente nao encontrado.', 404)

    const item = await prisma.client.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        tradeName: input.tradeName ?? null,
        cpfCnpj: input.cpfCnpj,
        email: input.email ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        zipCode: input.zipCode ?? null,
        notes: input.notes ?? null,
        status: input.status
      }
    })

    await createAuditLog({
      tenantId: request.auth!.tenantId,
      adminUserId: request.auth!.adminUserId,
      action: 'CLIENT_UPDATE',
      entityType: 'CLIENT',
      entityId: item.id,
      metadata: { name: item.name }
    })

    return item
  })

  app.delete('/clients/:id', { preHandler: requireAdminAuth }, async (request) => {
    const { id } = request.params as { id: string }
    const existing = await prisma.client.findFirst({
      where: { id, tenantId: request.auth!.tenantId },
      include: { _count: { select: { licenses: true, portalUsers: true, supportTickets: true } } }
    })
    if (!existing) throw new AppError('Cliente nao encontrado.', 404)
    if (existing._count.licenses > 0 || existing._count.portalUsers > 0 || existing._count.supportTickets > 0) {
      throw new AppError('Nao e possivel excluir cliente com licencas, acessos ou tickets vinculados.', 409)
    }

    await prisma.client.delete({ where: { id: existing.id } })
    await createAuditLog({
      tenantId: request.auth!.tenantId,
      adminUserId: request.auth!.adminUserId,
      action: 'CLIENT_DELETE',
      entityType: 'CLIENT',
      entityId: existing.id,
      metadata: { name: existing.name }
    })

    return { success: true }
  })
}
