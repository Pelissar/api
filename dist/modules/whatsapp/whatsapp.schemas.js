import { z } from 'zod';
export const whatsappConversationStatusSchema = z.object({
    status: z.enum(['OPEN', 'WAITING_USER', 'CLOSED'])
});
export const whatsappGenerateSuggestionSchema = z.object({
    sourceMessageId: z.string().uuid().optional().nullable()
});
export const whatsappSendMessageSchema = z.object({
    messageText: z.string().trim().min(1),
    suggestionId: z.string().uuid().optional().nullable()
});
export const whatsappSettingsSchema = z.object({
    phoneNumberId: z.string().trim().min(3).optional().nullable(),
    businessAccountId: z.string().trim().min(3).optional().nullable(),
    verifyToken: z.string().trim().min(3).optional().nullable(),
    accessToken: z.string().trim().min(10).optional().nullable(),
    openAiApiKey: z.string().trim().min(10).optional().nullable(),
    aiEnabled: z.boolean().default(true),
    manualApprovalRequired: z.boolean().default(true)
});
export const whatsappWebhookVerificationSchema = z.object({
    'hub.mode': z.string().trim(),
    'hub.verify_token': z.string().trim(),
    'hub.challenge': z.string().trim()
});
export const whatsappConversationListQuerySchema = z.object({
    status: z.enum(['OPEN', 'WAITING_USER', 'CLOSED', 'TODAS']).default('TODAS'),
    search: z.string().trim().optional()
});
