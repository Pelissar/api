import fs from 'node:fs'
import path from 'node:path'
import type { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { appVersionSchema, paginationQuerySchema } from '@nexus/shared'
import { prisma } from '../../lib/prisma'
import { parseWithSchema } from '../../lib/validation'
import { requireAdminAuth } from '../../plugins/auth'
import { AppError } from '../../lib/errors'
import { createAuditLog } from '../../lib/audit'
import { storeUpdateFile } from '../../lib/storage'
import { safeJsonParse, isExpired } from '../../lib/utils'

function parseBooleanValue(input: string | undefined, fallback = false) {
  if (input == null) return fallback
  return input === 'true' || input === '1'
}

export async function updateRoutes(app: FastifyInstance) {
  app.get('/updates', { preHandler: requireAdminAuth }, async (request) => {
    const query = parseWithSchema(paginationQuerySchema, request.query)
    const where = {
      tenantId: request.auth!.tenantId,
      ...(query.search
        ? {
            OR: [
              { version: { contains: query.search, mode: 'insensitive' as const } },
              { releaseNotes: { contains: query.search, mode: 'insensitive' as const } }
            ]
          }
        : {})
    }

    const [items, total] = await Promise.all([
      prisma.appVersion.findMany({
        where,
        include: {
          licensePermissions: true,
          planPermissions: true
        },
        orderBy: [{ buildNumber: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      prisma.appVersion.count({ where })
    ])

    return { items, total, page: query.page, pageSize: query.pageSize }
  })

  app.get('/updates/:id', { preHandler: requireAdminAuth }, async (request) => {
    const { id } = request.params as { id: string }
    const item = await prisma.appVersion.findFirst({
      where: { id, tenantId: request.auth!.tenantId },
      include: {
        licensePermissions: { include: { license: true } },
        planPermissions: { include: { plan: true } }
      }
    })
    if (!item) throw new AppError('Versao nao encontrada.', 404)
    return item
  })

  app.get('/updates/latest', { preHandler: requireAdminAuth }, async (request) => {
    const channel = String((request.query as { channel?: string })?.channel || 'STABLE')
    const item = await prisma.appVersion.findFirst({
      where: {
        tenantId: request.auth!.tenantId,
        releaseChannel: channel as any,
        isActive: true
      },
      orderBy: [{ buildNumber: 'desc' }, { createdAt: 'desc' }]
    })
    return { item }
  })

  app.post('/updates', { preHandler: requireAdminAuth }, async (request) => {
    const parts = request.parts()
    let version = ''
    let buildNumber = '1'
    let releaseNotes = ''
    let releaseChannel = 'STABLE'
    let isMandatory = false
    let isActive = true
    let allowAllActiveLicenses = true
    let targetPlanIds: string[] = []
    let targetLicenseIds: string[] = []
    let storedFile: Awaited<ReturnType<typeof storeUpdateFile>> | null = null

    for await (const part of parts) {
      if (part.type === 'file') {
        if (storedFile) {
          part.file.resume()
          throw new AppError('Envie apenas um arquivo por atualizacao.', 400)
        }
        if (!version.trim()) {
          part.file.resume()
          throw new AppError('Informe a versao antes de anexar o arquivo.', 400)
        }
        storedFile = await storeUpdateFile(part, version.trim())
        continue
      }

      if (part.fieldname === 'version') version = String(part.value || '')
      if (part.fieldname === 'buildNumber') buildNumber = String(part.value || '1')
      if (part.fieldname === 'releaseNotes') releaseNotes = String(part.value || '')
      if (part.fieldname === 'releaseChannel') releaseChannel = String(part.value || 'STABLE')
      if (part.fieldname === 'isMandatory') isMandatory = parseBooleanValue(String(part.value || 'false'))
      if (part.fieldname === 'isActive') isActive = parseBooleanValue(String(part.value || 'true'), true)
      if (part.fieldname === 'allowAllActiveLicenses') allowAllActiveLicenses = parseBooleanValue(String(part.value || 'true'), true)
      if (part.fieldname === 'targetPlanIds') targetPlanIds = safeJsonParse(String(part.value || '[]'), [])
      if (part.fieldname === 'targetLicenseIds') targetLicenseIds = safeJsonParse(String(part.value || '[]'), [])
    }

    if (!storedFile) throw new AppError('Arquivo da atualizacao obrigatorio.', 400)

    const input = parseWithSchema(appVersionSchema, {
      version,
      buildNumber,
      releaseNotes,
      releaseChannel,
      isMandatory,
      isActive,
      allowAllActiveLicenses,
      targetPlanIds,
      targetLicenseIds
    })

    try {
      const item = await prisma.$transaction(async (tx) => {
        const created = await tx.appVersion.create({
          data: {
            tenantId: request.auth!.tenantId,
            version: input.version,
            buildNumber: input.buildNumber,
            releaseNotes: input.releaseNotes,
            fileName: storedFile.fileName,
            filePath: storedFile.filePath,
            checksum: storedFile.checksum,
            fileSize: storedFile.fileSize,
            releaseChannel: input.releaseChannel,
            isMandatory: input.isMandatory,
            isActive: input.isActive,
            allowAllActiveLicenses: input.allowAllActiveLicenses
          }
        })

        if (input.targetPlanIds.length > 0) {
          await tx.appVersionPlanPermission.createMany({
            data: input.targetPlanIds.map((planId) => ({
              appVersionId: created.id,
              planId
            }))
          })
        }

        if (input.targetLicenseIds.length > 0) {
          await tx.appVersionLicensePermission.createMany({
            data: input.targetLicenseIds.map((licenseId) => ({
              appVersionId: created.id,
              licenseId
            }))
          })
        }

        return created
      })

      await createAuditLog({
        tenantId: request.auth!.tenantId,
        adminUserId: request.auth!.adminUserId,
        action: 'APP_VERSION_CREATE',
        entityType: 'APP_VERSION',
        entityId: item.id,
        metadata: { version: item.version, buildNumber: item.buildNumber }
      })

      return item
    } catch (error) {
      if (storedFile.filePath && fs.existsSync(storedFile.filePath)) {
        fs.rmSync(storedFile.filePath, { force: true })
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Ja existe uma atualizacao com esta versao, build e canal.', 409)
      }

      throw error
    }
  })

  app.put('/updates/:id', { preHandler: requireAdminAuth }, async (request) => {
    const { id } = request.params as { id: string }
    const input = parseWithSchema(appVersionSchema, request.body)
    const existing = await prisma.appVersion.findFirst({
      where: { id, tenantId: request.auth!.tenantId }
    })
    if (!existing) throw new AppError('Versao nao encontrada.', 404)

    const item = await prisma.$transaction(async (tx) => {
      await tx.appVersionPlanPermission.deleteMany({ where: { appVersionId: existing.id } })
      await tx.appVersionLicensePermission.deleteMany({ where: { appVersionId: existing.id } })

      const updated = await tx.appVersion.update({
        where: { id: existing.id },
        data: {
          version: input.version,
          buildNumber: input.buildNumber,
          releaseNotes: input.releaseNotes,
          releaseChannel: input.releaseChannel,
          isMandatory: input.isMandatory,
          isActive: input.isActive,
          allowAllActiveLicenses: input.allowAllActiveLicenses
        }
      })

      if (input.targetPlanIds.length > 0) {
        await tx.appVersionPlanPermission.createMany({
          data: input.targetPlanIds.map((planId) => ({
            appVersionId: existing.id,
            planId
          }))
        })
      }

      if (input.targetLicenseIds.length > 0) {
        await tx.appVersionLicensePermission.createMany({
          data: input.targetLicenseIds.map((licenseId) => ({
            appVersionId: existing.id,
            licenseId
          }))
        })
      }

      return updated
    })

    await createAuditLog({
      tenantId: request.auth!.tenantId,
      adminUserId: request.auth!.adminUserId,
      action: 'APP_VERSION_UPDATE',
      entityType: 'APP_VERSION',
      entityId: item.id,
      metadata: { version: item.version, buildNumber: item.buildNumber }
    })

    return item
  })

  app.delete('/updates/:id', { preHandler: requireAdminAuth }, async (request) => {
    const { id } = request.params as { id: string }
    const existing = await prisma.appVersion.findFirst({
      where: { id, tenantId: request.auth!.tenantId }
    })
    if (!existing) throw new AppError('Versao nao encontrada.', 404)

    await prisma.$transaction(async (tx) => {
      await tx.appVersionLicensePermission.deleteMany({
        where: { appVersionId: existing.id }
      })
      await tx.appVersionPlanPermission.deleteMany({
        where: { appVersionId: existing.id }
      })
      await tx.appVersion.delete({ where: { id: existing.id } })
    })

    try {
      if (existing.filePath && fs.existsSync(existing.filePath)) {
        fs.rmSync(existing.filePath, { force: true })
      }
    } catch {
      // nao bloqueia a exclusao do registro se o arquivo ja nao existir ou estiver indisponivel
    }

    await createAuditLog({
      tenantId: request.auth!.tenantId,
      adminUserId: request.auth!.adminUserId,
      action: 'APP_VERSION_DELETE',
      entityType: 'APP_VERSION',
      entityId: existing.id,
      metadata: { version: existing.version, buildNumber: existing.buildNumber }
    })

    return { success: true }
  })

  app.get('/downloads/:versionId', async (request, reply) => {
    const { versionId } = request.params as { versionId: string }
    const query = request.query as { licenseCode?: string; deviceFingerprint?: string }
    if (!query.licenseCode || !query.deviceFingerprint) {
      throw new AppError('Licenca e dispositivo sao obrigatorios para download.', 400)
    }

    const [version, license] = await Promise.all([
      prisma.appVersion.findUnique({
        where: { id: versionId },
        include: {
          licensePermissions: true,
          planPermissions: true
        }
      }),
      prisma.license.findUnique({
        where: { code: query.licenseCode },
        include: { deviceActivations: true }
      })
    ])

    if (!version || !license) throw new AppError('Versao ou licenca nao encontrada.', 404)
    if (!license.canUpdate || !license.deviceActivations.some((item) => item.deviceFingerprint === query.deviceFingerprint && item.isActive)) {
      throw new AppError('Licenca sem permissao de download.', 403)
    }
    if (!isOperational(license.status) || isExpired(license.expiresAt)) {
      throw new AppError('Licenca indisponivel para download.', 403)
    }

    const isAllowed =
      version.allowAllActiveLicenses ||
      version.licensePermissions.some((item) => item.licenseId === license.id) ||
      version.planPermissions.some((item) => item.planId === license.planId)

    if (!isAllowed) {
      throw new AppError('Esta licenca nao possui acesso a esta versao.', 403)
    }
    if (!fs.existsSync(version.filePath)) {
      throw new AppError('Arquivo da atualizacao nao encontrado.', 404)
    }
    const stats = fs.statSync(version.filePath)
    const downloadName = path.basename(version.fileName || version.filePath)

    reply.header('Content-Type', 'application/octet-stream')
    reply.header('Content-Length', String(stats.size))
    reply.header('Content-Disposition', `attachment; filename=\"${downloadName}\"`)

    return reply.send(fs.createReadStream(version.filePath))
  })
}

function isOperational(status: string) {
  return status === 'ATIVA' || status === 'TESTE'
}
