import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
const conversationInclude = {
    customer: true,
    messages: {
        orderBy: { createdAt: 'asc' }
    },
    aiSuggestions: {
        orderBy: { createdAt: 'desc' }
    }
};
export async function findWhatsAppSettingsByTenant(tenantId) {
    return prisma.whatsAppSettings.findUnique({ where: { tenantId } });
}
export async function upsertWhatsAppSettings(tenantId, data) {
    return prisma.whatsAppSettings.upsert({
        where: { tenantId },
        create: data,
        update: data
    });
}
export async function findWhatsAppSettingsByPhoneNumberId(phoneNumberId) {
    return prisma.whatsAppSettings.findFirst({ where: { phoneNumberId } });
}
export async function listAllWhatsAppSettings() {
    return prisma.whatsAppSettings.findMany();
}
export async function findTenantBySlug(slug) {
    return prisma.tenant.findUnique({ where: { slug } });
}
export async function listConversationsByTenant(tenantId, search, status) {
    return prisma.whatsAppConversation.findMany({
        where: {
            tenantId,
            ...(status && status !== 'TODAS' ? { status: status } : {}),
            ...(search
                ? {
                    OR: [
                        { phone: { contains: search, mode: 'insensitive' } },
                        { customerName: { contains: search, mode: 'insensitive' } },
                        { customer: { name: { contains: search, mode: 'insensitive' } } }
                    ]
                }
                : {})
        },
        include: {
            customer: true,
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
            },
            aiSuggestions: {
                where: { status: { in: ['PENDING', 'APPROVED', 'EDITED'] } },
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }]
    });
}
export async function getConversationById(tenantId, id) {
    return prisma.whatsAppConversation.findFirst({
        where: { id, tenantId },
        include: conversationInclude
    });
}
export async function findMessageByWhatsAppId(whatsappMessageId) {
    return prisma.whatsAppMessage.findUnique({ where: { whatsappMessageId } });
}
export async function findLatestInboundMessage(conversationId) {
    return prisma.whatsAppMessage.findFirst({
        where: { conversationId, direction: 'INBOUND' },
        orderBy: { createdAt: 'desc' }
    });
}
export async function findSuggestionById(conversationId, suggestionId) {
    return prisma.whatsAppAiSuggestion.findFirst({
        where: { id: suggestionId, conversationId }
    });
}
export async function findClientByPhone(tenantId, phone) {
    const digits = phone.replace(/\D+/g, '');
    const clients = await prisma.client.findMany({
        where: { tenantId, phone: { not: null } },
        take: 500
    });
    return clients.find((item) => String(item.phone || '').replace(/\D+/g, '') === digits) || null;
}
export async function createOrUpdateInboundConversation(params) {
    const linkedClient = await findClientByPhone(params.tenantId, params.phone);
    const existing = await prisma.whatsAppConversation.findFirst({
        where: { tenantId: params.tenantId, phone: params.phone }
    });
    return prisma.$transaction(async (tx) => {
        const conversation = existing
            ? await tx.whatsAppConversation.update({
                where: { id: existing.id },
                data: {
                    customerId: linkedClient?.id ?? existing.customerId ?? null,
                    customerName: params.customerName || existing.customerName,
                    status: 'WAITING_USER',
                    lastMessageAt: params.receivedAt
                }
            })
            : await tx.whatsAppConversation.create({
                data: {
                    tenantId: params.tenantId,
                    customerId: linkedClient?.id ?? null,
                    phone: params.phone,
                    customerName: params.customerName ?? linkedClient?.name ?? null,
                    status: 'WAITING_USER',
                    lastMessageAt: params.receivedAt
                }
            });
        const message = await tx.whatsAppMessage.create({
            data: {
                conversationId: conversation.id,
                direction: 'INBOUND',
                type: params.type,
                body: params.body,
                whatsappMessageId: params.whatsappMessageId,
                status: 'RECEIVED',
                aiSuggested: false,
                createdAt: params.receivedAt
            }
        });
        const fullConversation = await tx.whatsAppConversation.findUniqueOrThrow({
            where: { id: conversation.id },
            include: conversationInclude
        });
        return { conversation: fullConversation, message };
    });
}
export async function createSuggestion(params) {
    return prisma.$transaction(async (tx) => {
        const suggestion = await tx.whatsAppAiSuggestion.create({
            data: {
                conversationId: params.conversationId,
                sourceMessageId: params.sourceMessageId,
                suggestionText: params.suggestionText,
                status: 'PENDING'
            }
        });
        await tx.whatsAppMessage.update({
            where: { id: params.sourceMessageId },
            data: { aiSuggested: true }
        });
        return suggestion;
    });
}
export async function saveOutboundMessage(params) {
    return prisma.$transaction(async (tx) => {
        const message = await tx.whatsAppMessage.create({
            data: {
                conversationId: params.conversationId,
                direction: 'OUTBOUND',
                type: 'TEXT',
                body: params.body,
                whatsappMessageId: params.whatsappMessageId ?? null,
                status: params.status,
                aiSuggested: false
            }
        });
        const conversation = await tx.whatsAppConversation.update({
            where: { id: params.conversationId },
            data: {
                status: 'OPEN',
                lastMessageAt: new Date()
            },
            include: conversationInclude
        });
        return { message, conversation };
    });
}
export async function updateSuggestionStatus(id, status) {
    return prisma.whatsAppAiSuggestion.update({
        where: { id },
        data: { status }
    });
}
export async function updateConversationStatus(id, _tenantId, status) {
    return prisma.whatsAppConversation.update({
        where: { id },
        data: { status },
        include: conversationInclude
    });
}
export async function listSuggestionsByConversation(conversationId) {
    return prisma.whatsAppAiSuggestion.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' }
    });
}
export async function getRecentConversationMessages(conversationId, limit = 12) {
    return prisma.whatsAppMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit
    });
}
export async function getRecentClientOrders(tenantId, customerName, phone) {
    const searchTerms = [customerName?.trim(), phone?.replace(/\D+/g, '')].filter(Boolean);
    if (searchTerms.length === 0)
        return [];
    const filters = searchTerms.map((term) => Prisma.sql `payload::text ILIKE ${`%${term}%`}`);
    const query = Prisma.sql `
    SELECT id, payload, "updatedAt"
    FROM "DesktopRecord"
    WHERE "tenantId" = ${tenantId}
      AND "recordType" = 'ORDER'
      AND (${Prisma.join(filters, ' OR ')})
    ORDER BY "updatedAt" DESC
    LIMIT 5
  `;
    return prisma.$queryRaw(query);
}
