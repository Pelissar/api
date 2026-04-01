import crypto from 'node:crypto'

export function randomLicenseCode(): string {
  return `NEX-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export function addDays(base: Date, days: number): Date {
  const result = new Date(base)
  result.setDate(result.getDate() + days)
  return result
}

export function isExpired(date?: Date | null): boolean {
  if (!date) return false
  return date.getTime() < Date.now()
}

export function safeJsonParse<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}
