import 'dotenv/config'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { PrismaClient, ClientStatus } from '@prisma/client'

const prisma = new PrismaClient()

function getArg(name) {
  const prefix = `--${name}=`
  const match = process.argv.find((item) => item.startsWith(prefix))
  return match ? match.slice(prefix.length).trim() : null
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`)
}

function sanitizeNullable(value) {
  if (value == null) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

function resolveDesktopDatabasePath() {
  const sourceArg = sanitizeNullable(getArg('source'))
  if (sourceArg) {
    return path.resolve(sourceArg)
  }

  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
  const legacyRoot = path.join(appData, 'sistema-pedidos-polimaq')
  const storageConfigPath = path.join(legacyRoot, 'storage-config.json')

  if (fs.existsSync(storageConfigPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(storageConfigPath, 'utf8'))
      const customPath = sanitizeNullable(parsed?.customDatabasePath)
      if (customPath) {
        return path.resolve(customPath)
      }
    } catch {
      // Ignore invalid config and fallback to the default location.
    }
  }

  return path.join(legacyRoot, 'data', 'sistema-pedidos.sqlite')
}

function joinParts(parts, separator = ' | ') {
  return parts.map(sanitizeNullable).filter(Boolean).join(separator) || null
}

function buildAddress(row) {
  return joinParts(
    [
      row.address,
      row.number ? `n. ${row.number}` : null,
      row.neighborhood,
      row.complement
    ],
    ', '
  )
}

function buildNotes(row) {
  return joinParts([
    row.notes,
    `Importado do desktop local (cliente #${row.id})`
  ])
}

function timestampForFileName() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`
}

async function ensureTenant(companyRow, tenantSlug, dryRun) {
  const tenantName =
    sanitizeNullable(companyRow?.trade_name) ||
    sanitizeNullable(companyRow?.legal_name) ||
    'Nexus Comercial'

  if (dryRun) {
    const existing = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    return {
      id: existing?.id || 'dry-run-tenant',
      name: existing?.name || tenantName
    }
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: {
      name: tenantName
    },
    create: {
      slug: tenantSlug,
      name: tenantName
    }
  })

  return { id: tenant.id, name: tenant.name }
}

async function importCustomers({ sqlite, tenantId, dryRun }) {
  const rows = sqlite
    .prepare(
      `SELECT
        id, name, document, phone, whatsapp, email, zip_code, address, number,
        neighborhood, city, state, complement, notes, is_active
       FROM customers
       ORDER BY id`
    )
    .all()

  const result = {
    totalRead: rows.length,
    inserted: 0,
    updated: 0,
    skipped: 0
  }

  for (const row of rows) {
    const cpfCnpj = sanitizeNullable(row.document)
    const name = sanitizeNullable(row.name)

    if (!cpfCnpj || !name) {
      result.skipped += 1
      continue
    }

    const payload = {
      tenantId,
      name,
      tradeName: null,
      cpfCnpj,
      email: sanitizeNullable(row.email),
      phone: sanitizeNullable(row.phone) || sanitizeNullable(row.whatsapp),
      address: buildAddress(row),
      city: sanitizeNullable(row.city),
      state: sanitizeNullable(row.state),
      zipCode: sanitizeNullable(row.zip_code),
      notes: buildNotes(row),
      status: Number(row.is_active) === 1 ? ClientStatus.ATIVO : ClientStatus.INATIVO
    }

    const existing = await prisma.client.findUnique({
      where: {
        tenantId_cpfCnpj: {
          tenantId,
          cpfCnpj
        }
      }
    })

    if (dryRun) {
      if (existing) {
        result.updated += 1
      } else {
        result.inserted += 1
      }
      continue
    }

    if (existing) {
      await prisma.client.update({
        where: { id: existing.id },
        data: {
          name: payload.name,
          tradeName: payload.tradeName,
          email: payload.email,
          phone: payload.phone,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          zipCode: payload.zipCode,
          notes: payload.notes,
          status: payload.status
        }
      })
      result.updated += 1
    } else {
      await prisma.client.create({
        data: payload
      })
      result.inserted += 1
    }
  }

  return result
}

function readCompany(sqlite) {
  return sqlite
    .prepare(
      `SELECT
        id, legal_name, trade_name, cnpj, email, phone, city, state
       FROM company
       LIMIT 1`
    )
    .get()
}

function readUnsupportedCounts(sqlite) {
  return sqlite
    .prepare(
      `SELECT
        (SELECT COUNT(1) FROM products) AS products,
        (SELECT COUNT(1) FROM orders) AS orders,
        (SELECT COUNT(1) FROM order_items) AS order_items`
    )
    .get()
}

async function main() {
  const sourcePath = resolveDesktopDatabasePath()
  const tenantSlug = sanitizeNullable(getArg('tenant')) || sanitizeNullable(process.env.DEFAULT_TENANT_SLUG) || 'default'
  const dryRun = hasFlag('dry-run')

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Banco SQLite nao encontrado: ${sourcePath}`)
  }

  const sqlite = new DatabaseSync(sourcePath, { readOnly: true })

  try {
    const company = readCompany(sqlite)
    const unsupported = readUnsupportedCounts(sqlite)
    const tenant = await ensureTenant(company, tenantSlug, dryRun)
    const customers = await importCustomers({
      sqlite,
      tenantId: tenant.id,
      dryRun
    })

    const report = {
      sourcePath,
      tenantSlug,
      tenantId: tenant.id,
      tenantName: tenant.name,
      dryRun,
      company: company
        ? {
            tradeName: company.trade_name || null,
            legalName: company.legal_name || null,
            cnpj: company.cnpj || null
          }
        : null,
      customers,
      notImportedYet: unsupported,
      generatedAt: new Date().toISOString()
    }

    const reportsDir = path.resolve('storage', 'import-reports')
    fs.mkdirSync(reportsDir, { recursive: true })
    const reportPath = path.join(reportsDir, `desktop-import-${timestampForFileName()}.json`)
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8')

    console.log('')
    console.log('[import] Importacao concluida.')
    console.log(`[import] Banco origem: ${sourcePath}`)
    console.log(`[import] Tenant: ${tenant.name} (${tenantSlug})`)
    console.log(`[import] Clientes lidos: ${customers.totalRead}`)
    console.log(`[import] Clientes inseridos: ${customers.inserted}`)
    console.log(`[import] Clientes atualizados: ${customers.updated}`)
    console.log(`[import] Clientes ignorados: ${customers.skipped}`)
    console.log(
      `[import] Ainda nao importados para a API comercial atual: produtos=${unsupported.products}, pedidos=${unsupported.orders}, itens=${unsupported.order_items}`
    )
    console.log(`[import] Relatorio salvo em: ${reportPath}`)
    console.log('')
  } finally {
    sqlite.close()
    await prisma.$disconnect()
  }
}

main().catch(async (error) => {
  console.error('[import] Falha ao importar dados do desktop:', error)
  await prisma.$disconnect()
  process.exit(1)
})
