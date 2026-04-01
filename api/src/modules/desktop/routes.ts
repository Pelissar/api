import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { parseWithSchema } from '../../lib/validation'
import { AppError } from '../../lib/errors'
import { isExpired } from '../../lib/utils'

const desktopRecordTypeSchema = z.enum(['COMPANY', 'CUSTOMER', 'PRODUCT', 'ORDER', 'USER'])

const desktopSyncSchema = z.object({
  licenseCode: z.string().trim().min(8),
  deviceFingerprint: z.string().trim().min(6),
  lastPulledAt: z.string().datetime().nullable().optional(),
  changes: z
    .array(
      z.object({
        id: z.string().trim().min(8),
        recordType: desktopRecordTypeSchema,
        updatedAt: z.string().datetime(),
        isDeleted: z.boolean().default(false),
        payload: z.unknown().nullable().optional()
      })
    )
    .max(2000)
    .default([])
})

const recordPriority: Record<z.infer<typeof desktopRecordTypeSchema>, number> = {
  COMPANY: 0,
  USER: 1,
  CUSTOMER: 2,
  PRODUCT: 3,
  ORDER: 4
}

function ensureLicenseOperational(license: {
  status: string
  expiresAt: Date | null
}) {
  if (!(license.status === 'ATIVA' || license.status === 'TESTE')) {
    throw new AppError('Licenca indisponivel para sincronizacao.', 403)
  }
  if (isExpired(license.expiresAt)) {
    throw new AppError('Licenca expirada.', 403)
  }
}

async function requireDesktopAccess(licenseCode: string, deviceFingerprint: string) {
  const license = await prisma.license.findUnique({
    where: { code: licenseCode },
    include: {
      client: true,
      deviceActivations: true
    }
  })

  if (!license) {
    throw new AppError('Licenca nao encontrada.', 404)
  }

  ensureLicenseOperational(license)

  const device = license.deviceActivations.find((item) => item.deviceFingerprint === deviceFingerprint && item.isActive)
  if (!device) {
    throw new AppError('Dispositivo nao autorizado para esta licenca.', 403)
  }

  return {
    license,
    device
  }
}

async function applyDesktopChange(
  tenantId: string,
  change: {
    id: string
    recordType: z.infer<typeof desktopRecordTypeSchema>
    updatedAt: string
    isDeleted: boolean
    payload?: unknown | null
  }
) {
  const incomingUpdatedAt = new Date(change.updatedAt)
  const existing = await prisma.desktopRecord.findUnique({
    where: { id: change.id }
  })

  if (existing && existing.tenantId !== tenantId) {
    throw new AppError('Este registro pertence a outra licenca/empresa.', 403)
  }

  if (!existing) {
    await prisma.desktopRecord.create({
      data: {
        id: change.id,
        tenantId,
        recordType: change.recordType,
        payload: change.payload ?? {},
        isDeleted: change.isDeleted,
        updatedAt: incomingUpdatedAt
      }
    })
    return
  }

  if (existing.updatedAt > incomingUpdatedAt) {
    return
  }

  await prisma.desktopRecord.update({
    where: { id: existing.id },
    data: {
      recordType: change.recordType,
      payload: change.payload ?? {},
      isDeleted: change.isDeleted,
      updatedAt: incomingUpdatedAt
    }
  })
}

export async function desktopRoutes(app: FastifyInstance) {
  app.post('/desktop/sync', async (request) => {
    const input = parseWithSchema(desktopSyncSchema, request.body)
    const { license, device } = await requireDesktopAccess(input.licenseCode, input.deviceFingerprint)

    for (const change of input.changes) {
      await applyDesktopChange(license.tenantId, change)
    }

    await prisma.$transaction([
      prisma.deviceActivation.update({
        where: { id: device.id },
        data: {
          lastSeenAt: new Date()
        }
      }),
      prisma.license.update({
        where: { id: license.id },
        data: {
          lastValidationAt: new Date()
        }
      })
    ])

    const lastPulledAt = input.lastPulledAt ? new Date(input.lastPulledAt) : new Date(0)
    const serverChanges = await prisma.desktopRecord.findMany({
      where: {
        tenantId: license.tenantId,
        updatedAt: {
          gt: lastPulledAt
        }
      }
    })

    const orderedChanges = serverChanges
      .slice()
      .sort((left, right) => {
        const priorityDelta = recordPriority[left.recordType] - recordPriority[right.recordType]
        if (priorityDelta !== 0) return priorityDelta
        return left.updatedAt.getTime() - right.updatedAt.getTime()
      })
      .map((item) => ({
        id: item.id,
        recordType: item.recordType,
        updatedAt: item.updatedAt.toISOString(),
        isDeleted: item.isDeleted,
        payload: item.payload
      }))

    return {
      ok: true,
      tenantId: license.tenantId,
      tenantName: license.client.tradeName || license.client.name,
      clientName: license.client.tradeName || license.client.name,
      clientDocument: license.client.cpfCnpj,
      serverTime: new Date().toISOString(),
      changes: orderedChanges
    }
  })
}
