import { paginationQuerySchema, portalAdminResetPasswordSchema, portalLoginSchema, portalPasswordResetRequestSchema, portalRefreshSchema, portalRegisterSchema, portalUserCreateSchema, portalUserStatusSchema } from '@nexus/shared';
import { prisma } from '../../lib/prisma';
import { comparePassword, hashPassword } from '../../lib/password';
import { parseWithSchema } from '../../lib/validation';
import { AppError } from '../../lib/errors';
import { createAuditLog } from '../../lib/audit';
import { requireAdminAuth, requirePortalAuth } from '../../plugins/auth';
import { sha256, addDays, isExpired } from '../../lib/utils';
import { signPortalAccessToken, signPortalRefreshToken, verifyPortalRefreshToken } from '../../lib/jwt';
function mapPortalUser(user) {
    return {
        id: user.id,
        tenantId: user.tenantId,
        clientId: user.clientId,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        mustResetPassword: user.mustResetPassword,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        client: user.client
            ? {
                id: user.client.id,
                name: user.client.name,
                tradeName: user.client.tradeName,
                cpfCnpj: user.client.cpfCnpj
            }
            : undefined
    };
}
function isOperationalLicense(status, expiresAt) {
    return (status === 'ATIVA' || status === 'TESTE') && !isExpired(expiresAt);
}
async function createPortalSession(input) {
    const accessToken = signPortalAccessToken({
        sub: input.portalUserId,
        tenantId: input.tenantId,
        clientId: input.clientId,
        email: input.email,
        type: 'portal-access'
    });
    const refreshToken = signPortalRefreshToken({
        sub: input.portalUserId,
        tenantId: input.tenantId,
        clientId: input.clientId,
        type: 'portal-refresh'
    });
    await prisma.portalRefreshToken.create({
        data: {
            tenantId: input.tenantId,
            portalUserId: input.portalUserId,
            tokenHash: sha256(refreshToken),
            userAgent: input.userAgent ?? null,
            ipAddress: input.ipAddress ?? null,
            expiresAt: addDays(new Date(), 30)
        }
    });
    return { accessToken, refreshToken };
}
export async function portalRoutes(app) {
    app.post('/portal/auth/register', async (request) => {
        const input = parseWithSchema(portalRegisterSchema, request.body);
        const license = await prisma.license.findUnique({
            where: { code: input.licenseCode },
            include: { client: true, plan: true }
        });
        if (!license)
            throw new AppError('Licenca nao encontrada.', 404);
        const existingByEmail = await prisma.portalUser.findFirst({
            where: {
                tenantId: license.tenantId,
                email: input.email
            }
        });
        if (existingByEmail) {
            throw new AppError('Ja existe uma conta cadastrada com este e-mail.', 409);
        }
        const passwordHash = await hashPassword(input.password);
        const [client, portalUser] = await prisma.$transaction(async (tx) => {
            const updatedClient = await tx.client.update({
                where: { id: license.clientId },
                data: {
                    name: input.companyName,
                    tradeName: input.tradeName ?? license.client.tradeName,
                    cpfCnpj: input.cpfCnpj,
                    email: input.email,
                    phone: input.phone ?? license.client.phone,
                    address: input.address ?? license.client.address,
                    city: input.city ?? license.client.city,
                    state: input.state ?? license.client.state,
                    zipCode: input.zipCode ?? license.client.zipCode,
                    status: 'ATIVO'
                }
            });
            const createdPortalUser = await tx.portalUser.create({
                data: {
                    tenantId: license.tenantId,
                    clientId: updatedClient.id,
                    name: input.name,
                    email: input.email,
                    passwordHash,
                    isActive: true,
                    mustResetPassword: false
                },
                include: {
                    client: true
                }
            });
            return [updatedClient, createdPortalUser];
        });
        await createAuditLog({
            tenantId: license.tenantId,
            action: 'PORTAL_REGISTER',
            entityType: 'PORTAL_USER',
            entityId: portalUser.id,
            metadata: { clientId: client.id, email: portalUser.email, licenseCode: license.code }
        });
        return {
            success: true,
            user: mapPortalUser(portalUser),
            license: {
                code: license.code,
                enabledEditions: license.enabledEditions,
                planName: license.plan.name
            }
        };
    });
    app.post('/portal/auth/login', async (request) => {
        const input = parseWithSchema(portalLoginSchema, request.body);
        const portalUser = await prisma.portalUser.findFirst({
            where: { email: input.email },
            include: {
                client: {
                    include: {
                        licenses: {
                            include: { plan: true },
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        });
        if (!portalUser || !(await comparePassword(input.password, portalUser.passwordHash))) {
            throw new AppError('Email ou senha invalidos.', 401);
        }
        if (!portalUser.isActive) {
            throw new AppError('Conta do cliente inativa.', 403);
        }
        const linkedLicense = portalUser.client.licenses.find((license) => license.code === input.licenseCode);
        if (!linkedLicense) {
            throw new AppError('Esta conta nao esta vinculada a esta licenca.', 403);
        }
        if (!isOperationalLicense(linkedLicense.status, linkedLicense.expiresAt)) {
            throw new AppError('Licenca indisponivel para esta conta.', 403);
        }
        const tokens = await createPortalSession({
            portalUserId: portalUser.id,
            tenantId: portalUser.tenantId,
            clientId: portalUser.clientId,
            email: portalUser.email,
            userAgent: request.headers['user-agent'] || null,
            ipAddress: request.ip
        });
        await prisma.portalUser.update({
            where: { id: portalUser.id },
            data: { lastLoginAt: new Date() }
        });
        await createAuditLog({
            tenantId: portalUser.tenantId,
            action: 'PORTAL_LOGIN',
            entityType: 'PORTAL_USER',
            entityId: portalUser.id,
            metadata: { email: portalUser.email, licenseCode: linkedLicense.code, ip: request.ip }
        });
        return {
            ...tokens,
            user: {
                ...mapPortalUser(portalUser),
                license: {
                    code: linkedLicense.code,
                    status: linkedLicense.status,
                    planName: linkedLicense.plan.name,
                    enabledEditions: linkedLicense.enabledEditions,
                    expiresAt: linkedLicense.expiresAt?.toISOString() ?? null
                }
            }
        };
    });
    app.post('/portal/auth/refresh', async (request) => {
        const input = parseWithSchema(portalRefreshSchema, request.body);
        let payload;
        try {
            payload = verifyPortalRefreshToken(input.refreshToken);
        }
        catch {
            throw new AppError('Sessao do cliente invalida ou expirada.', 401);
        }
        const existing = await prisma.portalRefreshToken.findFirst({
            where: {
                portalUserId: payload.sub,
                tenantId: payload.tenantId,
                tokenHash: sha256(input.refreshToken),
                revokedAt: null,
                expiresAt: { gt: new Date() }
            },
            include: {
                portalUser: {
                    include: {
                        client: true
                    }
                }
            }
        });
        if (!existing || !existing.portalUser.isActive) {
            throw new AppError('Sessao do cliente invalida. Faca login novamente.', 401);
        }
        await prisma.portalRefreshToken.update({
            where: { id: existing.id },
            data: { revokedAt: new Date() }
        });
        const tokens = await createPortalSession({
            portalUserId: existing.portalUser.id,
            tenantId: existing.portalUser.tenantId,
            clientId: existing.portalUser.clientId,
            email: existing.portalUser.email,
            userAgent: request.headers['user-agent'] || null,
            ipAddress: request.ip
        });
        return {
            ...tokens,
            user: mapPortalUser(existing.portalUser)
        };
    });
    app.post('/portal/auth/logout', async (request) => {
        const input = parseWithSchema(portalRefreshSchema, request.body);
        await prisma.portalRefreshToken.updateMany({
            where: {
                tokenHash: sha256(input.refreshToken),
                revokedAt: null
            },
            data: { revokedAt: new Date() }
        });
        return { success: true };
    });
    app.get('/portal/auth/me', { preHandler: requirePortalAuth }, async (request) => {
        const portalUser = await prisma.portalUser.findUnique({
            where: { id: request.portalAuth.portalUserId },
            include: {
                client: {
                    include: {
                        licenses: {
                            include: { plan: true },
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        });
        if (!portalUser || !portalUser.isActive) {
            throw new AppError('Conta do cliente nao encontrada.', 404);
        }
        return {
            user: {
                ...mapPortalUser(portalUser),
                licenses: portalUser.client.licenses.map((license) => ({
                    code: license.code,
                    status: license.status,
                    expiresAt: license.expiresAt?.toISOString() ?? null,
                    planName: license.plan.name,
                    enabledEditions: license.enabledEditions
                }))
            }
        };
    });
    app.post('/portal/auth/request-reset', async (request) => {
        const input = parseWithSchema(portalPasswordResetRequestSchema, request.body);
        const portalUser = await prisma.portalUser.findFirst({
            where: { email: input.email }
        });
        if (portalUser) {
            const token = sha256(`${portalUser.id}:${Date.now()}:${Math.random()}`);
            await prisma.portalPasswordResetToken.create({
                data: {
                    tenantId: portalUser.tenantId,
                    portalUserId: portalUser.id,
                    tokenHash: token,
                    expiresAt: addDays(new Date(), 1)
                }
            });
        }
        return {
            success: true,
            message: 'Solicitacao registrada. Use o painel admin para concluir o reset de senha.'
        };
    });
    app.get('/portal/users', { preHandler: requireAdminAuth }, async (request) => {
        const query = parseWithSchema(paginationQuerySchema, request.query);
        const where = {
            tenantId: request.auth.tenantId,
            ...(query.status
                ? {
                    isActive: query.status === 'ATIVO'
                }
                : {}),
            ...(query.search
                ? {
                    OR: [
                        { name: { contains: query.search, mode: 'insensitive' } },
                        { email: { contains: query.search, mode: 'insensitive' } },
                        { client: { name: { contains: query.search, mode: 'insensitive' } } },
                        { client: { tradeName: { contains: query.search, mode: 'insensitive' } } }
                    ]
                }
                : {})
        };
        const [items, total] = await Promise.all([
            prisma.portalUser.findMany({
                where,
                include: {
                    client: true
                },
                orderBy: { createdAt: 'desc' },
                skip: (query.page - 1) * query.pageSize,
                take: query.pageSize
            }),
            prisma.portalUser.count({ where })
        ]);
        return {
            items: items.map(mapPortalUser),
            total,
            page: query.page,
            pageSize: query.pageSize
        };
    });
    app.post('/portal/users', { preHandler: requireAdminAuth }, async (request) => {
        const input = parseWithSchema(portalUserCreateSchema, request.body);
        const client = await prisma.client.findFirst({
            where: {
                id: input.clientId,
                tenantId: request.auth.tenantId
            }
        });
        if (!client)
            throw new AppError('Cliente nao encontrado.', 404);
        const existing = await prisma.portalUser.findFirst({
            where: {
                tenantId: request.auth.tenantId,
                email: input.email
            }
        });
        if (existing)
            throw new AppError('Ja existe um acesso com este e-mail.', 409);
        const item = await prisma.portalUser.create({
            data: {
                tenantId: request.auth.tenantId,
                clientId: input.clientId,
                name: input.name,
                email: input.email,
                passwordHash: await hashPassword(input.password),
                isActive: input.isActive,
                mustResetPassword: input.mustResetPassword
            },
            include: { client: true }
        });
        await createAuditLog({
            tenantId: request.auth.tenantId,
            adminUserId: request.auth.adminUserId,
            action: 'PORTAL_USER_CREATE',
            entityType: 'PORTAL_USER',
            entityId: item.id,
            metadata: { email: item.email, clientId: item.clientId }
        });
        return mapPortalUser(item);
    });
    app.post('/portal/users/:id/reset-password', { preHandler: requireAdminAuth }, async (request) => {
        const { id } = request.params;
        const input = parseWithSchema(portalAdminResetPasswordSchema, request.body);
        const existing = await prisma.portalUser.findFirst({
            where: { id, tenantId: request.auth.tenantId }
        });
        if (!existing)
            throw new AppError('Conta do cliente nao encontrada.', 404);
        await prisma.portalUser.update({
            where: { id: existing.id },
            data: {
                passwordHash: await hashPassword(input.password),
                mustResetPassword: false
            }
        });
        await createAuditLog({
            tenantId: request.auth.tenantId,
            adminUserId: request.auth.adminUserId,
            action: 'PORTAL_USER_RESET_PASSWORD',
            entityType: 'PORTAL_USER',
            entityId: existing.id,
            metadata: { email: existing.email }
        });
        return { success: true };
    });
    app.post('/portal/users/:id/status', { preHandler: requireAdminAuth }, async (request) => {
        const { id } = request.params;
        const input = parseWithSchema(portalUserStatusSchema, request.body);
        const existing = await prisma.portalUser.findFirst({
            where: { id, tenantId: request.auth.tenantId }
        });
        if (!existing)
            throw new AppError('Conta do cliente nao encontrada.', 404);
        const item = await prisma.portalUser.update({
            where: { id: existing.id },
            data: {
                isActive: input.isActive,
                mustResetPassword: input.mustResetPassword
            },
            include: { client: true }
        });
        await createAuditLog({
            tenantId: request.auth.tenantId,
            adminUserId: request.auth.adminUserId,
            action: 'PORTAL_USER_STATUS',
            entityType: 'PORTAL_USER',
            entityId: item.id,
            metadata: { email: item.email, isActive: item.isActive, mustResetPassword: item.mustResetPassword }
        });
        return mapPortalUser(item);
    });
}
