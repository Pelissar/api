export type WhatsAppConversationStatus = 'OPEN' | 'WAITING_USER' | 'CLOSED'
export type WhatsAppMessageDirection = 'INBOUND' | 'OUTBOUND'
export type WhatsAppMessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT' | 'SYSTEM'
export type WhatsAppMessageStatus = 'RECEIVED' | 'DRAFT' | 'SENT' | 'FAILED'
export type WhatsAppAiSuggestionStatus = 'PENDING' | 'APPROVED' | 'EDITED' | 'REJECTED' | 'SENT'

export interface WhatsAppInboundPayload {
  whatsappMessageId: string
  phone: string
  customerName?: string | null
  type: WhatsAppMessageType
  body: string
  receivedAt: Date
  phoneNumberId?: string | null
}

export interface WhatsAppResolvedSettings {
  tenantId: string
  phoneNumberId: string
  businessAccountId?: string | null
  verifyToken: string
  accessToken: string
  openAiApiKey?: string | null
  aiEnabled: boolean
  manualApprovalRequired: boolean
}

export interface WhatsAppConversationSummary {
  id: string
  customerId: string | null
  phone: string
  customerName: string | null
  status: WhatsAppConversationStatus
  lastMessageAt: string | null
  createdAt: string
  updatedAt: string
  customer?: {
    id: string
    name: string
    tradeName: string | null
    cpfCnpj: string
    phone: string | null
    email: string | null
  } | null
  messages?: WhatsAppMessageSummary[]
  aiSuggestions?: WhatsAppSuggestionSummary[]
  suggestions?: WhatsAppSuggestionSummary[]
}

export interface WhatsAppMessageSummary {
  id: string
  conversationId: string
  direction: WhatsAppMessageDirection
  type: WhatsAppMessageType
  body: string
  whatsappMessageId: string | null
  status: WhatsAppMessageStatus
  aiSuggested: boolean
  createdAt: string
}

export interface WhatsAppSuggestionSummary {
  id: string
  conversationId: string
  sourceMessageId: string
  suggestionText: string
  status: WhatsAppAiSuggestionStatus
  createdAt: string
  updatedAt: string
}

export interface WhatsAppSettingsSummary {
  id: string | null
  phoneNumberId: string | null
  businessAccountId: string | null
  verifyTokenMasked: string | null
  accessTokenMasked: string | null
  openAiApiKeyMasked: string | null
  aiEnabled: boolean
  manualApprovalRequired: boolean
  hasAccessToken: boolean
  hasVerifyToken: boolean
  hasOpenAiApiKey: boolean
  updatedAt: string | null
}
