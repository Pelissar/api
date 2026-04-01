import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { MultipartFile } from '@fastify/multipart'
import { env } from './env'

export interface StoredFileResult {
  fileName: string
  filePath: string
  fileSize: number
  checksum: string
}

export async function storeUpdateFile(file: MultipartFile, version: string): Promise<StoredFileResult> {
  const versionDir = path.join(env.STORAGE_DIR, 'updates', version)
  fs.mkdirSync(versionDir, { recursive: true })

  const safeName = `${Date.now()}-${file.filename.replace(/[^\w.\-]+/g, '-')}`
  const absolutePath = path.join(versionDir, safeName)
  const hash = crypto.createHash('sha256')
  let fileSize = 0

  const writeStream = fs.createWriteStream(absolutePath)
  file.file.on('data', (chunk: Buffer) => {
    hash.update(chunk)
    fileSize += chunk.length
  })

  await pipeline(file.file, writeStream)

  return {
    fileName: file.filename,
    filePath: absolutePath,
    fileSize,
    checksum: hash.digest('hex')
  }
}
