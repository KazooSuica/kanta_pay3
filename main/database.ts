import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'
import { app } from 'electron'

// 型定義
interface Category {
  id: string
  name: string
  color: string
  icon: string
  createdAt: string
}

interface Task {
  id: string
  name: string
  categoryId: string
  unitPrice: number
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface DailyRecord {
  id: string
  date: string // YYYY-MM-DD format
  totalAmount: number
  createdAt: string
  updatedAt: string
}

interface TaskExecution {
  id: string
  dailyRecordId: string
  taskId: string
  count: number
  amount: number
  adjustedAmount?: number
  adjustmentReason?: string
  adjustedAt?: string
}

interface DatabaseSchema {
  categories: Record<string, Category>
  tasks: Record<string, Task>
  dailyRecords: Record<string, DailyRecord>
  taskExecutions: Record<string, TaskExecution>
  settings: Record<string, string>
}

type Stores = {
  categories: Store<Record<string, Category>>
  tasks: Store<Record<string, Task>>
  dailyRecords: Store<Record<string, DailyRecord>>
  taskExecutions: Store<Record<string, TaskExecution>>
  settings: Store<Record<string, string>>
  meta: Store<{ version: number }>
}

type DataStoreKey = keyof Pick<Stores, 'categories' | 'tasks' | 'dailyRecords' | 'taskExecutions'>

const stores: Partial<Stores> = {}

export const setupDatabase = async (): Promise<void> => {
  try {
    const userDataPath = app.getPath('userData')

    stores.categories = new Store<Record<string, Category>>({
      name: 'categories',
      cwd: userDataPath,
      defaults: {}
    })
    stores.tasks = new Store<Record<string, Task>>({
      name: 'tasks',
      cwd: userDataPath,
      defaults: {}
    })
    stores.dailyRecords = new Store<Record<string, DailyRecord>>({
      name: 'daily-records',
      cwd: userDataPath,
      defaults: {}
    })
    stores.taskExecutions = new Store<Record<string, TaskExecution>>({
      name: 'task-executions',
      cwd: userDataPath,
      defaults: {}
    })
    stores.settings = new Store<Record<string, string>>({
      name: 'settings',
      cwd: userDataPath,
      defaults: {}
    })
    stores.meta = new Store<{ version: number }>({
      name: 'meta',
      cwd: userDataPath,
      defaults: { version: 1 }
    })

    await runMigrations()
    await initializeDefaultData()

    console.log('Database initialized successfully at:', userDataPath)
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

const getInternalStore = <K extends keyof Stores>(name: K): Stores[K] => {
  const store = stores[name]
  if (!store) throw new Error('Database not initialized')
  return store
}

export const getStore = <K extends keyof Stores>(name: K): Stores[K] => {
  return getInternalStore(name)
}

const getDataStore = <T>(name: DataStoreKey): Store<Record<string, T>> => {
  return getInternalStore(name) as unknown as Store<Record<string, T>>
}

const runMigrations = async (): Promise<void> => {
  const metaStore = getInternalStore('meta')
  const currentVersion = metaStore.get('version', 0)

  if (currentVersion < 1) {
    console.log('Running migration to version 1...')

    await validateDataIntegrity()

    metaStore.set('version', 1)
    console.log('Migration to version 1 completed')
  }
}

const validateDataIntegrity = async (): Promise<void> => {
  const categoryStore = getInternalStore('categories')
  const taskStore = getInternalStore('tasks')
  const dailyRecordStore = getInternalStore('dailyRecords')
  const taskExecutionStore = getInternalStore('taskExecutions')

  const categories = categoryStore.store as Record<string, Category>
  const tasks = taskStore.store as Record<string, Task>
  const dailyRecords = dailyRecordStore.store as Record<string, DailyRecord>
  const taskExecutions = taskExecutionStore.store as Record<string, TaskExecution>

  for (const task of Object.values(tasks)) {
    if (!categories[task.categoryId]) {
      console.warn(`Task ${task.id} references non-existent category ${task.categoryId}`)
      task.categoryId = 'other'
      taskStore.set(task.id, task)
    }
  }

  for (const execution of Object.values(taskExecutions)) {
    if (!tasks[execution.taskId] || !dailyRecords[execution.dailyRecordId]) {
      console.warn(`Removing orphan task execution ${execution.id}`)
      taskExecutionStore.delete(execution.id)
    }
  }
}

const initializeDefaultData = async (): Promise<void> => {
  const categoryStore = getInternalStore('categories')
  const settingsStore = getInternalStore('settings')

  const categories = categoryStore.store as Record<string, Category>

  const defaultCategories: Category[] = [
    {
      id: 'help',
      name: 'お手伝い',
      color: '#22c55e',
      icon: '🏠',
      createdAt: new Date().toISOString()
    },
    {
      id: 'homework',
      name: '宿題',
      color: '#3b82f6',
      icon: '📚',
      createdAt: new Date().toISOString()
    },
    {
      id: 'other',
      name: 'その他',
      color: '#8b5cf6',
      icon: '⭐',
      createdAt: new Date().toISOString()
    }
  ]

  for (const category of defaultCategories) {
    if (!categories[category.id]) {
      categoryStore.set(category.id, category)
    }
  }

  const settings = settingsStore.store as Record<string, string>
  const defaultSettings = {
    childName: '',
    currency: 'JPY',
    dateFormat: 'YYYY-MM-DD',
    theme: 'light'
  }

  for (const [key, value] of Object.entries(defaultSettings)) {
    if (settings[key] === undefined) {
      settingsStore.set(key, value)
    }
  }
}

export const closeDatabase = (): void => {
  for (const key of Object.keys(stores) as (keyof Stores)[]) {
    // electron-store doesn't require explicit close
    stores[key] = undefined as any
  }
}

export const generateId = (): string => {
  return uuidv4()
}

export const createRecord = <T extends { id: string }>(
  table: DataStoreKey,
  record: T
): T => {
  const store = getDataStore<T>(table)
  store.set(record.id, record)
  return record
}

export const getRecord = <T>(
  table: DataStoreKey,
  id: string
): T | null => {
  const store = getDataStore<T>(table)
  return store.get(id) || null
}

export const getAllRecords = <T>(
  table: DataStoreKey
): T[] => {
  const store = getDataStore<T>(table)
  return Object.values(store.store as Record<string, T>)
}

export const updateRecord = <T extends { id: string }>(
  table: DataStoreKey,
  id: string,
  updates: Partial<T>
): T | null => {
  const store = getDataStore<T>(table)
  const existing = store.get(id)
  if (!existing) return null
  const updated = { ...existing, ...updates }
  store.set(id, updated as T)
  return updated as T
}

export const deleteRecord = (
  table: DataStoreKey,
  id: string
): boolean => {
  const store = getDataStore<any>(table)
  if (!store.has(id)) return false
  store.delete(id)
  return true
}

export const createBackup = (): string => {
  const categories = getInternalStore('categories').store
  const tasks = getInternalStore('tasks').store
  const dailyRecords = getInternalStore('dailyRecords').store
  const taskExecutions = getInternalStore('taskExecutions').store
  const settings = getInternalStore('settings').store
  const version = getInternalStore('meta').get('version', 1)

  const allData = {
    categories,
    tasks,
    dailyRecords,
    taskExecutions,
    settings,
    version,
    backupDate: new Date().toISOString()
  }

  return JSON.stringify(allData, null, 2)
}

export const restoreFromBackup = (backupData: string): void => {
  try {
    const data = JSON.parse(backupData)

    if (!data.categories || !data.tasks || !data.dailyRecords || !data.taskExecutions) {
      throw new Error('Invalid backup data format')
    }

    const categoryStore = getInternalStore('categories')
    const taskStore = getInternalStore('tasks')
    const dailyRecordStore = getInternalStore('dailyRecords')
    const taskExecutionStore = getInternalStore('taskExecutions')
    const settingsStore = getInternalStore('settings')
    const metaStore = getInternalStore('meta')

    categoryStore.clear()
    for (const [id, value] of Object.entries<Record<string, Category>>(data.categories)) {
      categoryStore.set(id, value)
    }

    taskStore.clear()
    for (const [id, value] of Object.entries<Record<string, Task>>(data.tasks)) {
      taskStore.set(id, value)
    }

    dailyRecordStore.clear()
    for (const [id, value] of Object.entries<Record<string, DailyRecord>>(data.dailyRecords)) {
      dailyRecordStore.set(id, value)
    }

    taskExecutionStore.clear()
    for (const [id, value] of Object.entries<Record<string, TaskExecution>>(data.taskExecutions)) {
      taskExecutionStore.set(id, value)
    }

    settingsStore.clear()
    for (const [key, value] of Object.entries<Record<string, string>>(data.settings || {})) {
      settingsStore.set(key, value)
    }

    metaStore.set('version', data.version || 1)

    console.log('Database restored from backup successfully')
  } catch (error) {
    console.error('Failed to restore from backup:', error)
    throw new Error('バックアップファイルの形式が正しくありません')
  }
}

export const getDatabaseStats = () => {
  const categories = getInternalStore('categories').store as Record<string, Category>
  const tasks = getInternalStore('tasks').store as Record<string, Task>
  const dailyRecords = getInternalStore('dailyRecords').store as Record<string, DailyRecord>
  const taskExecutions = getInternalStore('taskExecutions').store as Record<string, TaskExecution>

  return {
    categoriesCount: Object.keys(categories).length,
    tasksCount: Object.keys(tasks).length,
    dailyRecordsCount: Object.keys(dailyRecords).length,
    taskExecutionsCount: Object.keys(taskExecutions).length,
    databaseVersion: getInternalStore('meta').get('version', 0)
  }
}

export type { Category, Task, DailyRecord, TaskExecution, DatabaseSchema }

