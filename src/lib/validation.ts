import type { ZodTypeAny } from 'zod'

export function parseWithSchema<TSchema extends ZodTypeAny>(schema: TSchema, data: unknown) {
  return schema.parse(data)
}
