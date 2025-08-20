import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'
import { join } from 'path'
import { app } from 'electron'

// データベーススキーマの型定義
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
    version: number
}

let store: Store<DatabaseSchema> | null = null

export const setupDatabase = async (): Promise<void> => {
    try {
        // データベースファイルの保存場所を設定
        const userDataPath = app.getPath('userData')
        const dbPath = join(userDataPath, 'allowance-tracker-data.json')

        store = new Store<DatabaseSchema>({
            name: 'allowance-tracker-data',
            cwd: userDataPath,
            defaults: {
                categories: {},
                tasks: {},
                dailyRecords: {},
                taskExecutions: {},
                settings: {},
                version: 1
            }
        })

        // データベースのマイグレーション実行
        await runMigrations()

        // デフォルトデータの初期化
        await initializeDefaultData()

        console.log('Database initialized successfully at:', dbPath)
    } catch (error) {
        console.error('Failed to initialize database:', error)
        throw error
    }
}

const runMigrations = async (): Promise<void> => {
    if (!store) throw new Error('Database not initialized')

    const currentVersion = store.get('version', 0)

    // バージョン1: 初期スキーマ
    if (currentVersion < 1) {
        console.log('Running migration to version 1...')

        // データ整合性チェック
        await validateDataIntegrity()

        store.set('version', 1)
        console.log('Migration to version 1 completed')
    }
}

const validateDataIntegrity = async (): Promise<void> => {
    if (!store) throw new Error('Database not initialized')

    const categories = store.get('categories', {})
    const tasks = store.get('tasks', {})
    const dailyRecords = store.get('dailyRecords', {})
    const taskExecutions = store.get('taskExecutions', {})

    // カテゴリの整合性チェック
    for (const [taskId, task] of Object.entries(tasks)) {
        if (!categories[task.categoryId]) {
            console.warn(`Task ${taskId} references non-existent category ${task.categoryId}`)
            // デフォルトカテゴリに移動
            task.categoryId = 'other'
        }
    }

    // タスク実行記録の整合性チェック
    for (const [executionId, execution] of Object.entries(taskExecutions)) {
        if (!tasks[execution.taskId]) {
            console.warn(`Task execution ${executionId} references non-existent task ${execution.taskId}`)
            // 無効な実行記録を削除
            delete taskExecutions[executionId]
        }
        if (!dailyRecords[execution.dailyRecordId]) {
            console.warn(`Task execution ${executionId} references non-existent daily record ${execution.dailyRecordId}`)
            // 無効な実行記録を削除
            delete taskExecutions[executionId]
        }
    }

    // 修正されたデータを保存
    store.set('tasks', tasks)
    store.set('taskExecutions', taskExecutions)
}

const initializeDefaultData = async (): Promise<void> => {
    if (!store) throw new Error('Database not initialized')

    const categories = store.get('categories', {})

    // デフォルトカテゴリが存在しない場合のみ追加
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

    let hasChanges = false
    for (const category of defaultCategories) {
        if (!categories[category.id]) {
            categories[category.id] = category
            hasChanges = true
        }
    }

    if (hasChanges) {
        store.set('categories', categories)
        console.log('Default categories initialized')
    }

    // デフォルト設定の初期化
    const settings = store.get('settings', {})
    const defaultSettings = {
        childName: '',
        currency: 'JPY',
        dateFormat: 'YYYY-MM-DD',
        theme: 'light'
    }

    let settingsChanged = false
    for (const [key, value] of Object.entries(defaultSettings)) {
        if (!settings[key]) {
            settings[key] = value
            settingsChanged = true
        }
    }

    if (settingsChanged) {
        store.set('settings', settings)
        console.log('Default settings initialized')
    }
}

// データベース操作のヘルパー関数
export const getStore = (): Store<DatabaseSchema> => {
    if (!store) {
        throw new Error('Database not initialized')
    }
    return store
}

export const closeDatabase = (): void => {
    // electron-store doesn't need explicit closing
    store = null
}

export const generateId = (): string => {
    return uuidv4()
}

// CRUD操作のヘルパー関数
export const createRecord = <T extends { id: string }>(
    table: keyof DatabaseSchema,
    record: T
): T => {
    if (!store) throw new Error('Database not initialized')

    const records = store.get(table as any, {}) as Record<string, T>
    records[record.id] = record
    store.set(table as any, records)

    return record
}

export const getRecord = <T>(
    table: keyof DatabaseSchema,
    id: string
): T | null => {
    if (!store) throw new Error('Database not initialized')

    const records = store.get(table as any, {}) as Record<string, T>
    return records[id] || null
}

export const getAllRecords = <T>(
    table: keyof DatabaseSchema
): T[] => {
    if (!store) throw new Error('Database not initialized')

    const records = store.get(table as any, {}) as Record<string, T>
    return Object.values(records)
}

export const updateRecord = <T extends { id: string }>(
    table: keyof DatabaseSchema,
    id: string,
    updates: Partial<T>
): T | null => {
    if (!store) throw new Error('Database not initialized')

    const records = store.get(table as any, {}) as Record<string, T>
    const existing = records[id]

    if (!existing) return null

    const updated = { ...existing, ...updates } as T
    records[id] = updated
    store.set(table as any, records)

    return updated
}

export const deleteRecord = (
    table: keyof DatabaseSchema,
    id: string
): boolean => {
    if (!store) throw new Error('Database not initialized')

    const records = store.get(table as any, {}) as Record<string, any>

    if (!records[id]) return false

    delete records[id]
    store.set(table as any, records)

    return true
}

// データベースバックアップ機能
export const createBackup = (): string => {
    if (!store) throw new Error('Database not initialized')

    const allData = {
        categories: store.get('categories'),
        tasks: store.get('tasks'),
        dailyRecords: store.get('dailyRecords'),
        taskExecutions: store.get('taskExecutions'),
        settings: store.get('settings'),
        version: store.get('version'),
        backupDate: new Date().toISOString()
    }

    return JSON.stringify(allData, null, 2)
}

export const restoreFromBackup = (backupData: string): void => {
    if (!store) throw new Error('Database not initialized')

    try {
        const data = JSON.parse(backupData)

        // バックアップデータの検証
        if (!data.categories || !data.tasks || !data.dailyRecords || !data.taskExecutions) {
            throw new Error('Invalid backup data format')
        }

        // データを復元
        store.set('categories', data.categories)
        store.set('tasks', data.tasks)
        store.set('dailyRecords', data.dailyRecords)
        store.set('taskExecutions', data.taskExecutions)
        store.set('settings', data.settings || {})
        store.set('version', data.version || 1)

        console.log('Database restored from backup successfully')
    } catch (error) {
        console.error('Failed to restore from backup:', error)
        throw new Error('バックアップファイルの形式が正しくありません')
    }
}

// データベース統計情報
export const getDatabaseStats = () => {
    if (!store) throw new Error('Database not initialized')

    const categories = store.get('categories', {})
    const tasks = store.get('tasks', {})
    const dailyRecords = store.get('dailyRecords', {})
    const taskExecutions = store.get('taskExecutions', {})

    return {
        categoriesCount: Object.keys(categories).length,
        tasksCount: Object.keys(tasks).length,
        dailyRecordsCount: Object.keys(dailyRecords).length,
        taskExecutionsCount: Object.keys(taskExecutions).length,
        databaseVersion: store.get('version', 0)
    }
}

// 型エクスポート
export type { Category, Task, DailyRecord, TaskExecution, DatabaseSchema }