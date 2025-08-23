import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { getMonthlyStore, listMonthlyFiles } from './monthly-store'

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
  settings: Store<Record<string, string>>
  meta: Store<{ version: number }>
}

type RegularStoreKey = keyof Pick<Stores, 'categories' | 'tasks'>
type DataStoreKey = RegularStoreKey | 'dailyRecords' | 'taskExecutions'

const stores: Partial<Stores> = {}

export const setupDatabase = async (): Promise<void> => {
  try {
    userDataPath = app.getPath('userData')

    stores.categories = new Store<Record<string, Category>>({
      name: 'categories',
      cwd: userDataPath,
      defaults: {},
    })
    stores.tasks = new Store<Record<string, Task>>({
      name: 'tasks',
      cwd: userDataPath,
      defaults: {},
    })
    stores.settings = new Store<Record<string, string>>({
      name: 'settings',
      cwd: userDataPath,
      defaults: {},
    })
    stores.meta = new Store<{ version: number }>({
      name: 'meta',
      cwd: userDataPath,
      defaults: { version: 1 },
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

const getDataStore = <T>(name: RegularStoreKey): Store<Record<string, T>> => {
  return getInternalStore(name) as unknown as Store<Record<string, T>>
}

const monthlyBase = (table: 'dailyRecords' | 'taskExecutions') =>
  table === 'dailyRecords' ? 'daily-records' : 'task-executions'

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
  const categories = categoryStore.store as Record<string, Category>
  const tasks = taskStore.store as Record<string, Task>
  const dailyRecords = getAllRecords<DailyRecord>('dailyRecords')
  const taskExecutions = getAllRecords<TaskExecution>('taskExecutions')

  const dailyRecordMap = Object.fromEntries(dailyRecords.map(r => [r.id, r]))

  for (const task of Object.values(tasks)) {
    if (!categories[task.categoryId]) {
      console.warn(`Task ${task.id} references non-existent category ${task.categoryId}`)
      task.categoryId = 'other'
      taskStore.set(task.id, task)
    }
  }

  for (const execution of taskExecutions) {
    if (!tasks[execution.taskId] || !dailyRecordMap[execution.dailyRecordId]) {
      console.warn(`Removing orphan task execution ${execution.id}`)
      deleteRecord('taskExecutions', execution.id)
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
  record: T,
  options?: { date?: string }
): T => {
  if (table === 'dailyRecords') {
    const date = (record as any).date || options?.date
    if (!date) throw new Error('Date required for dailyRecords')
    const [year, month] = date.split('-')
    const store = getMonthlyStore<DailyRecord>(monthlyBase('dailyRecords'), year, month)
    store.set(record.id, record as any)
    return record
  }
  if (table === 'taskExecutions') {
    const date = options?.date
    if (!date) throw new Error('Date required for taskExecutions')
    const [year, month] = date.split('-')
    const store = getMonthlyStore<TaskExecution>(monthlyBase('taskExecutions'), year, month)
    store.set(record.id, record as any)
    return record
  }
  const store = getDataStore<T>(table as RegularStoreKey)
  store.set(record.id, record)
  return record
}

export const getRecord = <T>(
  table: DataStoreKey,
  id: string,
  options?: { date?: string }
): T | null => {
  if (table === 'dailyRecords' || table === 'taskExecutions') {
    const records = getAllRecords<T>(table, options)
    return records.find((r: any) => r.id === id) || null
  }
  const store = getDataStore<T>(table as RegularStoreKey)
  return store.get(id) || null
}

export const getAllRecords = <T>(
  table: DataStoreKey,
  options?: { date?: string }
): T[] => {
  if (table === 'dailyRecords' || table === 'taskExecutions') {
    const base = monthlyBase(table)
    const records: T[] = []
    if (options?.date) {
      const [year, month] = options.date.split('-')
      const store = getMonthlyStore<T>(base, year, month)
      records.push(...Object.values(store.store as Record<string, T>))
    } else {
      for (const { year, month } of listMonthlyFiles(base)) {
        const store = getMonthlyStore<T>(base, year, month)
        records.push(...Object.values(store.store as Record<string, T>))
      }
    }
    return records
  }
  const store = getDataStore<T>(table as RegularStoreKey)
  return Object.values(store.store as Record<string, T>)
}

export const updateRecord = <T extends { id: string }>(
  table: DataStoreKey,
  id: string,
  updates: Partial<T>,
  options?: { date?: string }
): T | null => {
  if (table === 'dailyRecords' || table === 'taskExecutions') {
    const base = monthlyBase(table)
    const applyUpdate = (year: string, month: string): T | null => {
      const store = getMonthlyStore<T>(base, year, month)
      const existing = store.get(id) as T | undefined
      if (!existing) return null
      const updated = { ...existing, ...updates } as T
      store.set(id, updated)
      return updated
    }
    if (options?.date) {
      const [y, m] = options.date.split('-')
      return applyUpdate(y, m)
    }
    for (const { year, month } of listMonthlyFiles(base)) {
      const res = applyUpdate(year, month)
      if (res) return res
    }
    return null
  }
  const store = getDataStore<T>(table as RegularStoreKey)
  const existing = store.get(id)
  if (!existing) return null
  const updated = { ...existing, ...updates }
  store.set(id, updated as T)
  return updated as T
}

export const deleteRecord = (
  table: DataStoreKey,
  id: string,
  options?: { date?: string }
): boolean => {
  if (table === 'dailyRecords' || table === 'taskExecutions') {
    const base = monthlyBase(table)
    const remove = (year: string, month: string): boolean => {
      const store = getMonthlyStore<any>(base, year, month)
      if (!store.has(id)) return false
      store.delete(id)
      return true
    }
    if (options?.date) {
      const [y, m] = options.date.split('-')
      return remove(y, m)
    }
    for (const { year, month } of listMonthlyFiles(base)) {
      if (remove(year, month)) return true
    }
    return false
  }
  const store = getDataStore<any>(table as RegularStoreKey)
  if (!store.has(id)) return false
  store.delete(id)
  return true
}

export const createBackup = (): string => {
  const categories = getInternalStore('categories').store
  const tasks = getInternalStore('tasks').store
  const dailyRecordsArr = getAllRecords<DailyRecord>('dailyRecords')
  const taskExecutionsArr = getAllRecords<TaskExecution>('taskExecutions')
  const settings = getInternalStore('settings').store
  const version = getInternalStore('meta').get('version', 1)

  const dailyRecords = Object.fromEntries(
    dailyRecordsArr.map(r => [r.id, r])
  )
  const taskExecutions = Object.fromEntries(
    taskExecutionsArr.map(e => [e.id, e])
  )

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
    fs.rmSync(path.join(userDataPath, 'daily-records'), { recursive: true, force: true })
    fs.rmSync(path.join(userDataPath, 'task-executions'), { recursive: true, force: true })

    for (const value of Object.values<Record<string, DailyRecord>>(data.dailyRecords)) {
      createRecord('dailyRecords', value)
    }

    const recordDateMap: Record<string, string> = {}
    for (const value of Object.values<Record<string, DailyRecord>>(data.dailyRecords)) {
      recordDateMap[value.id] = value.date
    }

    for (const value of Object.values<Record<string, TaskExecution>>(data.taskExecutions)) {
      const date = recordDateMap[value.dailyRecordId]
      if (date) {
        createRecord('taskExecutions', value, { date })
      }
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
  const dailyRecordsCount = getAllRecords<DailyRecord>('dailyRecords').length
  const taskExecutionsCount = getAllRecords<TaskExecution>('taskExecutions').length

  return {
    categoriesCount: Object.keys(categories).length,
    tasksCount: Object.keys(tasks).length,
    dailyRecordsCount,
    taskExecutionsCount,
    databaseVersion: getInternalStore('meta').get('version', 0)
  }
}

export type { Category, Task, DailyRecord, TaskExecution, DatabaseSchema }

