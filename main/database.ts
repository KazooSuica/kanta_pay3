import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, renameSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import type { Category, Task, DailyRecord, TaskExecution } from '../src/types'

let db: Database.Database | null = null

export const setupDatabase = async (): Promise<void> => {
  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'allowance-tracker.db')
  db = new Database(dbPath)
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      unitPrice INTEGER NOT NULL,
      description TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS dailyRecords (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      totalAmount INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS taskExecutions (
      id TEXT PRIMARY KEY,
      dailyRecordId TEXT NOT NULL,
      taskId TEXT NOT NULL,
      count INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      adjustedAmount INTEGER,
      adjustmentReason TEXT,
      adjustedAt TEXT,
      FOREIGN KEY (dailyRecordId) REFERENCES dailyRecords(id),
      FOREIGN KEY (taskId) REFERENCES tasks(id)
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    INSERT OR IGNORE INTO categories (id, name, color, icon, createdAt) VALUES
      ('help', 'お手伝い', '#22c55e', '🏠', datetime('now')),
      ('homework', '宿題', '#3b82f6', '📚', datetime('now')),
      ('other', 'その他', '#8b5cf6', '⭐', datetime('now'));
    INSERT OR IGNORE INTO settings (key, value) VALUES
      ('childName', ''),
      ('currency', 'JPY'),
      ('dateFormat', 'YYYY-MM-DD'),
      ('theme', 'light');
  `)

  await migrateFromJson(userDataPath)
}

export const migrateFromJson = async (userDataPath: string): Promise<void> => {
  const jsonPath = join(userDataPath, 'allowance-tracker-data.json')
  if (!db || !existsSync(jsonPath)) return

  const raw = readFileSync(jsonPath, 'utf-8')
  const data = JSON.parse(raw)

  const insertCategory = db.prepare(`INSERT OR IGNORE INTO categories (id,name,color,icon,createdAt) VALUES (@id,@name,@color,@icon,@createdAt)`)
  Object.values(data.categories || {}).forEach((c: Category) => insertCategory.run(c))

  const insertTask = db.prepare(`INSERT OR IGNORE INTO tasks (id,name,categoryId,unitPrice,description,isActive,createdAt,updatedAt) VALUES (@id,@name,@categoryId,@unitPrice,@description,@isActive,@createdAt,@updatedAt)`)
  Object.values(data.tasks || {}).forEach((t: Task) => insertTask.run(t))

  const insertDaily = db.prepare(`INSERT OR IGNORE INTO dailyRecords (id,date,totalAmount,createdAt,updatedAt) VALUES (@id,@date,@totalAmount,@createdAt,@updatedAt)`)
  Object.values(data.dailyRecords || {}).forEach((d: DailyRecord) => insertDaily.run(d))

  const insertExec = db.prepare(`INSERT OR IGNORE INTO taskExecutions (id,dailyRecordId,taskId,count,amount,adjustedAmount,adjustmentReason,adjustedAt) VALUES (@id,@dailyRecordId,@taskId,@count,@amount,@adjustedAmount,@adjustmentReason,@adjustedAt)`)
  Object.values(data.taskExecutions || {}).forEach((e: TaskExecution) => insertExec.run(e))

  const insertSetting = db.prepare(`INSERT OR REPLACE INTO settings (key,value) VALUES (@key,@value)`)
  Object.entries(data.settings || {}).forEach(([key, value]) => insertSetting.run({ key, value }))

  renameSync(jsonPath, jsonPath + '.bak')
}

export const closeDatabase = (): void => {
  if (db) {
    db.close()
    db = null
  }
}

export const generateId = (): string => uuidv4()

const ensureDb = (): Database.Database => {
  if (!db) throw new Error('Database not initialized')
  return db
}

export const createRecord = <T extends { [key: string]: any }>(table: string, record: T): T => {
  const database = ensureDb()
  const keys = Object.keys(record)
  const columns = keys.join(',')
  const placeholders = keys.map(k => `@${k}`).join(',')
  database.prepare(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`).run(record)
  return record
}

export const getRecord = <T>(table: string, id: string): T | null => {
  const database = ensureDb()
  const row = database.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id)
  return (row as T) || null
}

export const getAllRecords = <T>(table: string): T[] => {
  const database = ensureDb()
  return database.prepare(`SELECT * FROM ${table}`).all() as T[]
}

