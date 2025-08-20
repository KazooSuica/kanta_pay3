import type { 
  Category, 
  Task, 
  DailyRecord, 
  TaskExecution, 
  ApiResponse, 
  AllowanceCalculation,
  StatisticsData,
  PrintData,
  ExportData,
  CreateInput,
  PartialUpdate
} from './index'

// Electron API types with proper typing
export interface ElectronAPI {
  // Database operations
  dbHealthCheck: () => Promise<ApiResponse<{
    categoriesCount: number
    tasksCount: number
    dailyRecordsCount: number
    taskExecutionsCount: number
    databaseVersion: number
  }>>
  
  // App information
  getAppVersion: () => Promise<string>
  
  // Categories
  getAllCategories: () => Promise<ApiResponse<Category[]>>
  createCategory: (category: CreateInput<Category>) => Promise<ApiResponse<Category>>
  updateCategory: (id: string, updates: PartialUpdate<Category>) => Promise<ApiResponse<Category>>
  deleteCategory: (id: string) => Promise<ApiResponse<void>>
  
  // Tasks
  getAllTasks: () => Promise<ApiResponse<Task[]>>
  createTask: (task: CreateInput<Task>) => Promise<ApiResponse<Task>>
  updateTask: (id: string, updates: PartialUpdate<Task>) => Promise<ApiResponse<Task>>
  deleteTask: (id: string) => Promise<ApiResponse<void>>
  
  // Daily records
  getDailyRecord: (date: string) => Promise<ApiResponse<DailyRecord & { taskExecutions: TaskExecution[] } | null>>
  saveDailyRecord: (record: {
    date: string
    taskExecutions: Omit<TaskExecution, 'id' | 'dailyRecordId'>[]
  }) => Promise<ApiResponse<DailyRecord & { taskExecutions: TaskExecution[] }>>
  
  // Calculation
  calculateAllowance: (date: string) => Promise<ApiResponse<AllowanceCalculation>>
  
  // History
  getHistory: (startDate?: string, endDate?: string) => Promise<ApiResponse<StatisticsData>>
  
  // Settings
  getSetting: (key: string) => Promise<ApiResponse<string | null>>
  setSetting: (key: string, value: string) => Promise<ApiResponse<void>>
  
  // Export/Import
  exportData: () => Promise<ApiResponse<string>> // JSON string
  importData: (backupData: string) => Promise<ApiResponse<void>>
  
  // Print
  printReceipt: (data: PrintData) => Promise<ApiResponse<void>>
  savePDF: (data: PrintData) => Promise<ApiResponse<{ filePath: string }>>
  showPrintPreview: (data: PrintData) => Promise<ApiResponse<void>>
  
  // Navigation
  navigateTo: (route: string) => Promise<ApiResponse<void>>
  onNavigationChange: (callback: (route: string) => void) => void
  removeNavigationListener: () => void
}

// IPC Event handlers type mapping
export interface IPCEventMap {
  // Database
  'db:health-check': () => Promise<ApiResponse>
  
  // App
  'app:get-version': () => Promise<string>
  
  // Categories
  'categories:get-all': () => Promise<ApiResponse<Category[]>>
  'categories:create': (category: CreateInput<Category>) => Promise<ApiResponse<Category>>
  'categories:update': (id: string, updates: PartialUpdate<Category>) => Promise<ApiResponse<Category>>
  'categories:delete': (id: string) => Promise<ApiResponse<void>>
  
  // Tasks
  'tasks:get-all': () => Promise<ApiResponse<Task[]>>
  'tasks:create': (task: CreateInput<Task>) => Promise<ApiResponse<Task>>
  'tasks:update': (id: string, updates: PartialUpdate<Task>) => Promise<ApiResponse<Task>>
  'tasks:delete': (id: string) => Promise<ApiResponse<void>>
  
  // Daily records
  'daily-records:get': (date: string) => Promise<ApiResponse<DailyRecord | null>>
  'daily-records:save': (record: any) => Promise<ApiResponse<DailyRecord>>
  
  // Settings
  'settings:get': (key: string) => Promise<ApiResponse<string | null>>
  'settings:set': (key: string, value: string) => Promise<ApiResponse<void>>
  
  // Data management
  'data:export': () => Promise<ApiResponse<string>>
  'data:import': (data: string) => Promise<ApiResponse<void>>
  
  // Print
  'print:receipt': (data: PrintData) => Promise<ApiResponse<void>>
  'print:save-pdf': (data: PrintData) => Promise<ApiResponse<{ filePath: string }>>
  'print:preview': (data: PrintData) => Promise<ApiResponse<void>>
  
  // Navigation
  'navigation:navigate-to': (route: string) => Promise<ApiResponse<void>>
  'navigation:route-change': (route: string) => void
}

// Extend Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

// Type-safe IPC event names
export type IPCEventName = keyof IPCEventMap

// Helper type for IPC event parameters
export type IPCEventParams<T extends IPCEventName> = Parameters<IPCEventMap[T]>

// Helper type for IPC event return type
export type IPCEventReturn<T extends IPCEventName> = ReturnType<IPCEventMap[T]>