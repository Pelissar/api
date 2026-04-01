import { createApp } from './app'
import { env } from './lib/env'

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
