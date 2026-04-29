import type { FastifyReply, FastifyRequest } from 'fastify'
import { parseWithSchema } from '../../lib/validation.js'
import {
  whatsappConversationListQuerySchema,
  whatsappConversationStatusSchema,
  whatsappGenerateSuggestionSchema,
  whatsappSendMessageSchema,
  whatsappSettingsSchema,
  whatsappWebhookVerificationSchema
} from './whatsapp.schemas.js'
import { WhatsAppService } from './whatsapp.service.js'

export class WhatsAppController {
  constructor(private readonly service = new WhatsAppService()) {}

  private getTenantId(request: FastifyRequest) {
    return request.portalAuth?.tenantId || request.auth?.tenantId || null
  }

  verifyWebhook = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = parseWithSchema(whatsappWebhookVerificationSchema, request.query)
    const challenge = await this.service.verifyWebhook(query['hub.mode'], query['hub.verify_token'], query['hub.challenge'])
    return reply.status(200).send(challenge)
  }

  receiveWebhook = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.service.handleWebhook(request.body)
    return reply.status(200).send({ received: true })
  }

  getSettings = async (request: FastifyRequest) => {
    return this.service.getSettings(request.auth!.tenantId)
  }

  saveSettings = async (request: FastifyRequest) => {
    const input = parseWithSchema(whatsappSettingsSchema, request.body)
    return this.service.saveSettings(request.auth!.tenantId, input)
  }

  listConversations = async (request: FastifyRequest) => {
    const query = parseWithSchema(whatsappConversationListQuerySchema, request.query)
    return { items: await this.service.listConversations(this.getTenantId(request)!, query) }
  }

  getConversation = async (request: FastifyRequest) => {
    const { id } = request.params as { id: string }
    return this.service.getConversation(this.getTenantId(request)!, id)
  }

  generateSuggestion = async (request: FastifyRequest) => {
    const { id } = request.params as { id: string }
    const input = parseWithSchema(whatsappGenerateSuggestionSchema, request.body ?? {})
    return this.service.generateSuggestion(this.getTenantId(request)!, id, input.sourceMessageId ?? null)
  }

  sendMessage = async (request: FastifyRequest) => {
    const { id } = request.params as { id: string }
    const input = parseWithSchema(whatsappSendMessageSchema, request.body)
    return this.service.sendMessage(this.getTenantId(request)!, id, input.messageText, input.suggestionId ?? null)
  }

  updateConversationStatus = async (request: FastifyRequest) => {
    const { id } = request.params as { id: string }
    const input = parseWithSchema(whatsappConversationStatusSchema, request.body)
    return this.service.setConversationStatus(this.getTenantId(request)!, id, input.status)
  }

  listSuggestions = async (request: FastifyRequest) => {
    const { id } = request.params as { id: string }
    return { items: await this.service.listSuggestions(this.getTenantId(request)!, id) }
  }
}
