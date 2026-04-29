import { env } from '../../lib/env.js'
import { AppError } from '../../lib/errors.js'
import type { WhatsAppResolvedSettings } from './whatsapp.types.js'

interface MetaSendResponse {
  messages?: Array<{ id: string }>
  error?: {
    message?: string
    code?: number
    error_subcode?: number
  }
}

export class WhatsAppMetaService {
  async sendText(settings: WhatsAppResolvedSettings, to: string, body: string): Promise<{ whatsappMessageId: string | null }> {
    const response = await fetch(`https://graph.facebook.com/${env.WHATSAPP_GRAPH_VERSION}/${settings.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          body
        }
      })
    })

    const payload = (await response.json().catch(() => ({}))) as MetaSendResponse

    if (!response.ok) {
      throw new AppError(payload.error?.message || 'Falha ao enviar mensagem pela Meta API.', response.status)
    }

    return {
      whatsappMessageId: payload.messages?.[0]?.id ?? null
    }
  }

  extractMessages(payload: any): Array<{
    whatsappMessageId: string
    phone: string
    customerName?: string | null
    type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT' | 'SYSTEM'
    body: string
    receivedAt: Date
    phoneNumberId?: string | null
  }> {
    const entries = Array.isArray(payload?.entry) ? payload.entry : []
    const results: Array<{
      whatsappMessageId: string
      phone: string
      customerName?: string | null
      type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT' | 'SYSTEM'
      body: string
      receivedAt: Date
      phoneNumberId?: string | null
    }> = []

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : []
      for (const change of changes) {
        const value = change?.value
        const phoneNumberId = value?.metadata?.phone_number_id ? String(value.metadata.phone_number_id) : null
        const contacts = Array.isArray(value?.contacts) ? value.contacts : []
        const contactMap = new Map<string, string>()
        for (const contact of contacts) {
          const waId = String(contact?.wa_id || '')
          const name = String(contact?.profile?.name || '')
          if (waId) {
            contactMap.set(waId, name)
          }
        }

        const messages = Array.isArray(value?.messages) ? value.messages : []
        for (const message of messages) {
          const type = String(message?.type || 'text').toLowerCase()
          const body =
            type === 'text'
              ? String(message?.text?.body || '')
              : type === 'image'
                ? String(message?.image?.caption || '[Imagem recebida]')
                : type === 'audio'
                  ? '[Audio recebido]'
                  : type === 'document'
                    ? String(message?.document?.caption || message?.document?.filename || '[Documento recebido]')
                    : '[Mensagem recebida]'

          const mappedType = type === 'image' ? 'IMAGE' : type === 'audio' ? 'AUDIO' : type === 'document' ? 'DOCUMENT' : 'TEXT'
          const phone = String(message?.from || '')
          const timestamp = Number(message?.timestamp || 0)

          if (!message?.id || !phone) continue

          results.push({
            whatsappMessageId: String(message.id),
            phone,
            customerName: contactMap.get(phone) ?? null,
            type: mappedType,
            body,
            receivedAt: timestamp ? new Date(timestamp * 1000) : new Date(),
            phoneNumberId
          })
        }
      }
    }

    return results
  }
}
