import type { FastifyInstance } from 'fastify'
import { loginSchema, refreshTokenSchema } from '@nexus/shared'
import { prisma } from '../../lib/prisma'
import { comparePassword } from '../../lib/password'
import { parseWithSchema } from '../../lib/validation'
import { AppError } from '../../lib/errors'
import { createAuditLog } from '../../lib/audit'
import { env } from '../../lib/env'
import { requireAdminAuth } from '../../plugins/auth'
import { sha256 } from '../../lib/utils'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt'

function mapAdminUser(adminUser: {
  id: string
  tenantId: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: adminUser.id,
    tenantId: adminUser.tenantId,
    name: adminUser.name,
    email: adminUser.email,
    role: adminUser.role,
    isActive: adminUser.isActive,
    createdAt: adminUser.createdAt.toISOString(),
    updatedAt: adminUser.updatedAt.toISOString()
  }
}

export async function authRoutes(app: FastifyInstance) {
  app.post(
    '/auth/login',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute'
        }
      }
    },
    async (request) => {
      const input = parseWithSchema(loginSchema, request.body)
      const adminUser = await prisma.adminUser.findUnique({
        where: { email: input.email }
      })

      if (!adminUser || !(await comparePassword(input.password, adminUser.passwordHash))) {
        throw new AppError('Email ou senha invalidos.', 401)
      }
      if (!adminUser.isActive) {
        throw new AppError('Usuario administrativo inativo.', 403)
      }

      const accessToken = signAccessToken({
        sub: adminUser.id,
        tenantId: adminUser.tenantId,
        role: adminUser.role,
        email: adminUser.email
      })
      const refreshToken = signRefreshToken({
        sub: adminUser.id,
        tenantId: adminUser.tenantId,
        type: 'refresh'
      })

      await prisma.$transaction([
        prisma.adminUser.update({
          where: { id: adminUser.id },
          data: { lastLoginAt: new Date() }
        }),
        prisma.refreshToken.create({
          data: {
            tenantId: adminUser.tenantId,
            adminUserId: adminUser.id,
            tokenHash: sha256(refreshToken),
            userAgent: request.headers['user-agent'] || null,
            ipAddress: request.ip,
            expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000)
          }
        })
      ])

      await createAuditLog({
        tenantId: adminUser.tenantId,
        adminUserId: adminUser.id,
        action: 'ADMIN_LOGIN',
        entityType: 'ADMIN_USER',
        entityId: adminUser.id,
        metadata: { email: adminUser.email, ip: request.ip }
      })

      return {
        user: mapAdminUser(adminUser),
        accessToken,
        refreshToken
      }
    }
  )

  app.post('/auth/refresh', async (request) => {
    const input = parseWithSchema(refreshTokenSchema, request.body)
    let payload
    try {
      payload = verifyRefreshToken(input.refreshToken)
    } catch {
      throw new AppError('Refresh token invalido ou expirado.', 401)
    }

    const existing = await prisma.refreshToken.findFirst({
      where: {
        adminUserId: payload.sub,
        tenantId: payload.tenantId,
        tokenHash: sha256(input.refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: { adminUser: true }
    })

    if (!existing || !existing.adminUser.isActive) {
      throw new AppError('Sessao invalida. Faça login novamente.', 401)
    }

    const accessToken = signAccessToken({
      sub: existing.adminUser.id,
      tenantId: existing.adminUser.tenantId,
      role: existing.adminUser.role,
      email: existing.adminUser.email
    })
    const refreshToken = signRefreshToken({
      sub: existing.adminUser.id,
      tenantId: existing.adminUser.tenantId,
      type: 'refresh'
    })

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() }
      }),
      prisma.refreshToken.create({
        data: {
          tenantId: existing.adminUser.tenantId,
          adminUserId: existing.adminUser.id,
          tokenHash: sha256(refreshToken),
          userAgent: request.headers['user-agent'] || null,
          ipAddress: request.ip,
          expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000)
        }
      })
    ])

    return {
      user: mapAdminUser(existing.adminUser),
      accessToken,
      refreshToken
    }
  })

  app.post('/auth/logout', async (request) => {
    const input = parseWithSchema(refreshTokenSchema, request.body)
    await prisma.refreshToken.updateMany({
      where: {
        tokenHash: sha256(input.refreshToken),
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    })

    return { success: true }
  })

  app.get('/auth/me', { preHandler: requireAdminAuth }, async (request) => {
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: request.auth!.adminUserId }
    })
    if (!adminUser || !adminUser.isActive) {
      throw new AppError('Usuario administrativo nao encontrado.', 404)
    }

    return { user: mapAdminUser(adminUser) }
  })
}
