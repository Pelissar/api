import type {
  AppEdition,
  AppSettings,
  BackupResult,
  Company,
  Customer,
  CustomerFilters,
  DashboardMetrics,
  ExportResult,
  ImportResult,
  Order,
  OrderFilters,
  Product,
  ProductFilters,
  ReceivableFilters,
  ReceivableItem,
  RestaurantTable,
  RestaurantTableItem,
  SalesByPeriodItem,
  SaveCompanyPayload,
  SaveCustomerPayload,
  SaveOrderPayload,
  SaveProductPayload,
  SaveUserPayload,
  SaveSettingsPayload,
  PortalAccountRegisterPayload,
  PortalSessionState,
  SupportTicket,
  UpdateCheckResult,
  StockMovement,
  StockMovementFilters,
  SalesBySourceItem,
  RestaurantSummary,
  StatusCountItem,
  DesktopCloudUpdateResult,
  DesktopInstallUpdateResult,
  DesktopLicenseState,
  DesktopSyncResult,
  ErrorDiagnosticsReport,
  TopProductItem,
  User
} from './types'

export interface AppApi {
  company: {
    get: () => Promise<Company>
    save: (payload: SaveCompanyPayload) => Promise<Company>
  }
  customers: {
    list: (filters?: CustomerFilters) => Promise<Customer[]>
    save: (payload: SaveCustomerPayload) => Promise<Customer>
    deleteInfo: (id: number) => Promise<{ hasLinkedOrders: boolean; linkedOrdersCount: number }>
    remove: (id: number, adminPassword?: string) => Promise<void>
  }
  products: {
    list: (filters?: ProductFilters) => Promise<Product[]>
    getById: (id: number) => Promise<Product>
    save: (payload: SaveProductPayload) => Promise<Product>
    remove: (id: number) => Promise<void>
    lowStock: () => Promise<Product[]>
  }
  imports: {
    customers: () => Promise<ImportResult>
    products: () => Promise<ImportResult>
  }
  orders: {
    list: (filters?: OrderFilters) => Promise<Order[]>
    getById: (id: number) => Promise<Order>
    getNextNumber: () => Promise<number>
    save: (payload: SaveOrderPayload) => Promise<Order>
    convertBudget: (id: number) => Promise<Order>
    remove: (id: number, adminPassword?: string) => Promise<void>
    exportPdf: (id: number) => Promise<ExportResult>
    print: (id: number) => Promise<void>
    printableHtml: (id: number) => Promise<string>
    printPicking: (id: number) => Promise<void>
    pickingPdf: (id: number) => Promise<ExportResult>
    pickingHtml: (id: number) => Promise<string>
    labelsPdf: (id: number) => Promise<ExportResult>
    whatsappText: (id: number) => Promise<{ text: string; phone: string | null }>
  }
  finance: {
    listReceivables: (filters?: ReceivableFilters) => Promise<ReceivableItem[]>
    registerPayment: (orderId: number, amount: number) => Promise<ReceivableItem>
  }
  stock: {
    history: (filters?: StockMovementFilters) => Promise<StockMovement[]>
  }
  auth: {
    currentUser: () => Promise<User | null>
    login: (username: string, password: string) => Promise<User>
    logout: () => Promise<void>
    listUsers: () => Promise<User[]>
    saveUser: (payload: SaveUserPayload) => Promise<User>
    deleteUser: (id: number) => Promise<void>
  }
  diagnostics: {
    getReport: () => Promise<ErrorDiagnosticsReport>
    logError: (payload: { source: string; message: string; stack?: string | null; details?: string | null }) => Promise<void>
  }
  portal: {
    getSession: () => Promise<PortalSessionState>
    register: (payload: PortalAccountRegisterPayload) => Promise<PortalSessionState>
    login: (email: string, password: string) => Promise<PortalSessionState>
    logout: () => Promise<void>
    requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>
  }
  support: {
    listMyTickets: () => Promise<SupportTicket[]>
    createTicket: (payload: { subject: string; category?: string | null; priority?: SupportTicket['priority']; message: string }) => Promise<SupportTicket>
    replyTicket: (ticketId: string, message: string) => Promise<void>
  }
  restaurant: {
    listTables: () => Promise<RestaurantTable[]>
    saveTable: (payload: { id?: number; name: string; status: RestaurantTable['status']; notes?: string | null }) => Promise<RestaurantTable>
    removeTable: (id: number) => Promise<void>
    addItem: (tableId: number, payload: { productId: number; quantity: number; notes?: string | null }) => Promise<RestaurantTableItem>
    removeItem: (itemId: number) => Promise<void>
    closeTable: (tableId: number) => Promise<RestaurantTable>
  }
  backup: {
    runManual: () => Promise<BackupResult>
    restoreFromFile: () => Promise<BackupResult>
    runAutoNow: () => Promise<BackupResult>
    selectDirectory: (currentPath?: string | null) => Promise<string | null>
  }
  updates: {
    checkNow: () => Promise<UpdateCheckResult>
    selectDirectory: (currentPath?: string | null) => Promise<string | null>
  }
  licensing: {
    getState: () => Promise<DesktopLicenseState>
    activate: () => Promise<DesktopLicenseState>
    validate: () => Promise<DesktopLicenseState>
    checkUpdate: () => Promise<DesktopCloudUpdateResult>
    downloadAndInstallUpdate: () => Promise<DesktopInstallUpdateResult>
  }
  sync: {
    status: () => Promise<DesktopSyncResult>
    runNow: () => Promise<DesktopSyncResult>
  }
  network: {
    testConnection: () => Promise<{ ok: boolean; message: string; server?: string }>
  }
  reports: {
    dashboard: () => Promise<DashboardMetrics>
    salesByPeriod: (range?: { dateFrom?: string | null; dateTo?: string | null }) => Promise<SalesByPeriodItem[]>
    salesBySource: (range?: { dateFrom?: string | null; dateTo?: string | null }) => Promise<SalesBySourceItem[]>
    ordersByStatus: () => Promise<StatusCountItem[]>
    topProducts: (range?: { dateFrom?: string | null; dateTo?: string | null }) => Promise<TopProductItem[]>
    restaurantSummary: (range?: { dateFrom?: string | null; dateTo?: string | null }) => Promise<RestaurantSummary>
    restaurantTopProducts: (range?: { dateFrom?: string | null; dateTo?: string | null }) => Promise<TopProductItem[]>
  }
  exports: {
    customers: () => Promise<ExportResult>
    products: () => Promise<ExportResult>
    orders: () => Promise<ExportResult>
  }
  settings: {
    get: () => Promise<AppSettings>
    save: (payload: SaveSettingsPayload) => Promise<AppSettings>
    recalculateStock: () => Promise<{ adjustedOrders: number; revertedOrders: number }>
  }
  status: {
    list: () => Promise<Array<{ value: string; label: string }>>
  }
  app: {
    dbPath: () => Promise<string>
    selectDbDirectory: (currentPath?: string | null) => Promise<string | null>
    changeDbDirectory: (directoryPath: string) => Promise<{ dbPath: string }>
  }
}
