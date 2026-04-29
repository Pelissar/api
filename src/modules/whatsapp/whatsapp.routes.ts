import type { FastifyInstance } from 'fastify'
import { requireAdminAuth, requirePortalAuth } from '../../plugins/auth.js'
import { WhatsAppController } from './whatsapp.controller.js'

export async function whatsappRoutes(app: FastifyInstance) {
  const controller = new WhatsAppController()

  app.get('/api/whatsapp/webhook', controller.verifyWebhook)
  app.post('/api/whatsapp/webhook', controller.receiveWebhook)

  app.get('/api/whatsapp/settings', { preHandler: requireAdminAuth }, controller.getSettings)
  app.put('/api/whatsapp/settings', { preHandler: requireAdminAuth }, controller.saveSettings)
  app.get('/api/whatsapp/conversations', { preHandler: requireAdminAuth }, controller.listConversations)
  app.get('/api/whatsapp/conversations/:id', { preHandler: requireAdminAuth }, controller.getConversation)
  app.get('/api/whatsapp/conversations/:id/suggestions', { preHandler: requireAdminAuth }, controller.listSuggestions)
  app.post('/api/whatsapp/conversations/:id/generate-suggestion', { preHandler: requireAdminAuth }, controller.generateSuggestion)
  app.post('/api/whatsapp/conversations/:id/send', { preHandler: requireAdminAuth }, controller.sendMessage)
  app.patch('/api/whatsapp/conversations/:id/status', { preHandler: requireAdminAuth }, controller.updateConversationStatus)

  app.get('/portal/whatsapp/conversations', { preHandler: requirePortalAuth }, controller.listConversations)
  app.get('/portal/whatsapp/conversations/:id', { preHandler: requirePortalAuth }, controller.getConversation)
  app.get('/portal/whatsapp/conversations/:id/suggestions', { preHandler: requirePortalAuth }, controller.listSuggestions)
  app.post('/portal/whatsapp/conversations/:id/generate-suggestion', { preHandler: requirePortalAuth }, controller.generateSuggestion)
  app.post('/portal/whatsapp/conversations/:id/send', { preHandler: requirePortalAuth }, controller.sendMessage)
  app.patch('/portal/whatsapp/conversations/:id/status', { preHandler: requirePortalAuth }, controller.updateConversationStatus)
}
