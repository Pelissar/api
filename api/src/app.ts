import fs from 'node:fs'
import path from 'node:path'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import { ZodError } from 'zod'
import { env } from './lib/env.js'
import { AppError } from './lib/errors.js'
import { authRoutes } from './modules/auth/routes.js'
import { clientRoutes } from './modules/clients/routes.js'
import { planRoutes } from './modules/plans/routes.js'
import { licenseRoutes } from './modules/licenses/routes.js'
import { updateRoutes } from './modules/updates/routes.js'
import { dashboardRoutes } from './modules/dashboard/routes.js'
import { auditRoutes } from './modules/audit/routes.js'
import { desktopRoutes } from './modules/desktop/routes.js'
import { portalRoutes } from './modules/portal/routes.js'
import { supportRoutes } from './modules/support/routes.js'

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true

  const rules = env.CORS_ORIGIN.split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (rules.includes('*')) return true

  return rules.some((rule) => {
    if (rule === origin) return true
    if (rule.startsWith('*.')) {
      const suffix = rule.slice(1)
      return origin.endsWith(suffix)
    }
    return false
  })
}

export async function createApp() {
  const app = Fastify({
    logger: true
  })

  fs.mkdirSync(env.STORAGE_DIR, { recursive: true })

  await app.register(cors, {
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin))
    }
  })
  await app.register(rateLimit, {
    global: false,
    skipOnError: true
  })
  await app.register(multipart, {
    limits: {
      fileSize: 1024 * 1024 * 1024
    }
  })
  await app.register(fastifyStatic, {
    root: path.resolve(env.STORAGE_DIR),
    prefix: '/storage/'
  })

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: 'Dados invalidos.',
        issues: error.issues
      })
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        message: error.message
      })
    }

    app.log.error(error)
    return reply.status(500).send({
      message: 'Erro interno do servidor.'
    })
  })

  app.get('/health', async () => ({
    ok: true,
    service: 'nexus-api',
    timestamp: new Date().toISOString()
  }))

  await authRoutes(app)
  await dashboardRoutes(app)
  await clientRoutes(app)
  await planRoutes(app)
  await licenseRoutes(app)
  await updateRoutes(app)
  await desktopRoutes(app)
  await auditRoutes(app)
  await portalRoutes(app)
  await supportRoutes(app)

  return app
}

