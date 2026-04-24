import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Prisma, ReleaseChannel } from '@prisma/client';

import { appVersionSchema, paginationQuerySchema } from '@nexus/shared';
import { prisma } from '../../lib/prisma.js';
import { parseWithSchema } from '../../lib/validation.js';
import { requireAdminAuth } from '../../plugins/auth.js';
import { AppError } from '../../lib/errors.js';
import { createAuditLog } from '../../lib/audit.js';
import { storeUpdateFile } from '../../lib/storage.js';
import { safeJsonParse, isExpired } from '../../lib/utils.js';

type AuthData = {
  tenantId: string;
  adminUserId?: string;
};

type AuthenticatedRequest = FastifyRequest & {
  auth: AuthData;
};

type ParamsId = {
  id: string;
};

type ParamsVersionId = {
  versionId: string;
};

type LatestQuery = {
  channel?: ReleaseChannel;
  tenantId?: string;
};

type DownloadQuery = {
  licenseCode?: string;
  deviceFingerprint?: string;
  tenantId?: string;
};

type StoredUpdateFile = {
  fileName: string;
  filePath: string;
  checksum: string;
  fileSize: number;
};

function parseBooleanValue(input: unknown, fallback = false): boolean {
  if (input == null) return fallback;
  const value = String(input);
  return value === 'true' || value === '1';
}

function parseReleaseChannel(value: unknown): ReleaseChannel {
  const channel = String(value || ReleaseChannel.STABLE).toUpperCase();

  if (channel in ReleaseChannel) {
    return ReleaseChannel[channel as keyof typeof ReleaseChannel];
  }

  return ReleaseChannel.STABLE;
}

function isOperational(status: string): boolean {
  return status === 'ATIVA' || status === 'TESTE';
}

