import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    auth?: {
      adminUserId: string
      tenantId: string
      role: string
      email: string
    }
    portalAuth?: {
      portalUserId: string
      tenantId: string
      clientId: string
      email: string
    }
  }
}