export const updateRecord = <T extends { [key: string]: any }>(table: string, id: string, updates: Partial<T>): T | null => {
  const database = ensureDb()
  const keys = Object.keys(updates)
  if (keys.length === 0) return getRecord<T>(table, id)
  const setClause = keys.map(k => `${k} = @${k}`).join(', ')
  const params = { ...updates, id }
  const result = database.prepare(`UPDATE ${table} SET ${setClause} WHERE id = @id`).run(params)
  return result.changes > 0 ? getRecord<T>(table, id) : null
}

export const deleteRecord = (table: string, id: string): boolean => {
  const database = ensureDb()
  const result = database.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
  return result.changes > 0
}

export const getSetting = (key: string): string | null => {
  const database = ensureDb()
  const row = database.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? (row as any).value : null
}

export const setSetting = (key: string, value: string): void => {
  const database = ensureDb()
  database.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
}

export const getAllSettings = (): Record<string, string> => {
  const database = ensureDb()
  const rows = database.prepare('SELECT key, value FROM settings').all()
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[(row as any).key] = (row as any).value
  }
  return result
}

export const setMultipleSettings = (settings: Record<string, string>): void => {
  const database = ensureDb()
  const stmt = database.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (@key, @value)')
  const tx = database.transaction((entries: Record<string, string>) => {
    for (const [key, value] of Object.entries(entries)) {
      stmt.run({ key, value })
    }
  })
  tx(settings)
}

export const createBackup = (): string => {
  const data = {
    categories: getAllRecords<Category>('categories'),
    tasks: getAllRecords<Task>('tasks'),
    dailyRecords: getAllRecords<DailyRecord>('dailyRecords'),
    taskExecutions: getAllRecords<TaskExecution>('taskExecutions'),
    settings: getAllSettings(),
    version: 1,
    backupDate: new Date().toISOString()
  }
  return JSON.stringify(data, null, 2)
}

export const restoreFromBackup = (backupData: string): void => {
  const database = ensureDb()
  const data = JSON.parse(backupData)
  const tx = database.transaction(() => {
    database.exec('DELETE FROM taskExecutions; DELETE FROM dailyRecords; DELETE FROM tasks; DELETE FROM categories; DELETE FROM settings;')
    const insertCategory = database.prepare(`INSERT INTO categories (id,name,color,icon,createdAt) VALUES (@id,@name,@color,@icon,@createdAt)`)
    const insertTask = database.prepare(`INSERT INTO tasks (id,name,categoryId,unitPrice,description,isActive,createdAt,updatedAt) VALUES (@id,@name,@categoryId,@unitPrice,@description,@isActive,@createdAt,@updatedAt)`)
    const insertDaily = database.prepare(`INSERT INTO dailyRecords (id,date,totalAmount,createdAt,updatedAt) VALUES (@id,@date,@totalAmount,@createdAt,@updatedAt)`)
    const insertExec = database.prepare(`INSERT INTO taskExecutions (id,dailyRecordId,taskId,count,amount,adjustedAmount,adjustmentReason,adjustedAt) VALUES (@id,@dailyRecordId,@taskId,@count,@amount,@adjustedAmount,@adjustmentReason,@adjustedAt)`)
    const insertSetting = database.prepare(`INSERT INTO settings (key,value) VALUES (@key,@value)`)

    for (const c of data.categories || []) insertCategory.run(c)
    for (const t of data.tasks || []) insertTask.run(t)
    for (const d of data.dailyRecords || []) insertDaily.run(d)
    for (const e of data.taskExecutions || []) insertExec.run(e)
    for (const [key, value] of Object.entries(data.settings || {})) insertSetting.run({ key, value })
  })
  tx()
}

export const getDatabaseStats = () => {
  const database = ensureDb()
  return {
    categoriesCount: database.prepare('SELECT COUNT(*) as c FROM categories').get().c as number,
    tasksCount: database.prepare('SELECT COUNT(*) as c FROM tasks').get().c as number,
    dailyRecordsCount: database.prepare('SELECT COUNT(*) as c FROM dailyRecords').get().c as number,
    taskExecutionsCount: database.prepare('SELECT COUNT(*) as c FROM taskExecutions').get().c as number,
    databaseVersion: 1
  }
}

export type { Category, Task, DailyRecord, TaskExecution }

