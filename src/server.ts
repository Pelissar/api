import { createApp } from './app.js'
import { env } from './lib/env.js'

async function bootstrap() {
  const app = await createApp()
  await app.listen({
    host: env.HOST,
    port: env.PORT
  })
}

bootstrap().catch((error) => {
  console.error('[api] Falha ao iniciar servidor:', error)
  process.exit(1)
})
