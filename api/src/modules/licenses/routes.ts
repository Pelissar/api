import type { FastifyInstance } from 'fastify'
import { compareVersions } from 'compare-versions'
import {
  licenseActivationSchema,
  licenseSchema,
  licenseValidationSchema,
  paginationQuerySchema,
  renewLicenseSchema,
  updateCheckSchema
} from '@nexus/shared'
import { prisma } from '../../lib/prisma'
import { parseWithSchema } from '../../lib/validation'
import { requireAdminAuth } from '../../plugins/auth'
import { AppError } from '../../lib/errors'
import { addDays, isExpired, randomLicenseCode } from '../../lib/utils'
import { createAuditLog } from '../../lib/audit'

async function generateUniqueLicenseCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = randomLicenseCode()
    const exists = await prisma.license.findUnique({ where: { code } })
    if (!exists) return code
  }
  throw new AppError('Nao foi possivel gerar um codigo de licenca unico.', 500)
}

function isOperationalLicense(status: string): boolean {
  return status === 'ATIVA' || status === 'TESTE'
}

function ensureLicenseOperational(license: {
  status: string
  expiresAt: Date | null
}) {
  if (!isOperationalLicense(license.status)) {
    throw new AppError('Licenca indisponivel para uso.', 403)
  }
  if (isExpired(license.expiresAt)) {
    throw new AppError('Licenca expirada.', 403)
  }
}

function allowVersionByLicenseBounds(
  current: {
    minVersion: string | null
    maxVersion: string | null
  },
  version: string
) {
  if (current.minVersion && compareVersions(version, current.minVersion) < 0) return false
  if (current.maxVersion && compareVersions(version, current.maxVersion) > 0) return false
  return true
}

