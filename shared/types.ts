export type Id = number
export type UserRole = 'ADMIN' | 'VENDEDOR'
export type NetworkMode = 'LOCAL' | 'SERVER' | 'CLIENT'
export type ReleaseChannel = 'STABLE' | 'BETA'
export type DesktopLicenseStatus = 'NOT_CONFIGURED' | 'ACTIVE' | 'OFFLINE' | 'INVALID' | 'EXPIRED' | 'SUSPENDED' | 'ERROR'
export type AppEdition = 'EMPRESARIAL' | 'RESTAURANTE'
export type OrderSource = 'MANUAL' | 'RESTAURANTE'

export type OrderStatus =
  | 'ABERTO'
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_PAGAMENTO'
  | 'PAGO'
  | 'SEPARANDO'
  | 'ENVIADO'
  | 'ENTREGUE'
  | 'CANCELADO'

export interface Company {
  id?: Id
  logoBase64?: string | null
  legalName: string
  tradeName: string
  cnpj: string
  stateRegistration?: string | null
  municipalRegistration?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  website?: string | null
  zipCode?: string | null
  address?: string | null
  number?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  notes?: string | null
  taxRegime?: string | null
  invoiceSeries?: string | null
  initialOrderNumber?: number
  bankDetails?: string | null
  pixKey?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Customer {
  id?: Id
  name: string
  document: string
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  zipCode?: string | null
  address?: string | null
  number?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  complement?: string | null
  notes?: string | null
  registrationDate?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Product {
  id?: Id
  name: string
  internalCode?: string | null
  invoiceCode?: string | null
  sku?: string | null
  barcode?: string | null
  ncm?: string | null
  defaultCfop?: string | null
  cstCsosn?: string | null
  category?: string | null
  brand?: string | null
  unit?: string | null
  costPrice: number
  salePrice: number
  stockCurrent: number
  stockMinimum: number
  description?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface OrderItem {
  id?: Id
  orderId?: Id
  productId: Id
  productName: string
  category?: string | null
  internalCode?: string | null
  invoiceCode?: string | null
  quantity: number
  unitPrice: number
  itemDiscount: number
  lineTotal: number
}

export interface Order {
  id?: Id
  orderNumber?: number
  orderDate: string
  customerId: Id
  customerName?: string
  customerDocument?: string | null
  phone?: string | null
  email?: string | null
  deliveryAddress?: string | null
  status: OrderStatus
  source: OrderSource
  isBudget?: boolean
  includeBankDetails?: boolean
  paymentMethod?: string | null
  dueDate?: string | null
  amountPaid?: number
  notes?: string | null
  subtotal: number
  totalItemDiscount: number
  totalDiscount: number
  freight: number
  totalFinal: number
  items: OrderItem[]
  createdAt?: string
  updatedAt?: string
}

export interface AppSettings {
  id?: Id
  nextOrderNumber: number
  language: string
  currency: string
  dateFormat: string
  autoBackupEnabled?: boolean
  autoBackupIntervalHours?: number
  lastAutoBackupAt?: string | null
  backupDirectory?: string | null
  autoUpdateEnabled?: boolean
  autoUpdateIntervalHours?: number
  updateDirectory?: string | null
  lastUpdateCheckAt?: string | null
  networkMode?: NetworkMode
  serverHost?: string | null
  serverPort?: number
  serverToken?: string | null
  licenseApiUrl?: string | null
  licenseCode?: string | null
  licenseChannel?: ReleaseChannel
  licenseDeviceId?: string | null
  licenseTenantId?: string | null
  licenseStatus?: DesktopLicenseStatus | null
  licensePlanName?: string | null
  licenseExpiresAt?: string | null
  lastLicenseValidationAt?: string | null
  lastLicenseMessage?: string | null
  licenseEnabledEditions?: AppEdition[] | null
  cloudSyncEnabled?: boolean
  lastCloudSyncAt?: string | null
  lastCloudSyncMessage?: string | null
  currentUserId?: number | null
  portalUserId?: string | null
  portalClientId?: string | null
  portalUserName?: string | null
  portalUserEmail?: string | null
  portalAccessToken?: string | null
  portalRefreshToken?: string | null
  portalLastLoginAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export type UpdateCheckStatus = 'NO_CONFIG' | 'NO_UPDATE' | 'UPDATE_AVAILABLE' | 'UPDATE_STARTED' | 'ERROR'

export interface UpdateCheckResult {
  status: UpdateCheckStatus
  currentVersion: string
  latestVersion?: string | null
  message: string
  checkedAt: string
  updateDirectory?: string | null
}

export interface DesktopLicenseState {
  configured: boolean
  apiUrl: string | null
  licenseCode: string | null
  tenantId?: string | null
  deviceFingerprint: string
  deviceName: string
  currentVersion: string
  status: DesktopLicenseStatus
  planName?: string | null
  enabledEditions?: AppEdition[] | null
  expiresAt?: string | null
  lastValidatedAt?: string | null
  message: string
}

export interface PortalSessionState {
  authenticated: boolean
  userId: string | null
  clientId: string | null
  name: string | null
  email: string | null
  lastLoginAt: string | null
  message: string
}

export interface PortalAccountRegisterPayload {
  licenseCode: string
  companyName: string
  tradeName?: string | null
  cpfCnpj: string
  email: string
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  name: string
  password: string
}

export interface SupportTicketMessage {
  id: string
  senderType: 'CLIENTE' | 'ADMIN'
  message: string
  createdAt: string
  adminUser?: { id: string; name: string; email: string } | null
  portalUser?: { id: string; name: string; email: string } | null
}

export interface SupportTicket {
  id: string
  subject: string
  category?: string | null
  status: 'ABERTO' | 'EM_ATENDIMENTO' | 'AGUARDANDO_CLIENTE' | 'RESOLVIDO' | 'FECHADO'
  priority: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'
  createdAt: string
  updatedAt: string
  closedAt?: string | null
  messages?: SupportTicketMessage[]
}

export interface RestaurantTableItem {
  id?: Id
  tableId?: Id
  productId: Id
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface RestaurantTable {
  id?: Id
  name: string
  status: 'LIVRE' | 'OCUPADA' | 'FECHADA'
  notes?: string | null
  createdAt?: string
  updatedAt?: string
  items: RestaurantTableItem[]
  totalItems?: number
  totalAmount?: number
}

export interface DesktopSyncResult {
  configured: boolean
  allowed: boolean
  tenantId: string | null
  tenantName: string | null
  pendingChanges: number
  pushed: number
  pulled: number
  syncedAt: string | null
  message: string
}

export interface DesktopCloudUpdateResult {
  configured: boolean
  allowed: boolean
  currentVersion: string
  latestVersion: string | null
  updateAvailable: boolean
  mandatory: boolean
  changelog: string | null
  downloadUrl: string | null
  reason: string | null
  checkedAt: string
}

export interface DesktopInstallUpdateResult {
  started: boolean
  version: string | null
  filePath: string | null
  message: string
}

export interface User {
  id?: Id
  name: string
  username: string
  role: UserRole
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface SaveUserPayload {
  id?: Id
  name: string
  username: string
  role: UserRole
  isActive: boolean
  password?: string
}

export interface ActionLog {
  id?: Id
  userId?: Id | null
  userName?: string | null
  action: string
  entity: string
  entityId?: Id | null
  details?: string | null
  createdAt?: string
}

export interface ActionLogFilters {
  limit?: number
  days?: number
}

export interface LogCleanupResult {
  removed: number
  days: number
}

export interface ErrorLog {
  id?: Id
  source: string
  message: string
  stack?: string | null
  details?: string | null
  createdAt?: string
}

export interface ErrorDiagnosticsReport {
  count: number
  lastErrorAt?: string | null
  text: string
}

export interface StockMovement {
  id?: Id
  productId: Id
  productName?: string
  orderId?: Id | null
  movementType: string
  quantityDelta: number
  balanceBefore: number
  balanceAfter: number
  reason?: string | null
  userId?: Id | null
  userName?: string | null
  createdAt?: string
}

export interface ReceivableItem {
  orderId: Id
  orderNumber: number
  orderDate: string
  dueDate?: string | null
  customerName: string
  totalFinal: number
  amountPaid: number
  amountDue: number
  receivableStatus: 'EM_ABERTO' | 'PARCIAL' | 'PAGO' | 'ATRASADO'
}

export interface BackupSettings {
  autoBackupEnabled: boolean
  autoBackupIntervalHours: number
}

export interface BackupResult {
  filePath: string | null
  mode: 'MANUAL' | 'AUTO' | 'RESTORE'
}

export interface ImportResult {
  totalRows: number
  insertedRows: number
  updatedRows: number
  errorsCount: number
}

export interface CustomerFilters {
  search?: string
  isActive?: boolean | null
}

export interface ProductFilters {
  search?: string
  isActive?: boolean | null
  lowStockOnly?: boolean
  category?: string | null
}

export interface OrderFilters {
  search?: string
  status?: OrderStatus | 'TODOS' | null
  source?: OrderSource | 'TODOS' | null
  isBudget?: boolean | null
  dateFrom?: string | null
  dateTo?: string | null
}

export interface ReceivableFilters {
  search?: string
  status?: 'TODOS' | 'EM_ABERTO' | 'PARCIAL' | 'PAGO' | 'ATRASADO'
  dueDateFrom?: string | null
  dueDateTo?: string | null
}

export interface StockMovementFilters {
  productId?: Id | null
  dateFrom?: string | null
  dateTo?: string | null
}

export interface DashboardMetrics {
  totalCustomers: number
  totalProducts: number
  totalOrders: number
  ordersOpen: number
  ordersPaid: number
  salesCurrentMonth: number
  lowStockProducts: number
}

export interface SalesByPeriodItem {
  period: string
  total: number
}

export interface SalesBySourceItem {
  source: OrderSource
  total: number
  orders: number
}

export interface StatusCountItem {
  status: OrderStatus
  total: number
}

export interface RestaurantSummary {
  totalSales: number
  totalOrders: number
  averageTicket: number
}

export interface TopProductItem {
  productId: Id
  productName: string
  totalQuantity: number
  totalAmount: number
}

export interface ExportResult {
  filePath: string | null
}

export interface SaveOrderPayload extends Omit<Order, 'id' | 'subtotal' | 'totalItemDiscount' | 'totalFinal'> {
  id?: Id
  customerDocument?: string | null
}

export interface SaveCompanyPayload extends Omit<Company, 'id' | 'createdAt' | 'updatedAt'> {}
export interface SaveCustomerPayload extends Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'registrationDate'> { id?: Id }
export interface SaveProductPayload extends Omit<Product, 'id' | 'createdAt' | 'updatedAt'> { id?: Id }
export interface SaveSettingsPayload extends Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'> {}
