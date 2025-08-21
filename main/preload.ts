import { contextBridge, ipcRenderer } from 'electron'

// IPC イベント名の定数定義（型定義ファイルから分離）
const IPC_EVENTS = {
  // Database
  DB_HEALTH_CHECK: 'db:health-check',
  
  // App
  APP_GET_VERSION: 'app:get-version',
  
  // Categories
  CATEGORIES_GET_ALL: 'categories:get-all',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',
  
  // Tasks
  TASKS_GET_ALL: 'tasks:get-all',
  TASKS_CREATE: 'tasks:create',
  TASKS_UPDATE: 'tasks:update',
  TASKS_DELETE: 'tasks:delete',
  
  // Daily Records
  DAILY_RECORDS_GET: 'daily-records:get',
  DAILY_RECORDS_SAVE: 'daily-records:save',

  // Task Executions
  TASK_EXECUTIONS_ADJUST_AMOUNT: 'task-executions:adjust-amount',
  
  // Calculation
  CALCULATION_CALCULATE: 'calculation:calculate',
  
  // History
  HISTORY_GET: 'history:get',
  
  // Data Management
  DATA_EXPORT: 'data:export',
  DATA_IMPORT: 'data:import',
  DATA_EXPORT_REQUEST: 'data:export-request',
  DATA_IMPORT_REQUEST: 'data:import-request',
  
  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  
  // Print
  PRINT_RECEIPT: 'print:receipt',
  PRINT_SAVE_PDF: 'print:save-pdf',
  PRINT_PREVIEW: 'print:preview',
  
  // Navigation
  NAVIGATION_NAVIGATE_TO: 'navigation:navigate-to',
  NAVIGATION_ROUTE_CHANGE: 'navigation:route-change'
} as const

// セキュアなIPC通信のためのヘルパー関数
const createSecureInvoker = (eventName: string) => {
  return (...args: any[]) => ipcRenderer.invoke(eventName, ...args)
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI = {
  // Database operations
  dbHealthCheck: createSecureInvoker(IPC_EVENTS.DB_HEALTH_CHECK),
  
  // App information
  getAppVersion: createSecureInvoker(IPC_EVENTS.APP_GET_VERSION),
  
  // Categories
  getAllCategories: createSecureInvoker(IPC_EVENTS.CATEGORIES_GET_ALL),
  createCategory: createSecureInvoker(IPC_EVENTS.CATEGORIES_CREATE),
  updateCategory: createSecureInvoker(IPC_EVENTS.CATEGORIES_UPDATE),
  deleteCategory: createSecureInvoker(IPC_EVENTS.CATEGORIES_DELETE),
  
  // Tasks
  getAllTasks: createSecureInvoker(IPC_EVENTS.TASKS_GET_ALL),
  createTask: createSecureInvoker(IPC_EVENTS.TASKS_CREATE),
  updateTask: createSecureInvoker(IPC_EVENTS.TASKS_UPDATE),
  deleteTask: createSecureInvoker(IPC_EVENTS.TASKS_DELETE),
  
  // Daily records
  getDailyRecord: createSecureInvoker(IPC_EVENTS.DAILY_RECORDS_GET),
  saveDailyRecord: createSecureInvoker(IPC_EVENTS.DAILY_RECORDS_SAVE),

  // Task executions
  adjustTaskExecutionAmount: createSecureInvoker(IPC_EVENTS.TASK_EXECUTIONS_ADJUST_AMOUNT),
  
  // Calculation
  calculateAllowance: createSecureInvoker(IPC_EVENTS.CALCULATION_CALCULATE),
  
  // History
  getHistory: createSecureInvoker(IPC_EVENTS.HISTORY_GET),
  
  // Settings
  getSetting: createSecureInvoker(IPC_EVENTS.SETTINGS_GET),
  setSetting: createSecureInvoker(IPC_EVENTS.SETTINGS_SET),
  
  // Export/Import
  exportData: createSecureInvoker(IPC_EVENTS.DATA_EXPORT),
  importData: createSecureInvoker(IPC_EVENTS.DATA_IMPORT),
  onDataExportRequest: (callback: () => void) => {
    ipcRenderer.on(IPC_EVENTS.DATA_EXPORT_REQUEST, () => callback())
  },
  onDataImportRequest: (callback: () => void) => {
    ipcRenderer.on(IPC_EVENTS.DATA_IMPORT_REQUEST, () => callback())
  },
  
  // Print
  printReceipt: createSecureInvoker(IPC_EVENTS.PRINT_RECEIPT),
  savePDF: createSecureInvoker(IPC_EVENTS.PRINT_SAVE_PDF),
  showPrintPreview: createSecureInvoker(IPC_EVENTS.PRINT_PREVIEW),
  
  // Navigation
  navigateTo: createSecureInvoker(IPC_EVENTS.NAVIGATION_NAVIGATE_TO),
  onNavigationChange: (callback: (route: string) => void) => {
    console.log('[Preload] Setting up navigation listener')
    ipcRenderer.on(IPC_EVENTS.NAVIGATION_ROUTE_CHANGE, (event, route) => {
      console.log(`[Preload] Received navigation event: ${route}`)
      callback(route)
    })
  },
  removeNavigationListener: () => {
    console.log('[Preload] Removing navigation listeners')
    ipcRenderer.removeAllListeners(IPC_EVENTS.NAVIGATION_ROUTE_CHANGE)
  }
}

// Context Bridgeを使用してセキュアにAPIを公開
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// セキュリティ強化: 開発環境でのみデバッグ情報を公開
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronDebug', {
    getProcessInfo: () => ({
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node
    }),
    
    // IPC通信のデバッグ用
    testIPC: (eventName: string, ...args: any[]) => {
      console.log(`[IPC Debug] Invoking: ${eventName}`, args)
      return ipcRenderer.invoke(eventName, ...args)
    }
  })
}

// エラーハンドリング: 未処理のPromise拒否をキャッチ
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// セキュリティ: 外部リンクを安全に処理（レンダラープロセスで実行）
contextBridge.exposeInMainWorld('electronSecurity', {
  openExternalUrl: (url: string) => {
    return ipcRenderer.invoke('app:open-external-url', url)
  }
})