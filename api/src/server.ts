import { createApp } from './app.js'
import { env } from './lib/env.js'

async function bootstrap() {
  try {
    const app = await createApp()

    await app.listen({
      host: env.HOST || '0.0.0.0',
      port: Number(env.PORT) || 3000
    })

    console.log(`🚀 API rodando em http://${env.HOST || '0.0.0.0'}:${env.PORT || 3000}`)
  } catch (error) {
    console.error('[api] Falha ao iniciar servidor:', error)
    process.exit(1)
  }
}

bootstrap()
