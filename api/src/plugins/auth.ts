import type { FastifyReply, FastifyRequest } from 'fastify'
import { verifyAccessToken, verifyPortalAccessToken } from '../lib/jwt'
import { AppError } from '../lib/errors'

export async function requireAdminAuth(request: FastifyRequest, _reply: FastifyReply) {
  const header = request.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Token de acesso nao informado.', 401)
  }

  const token = header.slice('Bearer '.length).trim()
  try {
    const payload = verifyAccessToken(token)
    request.auth = {
      adminUserId: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      email: payload.email
    }
  } catch {
    throw new AppError('Token de acesso invalido ou expirado.', 401)
  }
}

export async function requirePortalAuth(request: FastifyRequest, _reply: FastifyReply) {
  const header = request.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Token de acesso do cliente nao informado.', 401)
  }

  const token = header.slice('Bearer '.length).trim()
  try {
    const payload = verifyPortalAccessToken(token)
    request.portalAuth = {
      portalUserId: payload.sub,
      tenantId: payload.tenantId,
      clientId: payload.clientId,
      email: payload.email
    }
  } catch {
    throw new AppError('Token de acesso do cliente invalido ou expirado.', 401)
  }
}
