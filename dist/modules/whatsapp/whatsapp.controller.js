import { parseWithSchema } from '../../lib/validation.js';
import { whatsappConversationListQuerySchema, whatsappConversationStatusSchema, whatsappGenerateSuggestionSchema, whatsappSendMessageSchema, whatsappSettingsSchema, whatsappWebhookVerificationSchema } from './whatsapp.schemas.js';
import { WhatsAppService } from './whatsapp.service.js';
export class WhatsAppController {
    service;
    constructor(service = new WhatsAppService()) {
        this.service = service;
    }
    getTenantId(request) {
        return request.portalAuth?.tenantId || request.auth?.tenantId || null;
    }
    verifyWebhook = async (request, reply) => {
        const query = parseWithSchema(whatsappWebhookVerificationSchema, request.query);
        const challenge = await this.service.verifyWebhook(query['hub.mode'], query['hub.verify_token'], query['hub.challenge']);
        return reply.status(200).send(challenge);
    };
    receiveWebhook = async (request, reply) => {
        await this.service.handleWebhook(request.body);
        return reply.status(200).send({ received: true });
    };
    getSettings = async (request) => {
        return this.service.getSettings(request.auth.tenantId);
    };
    saveSettings = async (request) => {
        const input = parseWithSchema(whatsappSettingsSchema, request.body);
        return this.service.saveSettings(request.auth.tenantId, input);
    };
    listConversations = async (request) => {
        const query = parseWithSchema(whatsappConversationListQuerySchema, request.query);
        return { items: await this.service.listConversations(this.getTenantId(request), query) };
    };
    getConversation = async (request) => {
        const { id } = request.params;
        return this.service.getConversation(this.getTenantId(request), id);
    };
    generateSuggestion = async (request) => {
        const { id } = request.params;
        const input = parseWithSchema(whatsappGenerateSuggestionSchema, request.body ?? {});
        return this.service.generateSuggestion(this.getTenantId(request), id, input.sourceMessageId ?? null);
    };
    sendMessage = async (request) => {
        const { id } = request.params;
        const input = parseWithSchema(whatsappSendMessageSchema, request.body);
        return this.service.sendMessage(this.getTenantId(request), id, input.messageText, input.suggestionId ?? null);
    };
    updateConversationStatus = async (request) => {
        const { id } = request.params;
        const input = parseWithSchema(whatsappConversationStatusSchema, request.body);
        return this.service.setConversationStatus(this.getTenantId(request), id, input.status);
    };
    listSuggestions = async (request) => {
        const { id } = request.params;
        return { items: await this.service.listSuggestions(this.getTenantId(request), id) };
    };
}
