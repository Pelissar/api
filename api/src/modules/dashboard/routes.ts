import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { requireAdminAuth } from '../../plugins/auth.js'

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard/metrics', { preHandler: requireAdminAuth }, async (request) => {
    const tenantId = request.auth!.tenantId
    const now = new Date()
    const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const [
      totalClients,
      totalPlans,
      totalLicenses,
      activeLicenses,
      suspendedLicenses,
      expiredLicenses,
      expiringIn7Days,
      totalVersions,
      updatableLicenses,
      totalPortalUsers,
      openTickets,
      recentClients,
      recentLicenses,
      recentVersions,
      recentTickets
    ] = await Promise.all([
      prisma.client.count({ where: { tenantId } }),
      prisma.plan.count({ where: { tenantId } }),
      prisma.license.count({ where: { tenantId } }),
      prisma.license.count({ where: { tenantId, status: 'ATIVA' } }),
      prisma.license.count({ where: { tenantId, status: 'SUSPENSA' } }),
      prisma.license.count({
        where: {
          tenantId,
          OR: [{ status: 'EXPIRADA' }, { expiresAt: { lt: now } }]
        }
      }),
      prisma.license.count({
        where: {
          tenantId,
          status: { in: ['ATIVA', 'TESTE'] },
          expiresAt: { gte: now, lte: next7Days }
        }
      }),
      prisma.appVersion.count({ where: { tenantId } }),
      prisma.license.count({ where: { tenantId, canUpdate: true, status: 'ATIVA' } }),
      prisma.portalUser.count({ where: { tenantId } }),
      prisma.supportTicket.count({
        where: {
          tenantId,
          status: { in: ['ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE'] }
        }
      }),
      prisma.client.findMany({
        where: { tenantId },
        select: { id: true, name: true, email: true, createdAt: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.license.findMany({
        where: { tenantId },
        include: { client: { select: { name: true } } },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.appVersion.findMany({
        where: { tenantId },
        select: { id: true, version: true, releaseChannel: true, createdAt: true },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.supportTicket.findMany({
        where: { tenantId },
        include: {
          client: { select: { name: true } }
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ])

    return {
      totalClients,
      totalPlans,
      totalLicenses,
      activeLicenses,
      suspendedLicenses,
      expiredLicenses,
      expiringIn7Days,
      totalVersions,
      updatableLicenses,
      totalPortalUsers,
      openTickets,
      recentClients: recentClients.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString()
      })),
      recentLicenses: recentLicenses.map((item) => ({
        id: item.id,
        code: item.code,
        status: item.status,
        clientName: item.client.name,
        expiresAt: item.expiresAt?.toISOString() ?? null
      })),
      recentVersions: recentVersions.map((item) => ({
        id: item.id,
        version: item.version,
        channel: item.releaseChannel,
        createdAt: item.createdAt.toISOString()
      })),
      recentTickets: recentTickets.map((item) => ({
        id: item.id,
        subject: item.subject,
        status: item.status,
        clientName: item.client.name,
        createdAt: item.createdAt.toISOString()
      }))
    }
  })
}