export async function updateRoutes(app: FastifyInstance): Promise<void> {
  app.get('/updates', { preHandler: requireAdminAuth }, async (request: FastifyRequest) => {
    const authRequest = request as AuthenticatedRequest;
    const query = parseWithSchema(paginationQuerySchema, request.query);

    const where: Prisma.AppVersionWhereInput = {
      tenantId: authRequest.auth.tenantId,
      ...(query.search
        ? {
            OR: [
              {
                version: {
                  contains: query.search,
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                releaseNotes: {
                  contains: query.search,
                  mode: Prisma.QueryMode.insensitive
                }
              }
            ]
          }
        : {})
    };

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
    ]);

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize
    };
  });

  app.get('/updates/:id', { preHandler: requireAdminAuth }, async (request: FastifyRequest) => {
    const authRequest = request as AuthenticatedRequest;
    const { id } = request.params as ParamsId;

    const item = await prisma.appVersion.findFirst({
      where: {
        id,
        tenantId: authRequest.auth.tenantId
      },
      include: {
        licensePermissions: {
          include: {
            license: true
          }
        },
        planPermissions: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!item) {
      throw new AppError('Versao nao encontrada.', 404);
    }

    return item;
  });

  app.get('/updates/latest', async (request: FastifyRequest) => {
    const query = request.query as LatestQuery;
    const authRequest = request as Partial<AuthenticatedRequest>;

    const channel = parseReleaseChannel(query.channel);
    const tenantId = authRequest.auth?.tenantId || query.tenantId;

    if (!tenantId) {
      throw new AppError('Acesso nao autorizado. Tenant ID ausente.', 401);
    }

    const item = await prisma.appVersion.findFirst({
      where: {
        tenantId,
        releaseChannel: channel,
        isActive: true
      },
      orderBy: [{ buildNumber: 'desc' }, { createdAt: 'desc' }]
    });

    return { item };
  });

  app.post('/updates', { preHandler: requireAdminAuth }, async (request: FastifyRequest) => {
    const authRequest = request as AuthenticatedRequest;
    const parts = request.parts();

    let version = '';
    let buildNumber = '1';
    let releaseNotes = '';
    let releaseChannel: ReleaseChannel = ReleaseChannel.STABLE;
    let isMandatory = false;
    let isActive = true;
    let allowAllActiveLicenses = true;
    let targetPlanIds: string[] = [];
    let targetLicenseIds: string[] = [];
    let storedFile: StoredUpdateFile | null = null;

    for await (const part of parts) {
      if (part.type === 'file') {
        if (storedFile) {
          part.file.resume();
          throw new AppError('Envie apenas um arquivo por atualizacao.', 400);
        }

        if (!version.trim()) {
          part.file.resume();
          throw new AppError('Informe a versao antes de anexar o arquivo.', 400);
        }

        storedFile = await storeUpdateFile(part, version.trim());
        continue;
      }

      if (part.fieldname === 'version') {
        version = String(part.value || '');
      }

      if (part.fieldname === 'buildNumber') {
        buildNumber = String(part.value || '1');
      }

      if (part.fieldname === 'releaseNotes') {
        releaseNotes = String(part.value || '');
      }

      if (part.fieldname === 'releaseChannel') {
        releaseChannel = parseReleaseChannel(part.value);
      }

      if (part.fieldname === 'isMandatory') {
        isMandatory = parseBooleanValue(part.value);
      }

      if (part.fieldname === 'isActive') {
        isActive = parseBooleanValue(part.value, true);
      }

      if (part.fieldname === 'allowAllActiveLicenses') {
        allowAllActiveLicenses = parseBooleanValue(part.value, true);
      }

      if (part.fieldname === 'targetPlanIds') {
        targetPlanIds = safeJsonParse<string[]>(String(part.value || '[]'), []);
      }

      if (part.fieldname === 'targetLicenseIds') {
        targetLicenseIds = safeJsonParse<string[]>(String(part.value || '[]'), []);
      }
    }

    if (!storedFile) {
      throw new AppError('Arquivo da atualizacao obrigatorio.', 400);
    }

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
    });

    try {
      const item = await prisma.$transaction(async (tx) => {
        const created = await tx.appVersion.create({
          data: {
            tenantId: authRequest.auth.tenantId,
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
        });

        if (input.targetPlanIds.length > 0) {
          await tx.appVersionPlanPermission.createMany({
            data: input.targetPlanIds.map((planId: string) => ({
              appVersionId: created.id,
              planId
            }))
          });
        }

        if (input.targetLicenseIds.length > 0) {
          await tx.appVersionLicensePermission.createMany({
            data: input.targetLicenseIds.map((licenseId: string) => ({
              appVersionId: created.id,
              licenseId
            }))
          });
        }

        return created;
      });

      await createAuditLog({
        tenantId: authRequest.auth.tenantId,
        adminUserId: authRequest.auth.adminUserId,
        action: 'APP_VERSION_CREATE',
        entityType: 'APP_VERSION',
        entityId: item.id,
        metadata: {
          version: item.version,
          buildNumber: item.buildNumber
        }
      });

      return item;
    } catch (error) {
      if (storedFile.filePath && fs.existsSync(storedFile.filePath)) {
        fs.rmSync(storedFile.filePath, { force: true });
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Ja existe uma atualizacao com esta versao, build e canal.', 409);
      }

      throw error;
    }
  });

  app.put('/updates/:id', { preHandler: requireAdminAuth }, async (request: FastifyRequest) => {
    const authRequest = request as AuthenticatedRequest;
    const { id } = request.params as ParamsId;
    const input = parseWithSchema(appVersionSchema, request.body);

    const existing = await prisma.appVersion.findFirst({
      where: {
        id,
        tenantId: authRequest.auth.tenantId
      }
    });

    if (!existing) {
      throw new AppError('Versao nao encontrada.', 404);
    }

    const item = await prisma.$transaction(async (tx) => {
      await tx.appVersionPlanPermission.deleteMany({
        where: {
          appVersionId: existing.id
        }
      });

      await tx.appVersionLicensePermission.deleteMany({
        where: {
          appVersionId: existing.id
        }
      });

      const updated = await tx.appVersion.update({
        where: {
          id: existing.id
        },
        data: {
          version: input.version,
          buildNumber: input.buildNumber,
          releaseNotes: input.releaseNotes,
          releaseChannel: input.releaseChannel,
          isMandatory: input.isMandatory,
          isActive: input.isActive,
          allowAllActiveLicenses: input.allowAllActiveLicenses
        }
      });

      if (input.targetPlanIds.length > 0) {
        await tx.appVersionPlanPermission.createMany({
          data: input.targetPlanIds.map((planId: string) => ({
            appVersionId: existing.id,
            planId
          }))
        });
      }

      if (input.targetLicenseIds.length > 0) {
        await tx.appVersionLicensePermission.createMany({
          data: input.targetLicenseIds.map((licenseId: string) => ({
            appVersionId: existing.id,
            licenseId
          }))
        });
      }

      return updated;
    });

    await createAuditLog({
      tenantId: authRequest.auth.tenantId,
      adminUserId: authRequest.auth.adminUserId,
      action: 'APP_VERSION_UPDATE',
      entityType: 'APP_VERSION',
      entityId: item.id,
      metadata: {
        version: item.version,
        buildNumber: item.buildNumber
      }
    });

    return item;
  });

  app.delete('/updates/:id', { preHandler: requireAdminAuth }, async (request: FastifyRequest) => {
    const authRequest = request as AuthenticatedRequest;
    const { id } = request.params as ParamsId;

    const existing = await prisma.appVersion.findFirst({
      where: {
        id,
        tenantId: authRequest.auth.tenantId
      }
    });

    if (!existing) {
      throw new AppError('Versao nao encontrada.', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.appVersionLicensePermission.deleteMany({
        where: {
          appVersionId: existing.id
        }
      });

      await tx.appVersionPlanPermission.deleteMany({
        where: {
          appVersionId: existing.id
        }
      });

      await tx.appVersion.delete({
        where: {
          id: existing.id
        }
      });
    });

    try {
      if (existing.filePath && fs.existsSync(existing.filePath)) {
        fs.rmSync(existing.filePath, { force: true });
      }
    } catch {
      // Nao bloqueia a exclusao do registro se o arquivo ja nao existir.
    }

    await createAuditLog({
      tenantId: authRequest.auth.tenantId,
      adminUserId: authRequest.auth.adminUserId,
      action: 'APP_VERSION_DELETE',
      entityType: 'APP_VERSION',
      entityId: existing.id,
      metadata: {
        version: existing.version,
        buildNumber: existing.buildNumber
      }
    });

    return { success: true };
  });

  app.get('/downloads/:versionId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { versionId } = request.params as ParamsVersionId;
    const query = request.query as DownloadQuery;

    if (!query.licenseCode || !query.deviceFingerprint) {
      throw new AppError('Licenca e dispositivo sao obrigatorios para download.', 400);
    }

    const [version, license] = await Promise.all([
      prisma.appVersion.findUnique({
        where: {
          id: versionId
        },
        include: {
          licensePermissions: true,
          planPermissions: true
        }
      }),
      prisma.license.findUnique({
        where: {
          code: query.licenseCode
        },
        include: {
          deviceActivations: true
        }
      })
    ]);

    if (!version || !license) {
      throw new AppError('Versao ou licenca nao encontrada.', 404);
    }

    const hasActiveDevice = license.deviceActivations.some(
      (item) => item.deviceFingerprint === query.deviceFingerprint && item.isActive
    );

    if (!license.canUpdate || !hasActiveDevice) {
      throw new AppError('Licenca sem permissao de download.', 403);
    }

    if (!isOperational(license.status) || isExpired(license.expiresAt)) {
      throw new AppError('Licenca indisponivel para download.', 403);
    }

    const isAllowed =
      version.allowAllActiveLicenses ||
      version.licensePermissions.some((item) => item.licenseId === license.id) ||
      version.planPermissions.some((item) => item.planId === license.planId);

    if (!isAllowed) {
      throw new AppError('Esta licenca nao possui acesso a esta versao.', 403);
    }

    if (!fs.existsSync(version.filePath)) {
      throw new AppError('Arquivo da atualizacao nao encontrado.', 404);
    }

    const stats = fs.statSync(version.filePath);
    const downloadName = path.basename(version.fileName || version.filePath);

    reply.header('Content-Type', 'application/octet-stream');
    reply.header('Content-Length', String(stats.size));
    reply.header('Content-Disposition', `attachment; filename="${downloadName}"`);

    return reply.send(fs.createReadStream(version.filePath));
  });

  app.get('/public/downloads/:versionId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { versionId } = request.params as ParamsVersionId;
    const query = request.query as DownloadQuery;
    const authRequest = request as Partial<AuthenticatedRequest>;

    const tenantId = authRequest.auth?.tenantId || query.tenantId;

    const version = await prisma.appVersion.findFirst({
      where: {
        id: versionId,
        isActive: true,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!version) {
      throw new AppError('Versao publica nao encontrada.', 404);
    }

    if (!fs.existsSync(version.filePath)) {
      throw new AppError('Arquivo da versao nao encontrado.', 404);
    }

    const stats = fs.statSync(version.filePath);
    const downloadName = path.basename(version.fileName || version.filePath);

    reply.header('Content-Type', 'application/octet-stream');
    reply.header('Content-Length', String(stats.size));
    reply.header('Content-Disposition', `attachment; filename="${downloadName}"`);

    return reply.send(fs.createReadStream(version.filePath));
  });
}
