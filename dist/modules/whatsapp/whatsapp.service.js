import { env } from '../../lib/env.js';
import { AppError } from '../../lib/errors.js';
import { decryptSecret, encryptSecret, maskSecret } from '../../lib/crypto.js';
import { createOrUpdateInboundConversation, createSuggestion, findLatestInboundMessage, findMessageByWhatsAppId, findSuggestionById, findTenantBySlug, findWhatsAppSettingsByPhoneNumberId, findWhatsAppSettingsByTenant, getConversationById, getRecentConversationMessages, listAllWhatsAppSettings, listConversationsByTenant, listSuggestionsByConversation, saveOutboundMessage, updateConversationStatus, updateSuggestionStatus, upsertWhatsAppSettings } from './whatsapp.repository.js';
import { WhatsAppAiService } from './whatsapp-ai.service.js';
import { WhatsAppMetaService } from './whatsapp-meta.service.js';
function mapMessage(item) {
    return {
        id: item.id,
        conversationId: item.conversationId,
        direction: item.direction,
        type: item.type,
        body: item.body,
        whatsappMessageId: item.whatsappMessageId ?? null,
        status: item.status,
        aiSuggested: item.aiSuggested,
        createdAt: item.createdAt.toISOString()
    };
}
function mapSuggestion(item) {
    return {
        id: item.id,
        conversationId: item.conversationId,
        sourceMessageId: item.sourceMessageId,
        suggestionText: item.suggestionText,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
    };
}
function mapConversation(item) {
    return {
        id: item.id,
        customerId: item.customerId ?? null,
        phone: item.phone,
        customerName: item.customerName ?? null,
        status: item.status,
        lastMessageAt: item.lastMessageAt ? item.lastMessageAt.toISOString() : null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        customer: item.customer
            ? {
                id: item.customer.id,
                name: item.customer.name,
                tradeName: item.customer.tradeName ?? null,
                cpfCnpj: item.customer.cpfCnpj,
                phone: item.customer.phone ?? null,
                email: item.customer.email ?? null
            }
            : null,
        messages: Array.isArray(item.messages) ? item.messages.map(mapMessage) : undefined,
        aiSuggestions: Array.isArray(item.aiSuggestions) ? item.aiSuggestions.map(mapSuggestion) : undefined
    };
}
export class WhatsAppService {
    metaService;
    aiService;
    constructor(metaService = new WhatsAppMetaService(), aiService = new WhatsAppAiService()) {
        this.metaService = metaService;
        this.aiService = aiService;
    }
    async getSettings(tenantId) {
        const saved = await findWhatsAppSettingsByTenant(tenantId);
        return {
            id: saved?.id ?? null,
            phoneNumberId: saved?.phoneNumberId ?? env.WHATSAPP_PHONE_NUMBER_ID ?? null,
            businessAccountId: saved?.businessAccountId ?? env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? null,
            verifyTokenMasked: maskSecret(saved?.verifyToken ? decryptSecret(saved.verifyToken) : env.WHATSAPP_VERIFY_TOKEN ?? null),
            accessTokenMasked: maskSecret(saved?.accessToken ? decryptSecret(saved.accessToken) : env.WHATSAPP_ACCESS_TOKEN ?? null),
            openAiApiKeyMasked: maskSecret(saved?.openAiApiKey ? decryptSecret(saved.openAiApiKey) : env.OPENAI_API_KEY ?? null),
            aiEnabled: saved?.aiEnabled ?? true,
            manualApprovalRequired: saved?.manualApprovalRequired ?? true,
            hasAccessToken: Boolean(saved?.accessToken || env.WHATSAPP_ACCESS_TOKEN),
            hasVerifyToken: Boolean(saved?.verifyToken || env.WHATSAPP_VERIFY_TOKEN),
            hasOpenAiApiKey: Boolean(saved?.openAiApiKey || env.OPENAI_API_KEY),
            updatedAt: saved?.updatedAt?.toISOString() ?? null
        };
    }
    async saveSettings(tenantId, input) {
        const current = await findWhatsAppSettingsByTenant(tenantId);
        await upsertWhatsAppSettings(tenantId, {
            tenantId,
            phoneNumberId: input.phoneNumberId?.trim() || current?.phoneNumberId || null,
            businessAccountId: input.businessAccountId?.trim() || current?.businessAccountId || null,
            verifyToken: input.verifyToken?.trim() ? encryptSecret(input.verifyToken.trim()) : current?.verifyToken || null,
            accessToken: input.accessToken?.trim() ? encryptSecret(input.accessToken.trim()) : current?.accessToken || null,
            openAiApiKey: input.openAiApiKey?.trim() ? encryptSecret(input.openAiApiKey.trim()) : current?.openAiApiKey || null,
            aiEnabled: input.aiEnabled,
            manualApprovalRequired: input.manualApprovalRequired
        });
        return this.getSettings(tenantId);
    }
    async resolveSettingsForTenant(tenantId) {
        const saved = await findWhatsAppSettingsByTenant(tenantId);
        const phoneNumberId = saved?.phoneNumberId || env.WHATSAPP_PHONE_NUMBER_ID;
        const verifyToken = saved?.verifyToken ? decryptSecret(saved.verifyToken) : env.WHATSAPP_VERIFY_TOKEN;
        const accessToken = saved?.accessToken ? decryptSecret(saved.accessToken) : env.WHATSAPP_ACCESS_TOKEN;
        if (!phoneNumberId || !verifyToken || !accessToken) {
            throw new AppError('As configuracoes do WhatsApp Business ainda nao foram concluidas.', 409);
        }
        return {
            tenantId,
            phoneNumberId,
            businessAccountId: saved?.businessAccountId || env.WHATSAPP_BUSINESS_ACCOUNT_ID || null,
            verifyToken,
            accessToken,
            openAiApiKey: saved?.openAiApiKey ? decryptSecret(saved.openAiApiKey) : env.OPENAI_API_KEY,
            aiEnabled: saved?.aiEnabled ?? true,
            manualApprovalRequired: saved?.manualApprovalRequired ?? true
        };
    }
    async verifyWebhook(mode, verifyToken, challenge) {
        if (mode !== 'subscribe') {
            throw new AppError('Modo de webhook invalido.', 400);
        }
        if (verifyToken === env.WHATSAPP_VERIFY_TOKEN) {
            return challenge;
        }
        const allSettings = await listAllWhatsAppSettings();
        for (const item of allSettings) {
            const storedToken = item.verifyToken ? decryptSecret(item.verifyToken) : null;
            if (storedToken && storedToken === verifyToken) {
                return challenge;
            }
        }
        throw new AppError('Token de verificacao do webhook invalido.', 403);
    }
    async handleWebhook(payload) {
        const messages = this.metaService.extractMessages(payload);
        for (const message of messages) {
            const existing = await findMessageByWhatsAppId(message.whatsappMessageId);
            if (existing)
                continue;
            const settingsRecord = message.phoneNumberId ? await findWhatsAppSettingsByPhoneNumberId(message.phoneNumberId) : null;
            const tenantId = settingsRecord?.tenantId || (await findTenantBySlug(env.DEFAULT_TENANT_SLUG))?.id;
            if (!tenantId)
                continue;
            const created = await createOrUpdateInboundConversation({
                tenantId,
                phone: message.phone,
                customerName: message.customerName,
                body: message.body,
                type: message.type,
                whatsappMessageId: message.whatsappMessageId,
                receivedAt: message.receivedAt
            });
            void this.generateSuggestion(tenantId, created.conversation.id, created.message.id).catch((error) => {
                console.error('[whatsapp] Falha ao gerar sugestao automatica:', error);
            });
        }
    }
    async listConversations(tenantId, options) {
        const items = await listConversationsByTenant(tenantId, options?.search, options?.status);
        return items.map((item) => ({
            ...mapConversation(item),
            lastMessagePreview: item.messages?.[0]?.body ?? null,
            aiSuggestions: item.aiSuggestions ? item.aiSuggestions.map(mapSuggestion) : []
        }));
    }
    async getConversation(tenantId, conversationId) {
        const item = await getConversationById(tenantId, conversationId);
        if (!item) {
            throw new AppError('Conversa nao encontrada.', 404);
        }
        return {
            ...mapConversation(item),
            suggestions: item.aiSuggestions?.map(mapSuggestion) ?? []
        };
    }
    async generateSuggestion(tenantId, conversationId, explicitSourceMessageId) {
        const conversation = await getConversationById(tenantId, conversationId);
        if (!conversation) {
            throw new AppError('Conversa nao encontrada.', 404);
        }
        const settings = await this.resolveSettingsForTenant(tenantId);
        const sourceMessage = explicitSourceMessageId
            ? conversation.messages.find((item) => item.id === explicitSourceMessageId)
            : await findLatestInboundMessage(conversationId);
        if (!sourceMessage) {
            throw new AppError('Nenhuma mensagem de entrada foi encontrada para gerar sugestao.', 404);
        }
        const recentMessages = await getRecentConversationMessages(conversationId);
        const suggestionText = await this.aiService.generateSuggestion(settings, {
            tenantId,
            customerName: conversation.customerName ?? conversation.customer?.name ?? null,
            phone: conversation.phone,
            messages: recentMessages.reverse().map((item) => ({
                direction: item.direction,
                body: item.body,
                createdAt: item.createdAt
            }))
        });
        const suggestion = await createSuggestion({
            conversationId,
            sourceMessageId: sourceMessage.id,
            suggestionText
        });
        return mapSuggestion(suggestion);
    }
    async sendMessage(tenantId, conversationId, messageText, suggestionId) {
        const conversation = await getConversationById(tenantId, conversationId);
        if (!conversation) {
            throw new AppError('Conversa nao encontrada.', 404);
        }
        const settings = await this.resolveSettingsForTenant(tenantId);
        const sent = await this.metaService.sendText(settings, conversation.phone, messageText);
        const saved = await saveOutboundMessage({
            conversationId,
            body: messageText,
            whatsappMessageId: sent.whatsappMessageId,
            status: 'SENT'
        });
        if (suggestionId) {
            const suggestion = await findSuggestionById(conversationId, suggestionId);
            if (suggestion) {
                await updateSuggestionStatus(suggestion.id, 'SENT');
            }
        }
        return mapMessage(saved.message);
    }
    async setConversationStatus(tenantId, conversationId, status) {
        const current = await getConversationById(tenantId, conversationId);
        if (!current) {
            throw new AppError('Conversa nao encontrada.', 404);
        }
        const updated = await updateConversationStatus(conversationId, tenantId, status);
        return mapConversation(updated);
    }
    async listSuggestions(tenantId, conversationId) {
        const conversation = await getConversationById(tenantId, conversationId);
        if (!conversation) {
            throw new AppError('Conversa nao encontrada.', 404);
        }
        const items = await listSuggestionsByConversation(conversationId);
        return items.map(mapSuggestion);
    }
    async setSuggestionStatus(tenantId, conversationId, suggestionId, status) {
        const conversation = await getConversationById(tenantId, conversationId);
        if (!conversation) {
            throw new AppError('Conversa nao encontrada.', 404);
        }
        const suggestion = await findSuggestionById(conversationId, suggestionId);
        if (!suggestion) {
            throw new AppError('Sugestao nao encontrada.', 404);
        }
        return mapSuggestion(await updateSuggestionStatus(suggestionId, status));
    }
}
