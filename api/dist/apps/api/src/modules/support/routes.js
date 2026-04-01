import { paginationQuerySchema, supportTicketCreateSchema, supportTicketReplySchema, supportTicketStatusSchema } from '@nexus/shared';
import { prisma } from '../../lib/prisma';
import { parseWithSchema } from '../../lib/validation';
import { requireAdminAuth, requirePortalAuth } from '../../plugins/auth';
import { AppError } from '../../lib/errors';
import { createAuditLog } from '../../lib/audit';
function ensureTicketIsNotClosed(status) {
    if (status === 'FECHADO') {
        throw new AppError('Este ticket foi fechado e nao pode mais receber novas mensagens ou ser reaberto.', 409);
    }
}
function mapSupportTicket(item) {
    return {
        id: item.id,
        tenantId: item.tenantId,
        clientId: item.clientId,
        portalUserId: item.portalUserId ?? null,
        subject: item.subject,
        category: item.category ?? null,
        status: item.status,
        priority: item.priority,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        closedAt: item.closedAt?.toISOString() ?? null,
        client: item.client
            ? {
                id: item.client.id,
                name: item.client.name,
                tradeName: item.client.tradeName,
                cpfCnpj: item.client.cpfCnpj
            }
            : undefined,
        portalUser: item.portalUser
            ? {
                id: item.portalUser.id,
                name: item.portalUser.name,
                email: item.portalUser.email
            }
            : null,
        messages: Array.isArray(item.messages)
            ? item.messages.map((message) => ({
                id: message.id,
                ticketId: message.ticketId,
                senderType: message.senderType,
                message: message.message,
                createdAt: message.createdAt.toISOString(),
                adminUser: message.adminUser
                    ? {
                        id: message.adminUser.id,
                        name: message.adminUser.name,
                        email: message.adminUser.email
                    }
                    : null,
                portalUser: message.portalUser
                    ? {
                        id: message.portalUser.id,
                        name: message.portalUser.name,
                        email: message.portalUser.email
                    }
                    : null
            }))
            : undefined
    };
}
export async function supportRoutes(app) {
    app.get('/support/tickets', { preHandler: requireAdminAuth }, async (request) => {
        const query = parseWithSchema(paginationQuerySchema, request.query);
        const where = {
            tenantId: request.auth.tenantId,
            ...(query.status ? { status: query.status } : {}),
            ...(query.search
                ? {
                    OR: [
                        { subject: { contains: query.search, mode: 'insensitive' } },
                        { client: { name: { contains: query.search, mode: 'insensitive' } } },
                        { portalUser: { email: { contains: query.search, mode: 'insensitive' } } }
                    ]
                }
                : {})
        };
        const [items, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                include: {
                    client: true,
                    portalUser: true,
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' }
                    }
                },
                orderBy: { updatedAt: 'desc' },
                skip: (query.page - 1) * query.pageSize,
                take: query.pageSize
            }),
            prisma.supportTicket.count({ where })
        ]);
        return {
            items: items.map(mapSupportTicket),
            total,
            page: query.page,
            pageSize: query.pageSize
        };
    });
    app.get('/support/tickets/:id', { preHandler: requireAdminAuth }, async (request) => {
        const { id } = request.params;
        const item = await prisma.supportTicket.findFirst({
            where: { id, tenantId: request.auth.tenantId },
            include: {
                client: true,
                portalUser: true,
                messages: {
                    include: {
                        adminUser: true,
                        portalUser: true
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!item)
            throw new AppError('Ticket nao encontrado.', 404);
        return mapSupportTicket(item);
    });
    app.post('/support/tickets/:id/reply', { preHandler: requireAdminAuth }, async (request) => {
        const { id } = request.params;
        const input = parseWithSchema(supportTicketReplySchema, request.body);
        const existing = await prisma.supportTicket.findFirst({
            where: { id, tenantId: request.auth.tenantId }
        });
        if (!existing)
            throw new AppError('Ticket nao encontrado.', 404);
        ensureTicketIsNotClosed(existing.status);
        await prisma.$transaction([
            prisma.supportTicket.update({
                where: { id: existing.id },
                data: {
                    status: 'AGUARDANDO_CLIENTE'
                }
            }),
            prisma.supportTicketMessage.create({
                data: {
                    ticketId: existing.id,
                    senderType: 'ADMIN',
                    adminUserId: request.auth.adminUserId,
                    message: input.message
                }
            })
        ]);
        await createAuditLog({
            tenantId: request.auth.tenantId,
            adminUserId: request.auth.adminUserId,
            action: 'SUPPORT_TICKET_REPLY',
            entityType: 'SUPPORT_TICKET',
            entityId: existing.id,
            metadata: { status: 'AGUARDANDO_CLIENTE' }
        });
        return { success: true };
    });
    app.post('/support/tickets/:id/status', { preHandler: requireAdminAuth }, async (request) => {
        const { id } = request.params;
        const input = parseWithSchema(supportTicketStatusSchema, request.body);
        const existing = await prisma.supportTicket.findFirst({
            where: { id, tenantId: request.auth.tenantId }
        });
        if (!existing)
            throw new AppError('Ticket nao encontrado.', 404);
        if (existing.status === 'FECHADO' && input.status !== 'FECHADO') {
            throw new AppError('Ticket fechado nao pode ser reaberto.', 409);
        }
        const item = await prisma.supportTicket.update({
            where: { id: existing.id },
            data: {
                status: input.status,
                closedAt: input.status === 'FECHADO' || input.status === 'RESOLVIDO' ? new Date() : null
            }
        });
        await createAuditLog({
            tenantId: request.auth.tenantId,
            adminUserId: request.auth.adminUserId,
            action: 'SUPPORT_TICKET_STATUS',
            entityType: 'SUPPORT_TICKET',
            entityId: item.id,
            metadata: { status: item.status }
        });
        return { success: true };
    });
    app.get('/portal/tickets', { preHandler: requirePortalAuth }, async (request) => {
        const items = await prisma.supportTicket.findMany({
            where: {
                tenantId: request.portalAuth.tenantId,
                clientId: request.portalAuth.clientId
            },
            include: {
                client: true,
                portalUser: true,
                messages: {
                    include: {
                        adminUser: true,
                        portalUser: true
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        return { items: items.map(mapSupportTicket) };
    });
    app.post('/portal/tickets', { preHandler: requirePortalAuth }, async (request) => {
        const input = parseWithSchema(supportTicketCreateSchema, request.body);
        const item = await prisma.supportTicket.create({
            data: {
                tenantId: request.portalAuth.tenantId,
                clientId: request.portalAuth.clientId,
                portalUserId: request.portalAuth.portalUserId,
                subject: input.subject,
                category: input.category ?? null,
                priority: input.priority,
                messages: {
                    create: {
                        senderType: 'CLIENTE',
                        portalUserId: request.portalAuth.portalUserId,
                        message: input.message
                    }
                }
            },
            include: {
                client: true,
                portalUser: true,
                messages: {
                    include: {
                        adminUser: true,
                        portalUser: true
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        return mapSupportTicket(item);
    });
    app.get('/portal/tickets/:id', { preHandler: requirePortalAuth }, async (request) => {
        const { id } = request.params;
        const item = await prisma.supportTicket.findFirst({
            where: {
                id,
                tenantId: request.portalAuth.tenantId,
                clientId: request.portalAuth.clientId
            },
            include: {
                client: true,
                portalUser: true,
                messages: {
                    include: {
                        adminUser: true,
                        portalUser: true
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!item)
            throw new AppError('Ticket nao encontrado.', 404);
        return mapSupportTicket(item);
    });
    app.post('/portal/tickets/:id/messages', { preHandler: requirePortalAuth }, async (request) => {
        const { id } = request.params;
        const input = parseWithSchema(supportTicketReplySchema, request.body);
        const ticket = await prisma.supportTicket.findFirst({
            where: {
                id,
                tenantId: request.portalAuth.tenantId,
                clientId: request.portalAuth.clientId
            }
        });
        if (!ticket)
            throw new AppError('Ticket nao encontrado.', 404);
        ensureTicketIsNotClosed(ticket.status);
        await prisma.$transaction([
            prisma.supportTicket.update({
                where: { id: ticket.id },
                data: {
                    status: 'EM_ATENDIMENTO',
                    closedAt: null
                }
            }),
            prisma.supportTicketMessage.create({
                data: {
                    ticketId: ticket.id,
                    senderType: 'CLIENTE',
                    portalUserId: request.portalAuth.portalUserId,
                    message: input.message
                }
            })
        ]);
        return { success: true };
    });
}