export async function licenseRoutes(app: FastifyInstance) {
  app.get('/licenses', { preHandler: requireAdminAuth }, async (request) => {
    const query = parseWithSchema(paginationQuerySchema, request.query)
    const where = {
      tenantId: request.auth!.tenantId,
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' as const } },
              { client: { name: { contains: query.search, mode: 'insensitive' as const } } },
              { client: { cpfCnpj: { contains: query.search, mode: 'insensitive' as const } } }
            ]
          }
        : {})
    }

    const [items, total] = await Promise.all([
      prisma.license.findMany({
        where,
        include: {
          client: true,
          plan: true,
          deviceActivations: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      prisma.license.count({ where })
    ])

    return { items, total, page: query.page, pageSize: query.pageSize }
  })

  app.get('/licenses/:id', { preHandler: requireAdminAuth }, async (request) => {
    const { id } = request.params as { id: string }
    const item = await prisma.license.findFirst({
      where: { id, tenantId: request.auth!.tenantId },
      include: {
        client: true,
        plan: true,
        deviceActivations: true,
        appVersions: { include: { appVersion: true } }
      }
    })
    if (!item) throw new AppError('Licenca nao encontrada.', 404)
    return item
  })

  app.post('/licenses', { preHandler: requireAdminAuth }, async (request) => {
    const input = parseWithSchema(licenseSchema, request.body)
    const plan = await prisma.plan.findFirst({
      where: { id: input.planId, tenantId: request.auth!.tenantId }
    })
    if (!plan) throw new AppError('Plano nao encontrado.', 404)

    const code = await generateUniqueLicenseCode()
    const activatedAt = input.activatedAt ? new Date(input.activatedAt) : new Date()
    const expiresAt = input.expiresAt
      ? new Date(input.expiresAt)
      : input.type === 'MENSAL'
        ? addDays(activatedAt, 30)
        : addDays(activatedAt, 365)

    const item = await prisma.license.create({
      data: {
        tenantId: request.auth!.tenantId,
        code,
        clientId: input.clientId,
        planId: input.planId,
        type: input.type,
        status: input.status,
        activatedAt,
        expiresAt,
        devicesAllowed: input.devicesAllowed || plan.deviceLimit,
        notes: input.notes ?? null,
        minVersion: input.minVersion ?? null,
        maxVersion: input.maxVersion ?? null,
        canUpdate: input.canUpdate,
        canUseBeta: input.canUseBeta,
        enabledEditions: input.enabledEditions?.length ? input.enabledEditions : plan.enabledEditions
      }
    })

    await createAuditLog({
      tenantId: request.auth!.tenantId,
      adminUserId: request.auth!.adminUserId,
      action: 'LICENSE_CREATE',
      entityType: 'LICENSE',
      entityId: item.id,
      metadata: { code: item.code, clientId: item.clientId, planId: item.planId }
    })

    return item
  })

  app.put('/licenses/:id', { preHandler: requireAdminAuth }, async (request) => {
    const { id } = request.params as { id: string }
    const input = parseWithSchema(licenseSchema, request.body)
    const existing = await prisma.license.findFirst({
      where: { id, tenantId: request.auth!.tenantId }
    })
    if (!existing) throw new AppError('Licenca nao encontrada.', 404)

    const item = await prisma.license.update({
      where: { id: existing.id },
      data: {
        clientId: input.clientId,
        planId: input.planId,
        type: input.type,
        status: input.status,
        activatedAt: input.activatedAt ? new Date(input.activatedAt) : existing.activatedAt,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : existing.expiresAt,
        devicesAllowed: input.devicesAllowed,
        notes: input.notes ?? null,
        minVersion: input.minVersion ?? null,
        maxVersion: input.maxVersion ?? null,
        canUpdate: input.canUpdate,
        canUseBeta: input.canUseBeta,
        enabledEditions: input.enabledEditions
      }
    })

    await createAuditLog({
      tenantId: request.auth!.tenantId,
      adminUserId: request.auth!.adminUserId,
      action: 'LICENSE_UPDATE',
      entityType: 'LICENSE',
      entityId: item.id,
      metadata: { code: item.code, status: item.status }
    })

    return item
  })

  app.post('/licenses/:id/renew', { preHandler: requireAdminAuth }, async (request) => {
    const { id } = request.params as { id: string }
    const input = parseWithSchema(renewLicenseSchema, request.body)
    const existing = await prisma.license.findFirst({
      where: { id, tenantId: request.auth!.tenantId }
    })
    if (!existing) throw new AppError('Licenca nao encontrada.', 404)

    const startBase = existing.expiresAt && existing.expiresAt > new Date() ? existing.expiresAt : new Date()
    const item = await prisma.license.update({
      where: { id: existing.id },
      data: {
        status: 'ATIVA',
        expiresAt: addDays(startBase, input.days)
      }
    })

    await createAuditLog({
      tenantId: request.auth!.tenantId,
      adminUserId: request.auth!.adminUserId,
      action: 'LICENSE_RENEW',
      entityType: 'LICENSE',
      entityId: item.id,
      metadata: { code: item.code, days: input.days }
    })

    return item
  })

  app.post('/licenses/:id/status', { preHandler: requireAdminAuth }, async (request) => {
    const { id } = request.params as { id: string }
    const body = request.body as { status?: string }
    if (!body?.status) throw new AppError('Status obrigatorio.', 400)

    const existing = await prisma.license.findFirst({
      where: { id, tenantId: request.auth!.tenantId }
    })
    if (!existing) throw new AppError('Licenca nao encontrada.', 404)

    const item = await prisma.license.update({
      where: { id: existing.id },
      data: { status: body.status as any }
    })

    await createAuditLog({
      tenantId: request.auth!.tenantId,
      adminUserId: request.auth!.adminUserId,
      action: 'LICENSE_STATUS_CHANGE',
      entityType: 'LICENSE',
      entityId: item.id,
      metadata: { code: item.code, status: item.status }
    })

    return item
  })

  app.delete('/licenses/:id', { preHandler: requireAdminAuth }, async (request) => {
    const { id } = request.params as { id: string }
    const existing = await prisma.license.findFirst({
      where: { id, tenantId: request.auth!.tenantId },
      include: { deviceActivations: true, appVersions: true }
    })
    if (!existing) throw new AppError('Licenca nao encontrada.', 404)
    if (existing.deviceActivations.length > 0 || existing.appVersions.length > 0) {
      throw new AppError('Nao e possivel excluir licenca com historico de ativacao ou permissoes.', 409)
    }

    await prisma.license.delete({ where: { id: existing.id } })
    await createAuditLog({
      tenantId: request.auth!.tenantId,
      adminUserId: request.auth!.adminUserId,
      action: 'LICENSE_DELETE',
      entityType: 'LICENSE',
      entityId: existing.id,
      metadata: { code: existing.code }
    })

    return { success: true }
  })

  app.post('/licenses/activate', async (request) => {
    const input = parseWithSchema(licenseActivationSchema, request.body)
    const license = await prisma.license.findUnique({
      where: { code: input.licenseCode },
      include: { client: true, plan: true, deviceActivations: true }
    })
    if (!license) throw new AppError('Licenca nao encontrada.', 404)
    ensureLicenseOperational(license)

    const existingDevice = license.deviceActivations.find((item) => item.deviceFingerprint === input.deviceFingerprint)
    if (!existingDevice && license.deviceActivations.filter((item) => item.isActive).length >= license.devicesAllowed) {
      throw new AppError('Limite de dispositivos atingido para esta licenca.', 403)
    }

    const device = existingDevice
      ? await prisma.deviceActivation.update({
          where: { id: existingDevice.id },
          data: {
            deviceName: input.deviceName ?? existingDevice.deviceName,
            appVersion: input.appVersion ?? existingDevice.appVersion,
            lastSeenAt: new Date(),
            isActive: true
          }
        })
      : await prisma.deviceActivation.create({
          data: {
            licenseId: license.id,
            deviceFingerprint: input.deviceFingerprint,
            deviceName: input.deviceName ?? null,
            appVersion: input.appVersion ?? null,
            lastSeenAt: new Date(),
            isActive: true
          }
        })

    await prisma.license.update({
      where: { id: license.id },
      data: {
        activatedAt: license.activatedAt ?? new Date(),
        lastValidationAt: new Date()
      }
    })

    return {
      valid: true,
      license: {
        id: license.id,
        code: license.code,
        tenantId: license.tenantId,
        clientName: license.client.tradeName || license.client.name,
        clientDocument: license.client.cpfCnpj,
        status: license.status,
        expiresAt: license.expiresAt,
        planName: license.plan.name,
        enabledEditions: license.enabledEditions,
        device: device.deviceFingerprint
      }
    }
  })

  app.post('/licenses/validate', async (request) => {
    const input = parseWithSchema(licenseValidationSchema, request.body)
    const license = await prisma.license.findUnique({
      where: { code: input.licenseCode },
      include: { client: true, plan: true, deviceActivations: true }
    })
    if (!license) throw new AppError('Licenca nao encontrada.', 404)
    ensureLicenseOperational(license)

    const existingDevice = license.deviceActivations.find((item) => item.deviceFingerprint === input.deviceFingerprint && item.isActive)
    if (!existingDevice) {
      throw new AppError('Dispositivo nao autorizado para esta licenca.', 403)
    }

    await prisma.$transaction([
      prisma.deviceActivation.update({
        where: { id: existingDevice.id },
        data: {
          lastSeenAt: new Date(),
          appVersion: input.appVersion ?? existingDevice.appVersion
        }
      }),
      prisma.license.update({
        where: { id: license.id },
        data: { lastValidationAt: new Date() }
      })
    ])

    return {
      valid: true,
      license: {
        id: license.id,
        code: license.code,
        tenantId: license.tenantId,
        clientName: license.client.tradeName || license.client.name,
        clientDocument: license.client.cpfCnpj,
        status: license.status,
        expiresAt: license.expiresAt,
        planName: license.plan.name,
        enabledEditions: license.enabledEditions
      }
    }
  })

  app.post('/licenses/check-update', async (request) => {
    const input = parseWithSchema(updateCheckSchema, request.body)
    const license = await prisma.license.findUnique({
      where: { code: input.licenseCode },
      include: {
        plan: true,
        deviceActivations: true,
        appVersions: { include: { appVersion: true } }
      }
    })
    if (!license) throw new AppError('Licenca nao encontrada.', 404)
    ensureLicenseOperational(license)
    if (!license.canUpdate) {
      return {
        allowed: false,
        currentVersion: input.currentVersion,
        latestVersion: null,
        updateAvailable: false,
        mandatory: false,
        changelog: null,
        downloadUrl: null,
        reason: 'Licenca sem permissao para atualizar.'
      }
    }

    const existingDevice = license.deviceActivations.find((item) => item.deviceFingerprint === input.deviceFingerprint && item.isActive)
    if (!existingDevice) {
      throw new AppError('Dispositivo nao autorizado para esta licenca.', 403)
    }
    if (input.releaseChannel === 'BETA' && !license.canUseBeta) {
      return {
        allowed: false,
        currentVersion: input.currentVersion,
        latestVersion: null,
        updateAvailable: false,
        mandatory: false,
        changelog: null,
        downloadUrl: null,
        reason: 'Licenca sem permissao para canal beta.'
      }
    }

    const versions = await prisma.appVersion.findMany({
      where: {
        tenantId: license.tenantId,
        isActive: true,
        releaseChannel: input.releaseChannel
      },
      include: {
        licensePermissions: true,
        planPermissions: true
      },
      orderBy: [{ buildNumber: 'desc' }, { createdAt: 'desc' }]
    })

    const candidates = versions.filter((version) => {
      if (!allowVersionByLicenseBounds(license, version.version)) return false

      if (version.allowAllActiveLicenses) return true
      const byLicense = version.licensePermissions.some((item) => item.licenseId === license.id)
      const byPlan = version.planPermissions.some((item) => item.planId === license.planId)
      return byLicense || byPlan
    })

    const latest = candidates.find((version) => {
      try {
        return compareVersions(version.version, input.currentVersion) > 0
      } catch {
        return version.version !== input.currentVersion
      }
    })

    if (!latest) {
      return {
        allowed: true,
        currentVersion: input.currentVersion,
        latestVersion: input.currentVersion,
        updateAvailable: false,
        mandatory: false,
        changelog: null,
        downloadUrl: null,
        reason: null
      }
    }

    return {
      allowed: true,
      currentVersion: input.currentVersion,
      latestVersion: latest.version,
      updateAvailable: true,
      mandatory: latest.isMandatory,
      changelog: latest.releaseNotes,
      downloadUrl: `/downloads/${latest.id}?licenseCode=${encodeURIComponent(license.code)}&deviceFingerprint=${encodeURIComponent(input.deviceFingerprint)}`,
      reason: null
    }
  })
}
