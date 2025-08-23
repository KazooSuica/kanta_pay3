// データベース操作のヘルパー関数
import {
  getStore,
  getAllRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  generateId,
  type Category,
  type Task,
  type DailyRecord,
  type TaskExecution
} from './database'

// カテゴリ関連のヘルパー関数
export const categoryHelpers = {
  // すべてのカテゴリを取得
  getAll: (): Category[] => {
    return getAllRecords<Category>('categories')
  },

  // IDでカテゴリを取得
  getById: (id: string): Category | null => {
    const categories = getAllRecords<Category>('categories')
    return categories.find(cat => cat.id === id) || null
  },

  // カテゴリを作成
  create: (data: Omit<Category, 'id' | 'createdAt'>): Category => {
    const category: Category = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString()
    }
    return createRecord('categories', category)
  },

  // カテゴリを更新
  update: (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>): Category | null => {
    return updateRecord<Category>('categories', id, updates)
  },

  // カテゴリを削除（使用中でない場合のみ）
  delete: (id: string): { success: boolean; error?: string } => {
    // そのカテゴリを使用しているタスクがないかチェック
    const tasks = getAllRecords<Task>('tasks')
    const tasksUsingCategory = tasks.filter(task => task.categoryId === id)
    
    if (tasksUsingCategory.length > 0) {
      return { 
        success: false, 
        error: 'このカテゴリを使用しているタスクがあるため削除できません' 
      }
    }
    
    const deleted = deleteRecord('categories', id)
    return { success: deleted }
  }
}

// タスク関連のヘルパー関数
export const taskHelpers = {
  // すべてのタスクを取得
  getAll: (): Task[] => {
    return getAllRecords<Task>('tasks')
  },

  // 有効なタスクのみを取得
  getActive: (): Task[] => {
    return getAllRecords<Task>('tasks').filter(task => task.isActive)
  },

  // カテゴリ別にタスクを取得
  getByCategory: (categoryId: string): Task[] => {
    return getAllRecords<Task>('tasks').filter(task => task.categoryId === categoryId)
  },

  // IDでタスクを取得
  getById: (id: string): Task | null => {
    const tasks = getAllRecords<Task>('tasks')
    return tasks.find(task => task.id === id) || null
  },

  // タスクを作成
  create: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const now = new Date().toISOString()
    const task: Task = {
      id: generateId(),
      ...data,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now
    }
    return createRecord('tasks', task)
  },

  // タスクを更新
  update: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task | null => {
    return updateRecord<Task>('tasks', id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  },

  // タスクを削除（実行記録がない場合のみ）
  delete: (id: string): { success: boolean; error?: string } => {
    // そのタスクの実行記録がないかチェック
    const taskExecutions = getAllRecords<TaskExecution>('taskExecutions')
    const executionsUsingTask = taskExecutions.filter(execution => execution.taskId === id)
    
    if (executionsUsingTask.length > 0) {
      return { 
        success: false, 
        error: 'このタスクの実行記録があるため削除できません' 
      }
    }
    
    const deleted = deleteRecord('tasks', id)
    return { success: deleted }
  },

  // タスクを無効化
  deactivate: (id: string): Task | null => {
    return updateRecord<Task>('tasks', id, { 
      isActive: false,
      updatedAt: new Date().toISOString()
    })
  },

  // タスクを有効化
  activate: (id: string): Task | null => {
    return updateRecord<Task>('tasks', id, { 
      isActive: true,
      updatedAt: new Date().toISOString()
    })
  }
}

// 日次記録関連のヘルパー関数
export const dailyRecordHelpers = {
  // 日付で記録を取得
  getByDate: (date: string): DailyRecord | null => {
    const records = getAllRecords<DailyRecord>('dailyRecords')
    return records.find(record => record.date === date) || null
  },

  // 期間で記録を取得
  getByDateRange: (startDate: string, endDate: string): DailyRecord[] => {
    const records = getAllRecords<DailyRecord>('dailyRecords')
    return records.filter(record => 
      record.date >= startDate && record.date <= endDate
    ).sort((a, b) => a.date.localeCompare(b.date))
  },

  // すべての記録を取得（日付順）
  getAll: (): DailyRecord[] => {
    const records = getAllRecords<DailyRecord>('dailyRecords')
    return records.sort((a, b) => b.date.localeCompare(a.date)) // 新しい順
  },

  // 記録を作成または更新
  createOrUpdate: (date: string, taskExecutions: Omit<TaskExecution, 'id' | 'dailyRecordId'>[]): DailyRecord => {
    const existing = dailyRecordHelpers.getByDate(date)
    const now = new Date().toISOString()
    
    // 合計金額を計算
    const totalAmount = taskExecutions.reduce((sum, execution) => {
      return sum + (execution.adjustedAmount || execution.amount)
    }, 0)
    
    let dailyRecord: DailyRecord
    
    if (existing) {
      // 既存記録を更新
      dailyRecord = updateRecord<DailyRecord>('dailyRecords', existing.id, {
        totalAmount,
        updatedAt: now
      })!
      
      // 既存のタスク実行記録を削除
      const allExecutions = getAllRecords<TaskExecution>('taskExecutions')
      const executionsToDelete = allExecutions.filter(execution => execution.dailyRecordId === existing.id)
      for (const execution of executionsToDelete) {
        deleteRecord('taskExecutions', execution.id)
      }
    } else {
      // 新しい記録を作成
      dailyRecord = createRecord('dailyRecords', {
        id: generateId(),
        date,
        totalAmount,
        createdAt: now,
        updatedAt: now
      })
    }
    
    // タスク実行記録を保存
    for (const executionData of taskExecutions) {
      const execution: TaskExecution = {
        id: generateId(),
        dailyRecordId: dailyRecord.id,
        ...executionData
      }
      createRecord('taskExecutions', execution)
    }
    
    return dailyRecord
  },

  // 記録を削除
  delete: (id: string): boolean => {
    // 関連するタスク実行記録も削除
    const taskExecutions = getAllRecords<TaskExecution>('taskExecutions')
    const executionsToDelete = taskExecutions.filter(execution => execution.dailyRecordId === id)
    
    for (const execution of executionsToDelete) {
      deleteRecord('taskExecutions', execution.id)
    }
    
    return deleteRecord('dailyRecords', id)
  }
}

// タスク実行記録関連のヘルパー関数
export const taskExecutionHelpers = {
  // 日次記録IDで実行記録を取得
  getByDailyRecordId: (dailyRecordId: string): TaskExecution[] => {
    const executions = getAllRecords<TaskExecution>('taskExecutions')
    return executions.filter(execution => execution.dailyRecordId === dailyRecordId)
  },

  // タスクIDで実行記録を取得
  getByTaskId: (taskId: string): TaskExecution[] => {
    const executions = getAllRecords<TaskExecution>('taskExecutions')
    return executions.filter(execution => execution.taskId === taskId)
  },

  // 金額調整
  adjustAmount: (id: string, adjustedAmount: number, reason: string): TaskExecution | null => {
    return updateRecord<TaskExecution>('taskExecutions', id, {
      adjustedAmount,
      adjustmentReason: reason,
      adjustedAt: new Date().toISOString()
    })
  },

  // 調整をリセット
  resetAdjustment: (id: string): TaskExecution | null => {
    return updateRecord<TaskExecution>('taskExecutions', id, {
      adjustedAmount: undefined,
      adjustmentReason: undefined,
      adjustedAt: undefined
    })
  }
}

// 設定関連のヘルパー関数
export const settingsHelpers = {
  // 設定値を取得
  get: (key: string): string | null => {
    const store = getStore('settings')
    const value = store.get(key)
    return (value as string) ?? null
  },

  // 設定値を保存
  set: (key: string, value: string): void => {
    const store = getStore('settings')
    store.set(key, value)
  },

  // すべての設定を取得
  getAll: (): Record<string, string> => {
    const store = getStore('settings')
    return store.store as Record<string, string>
  },

  // 複数の設定を一度に保存
  setMultiple: (settings: Record<string, string>): void => {
    const store = getStore('settings')
    for (const [key, value] of Object.entries(settings)) {
      store.set(key, value)
    }
  }
}

// 統計・分析関連のヘルパー関数
export const analyticsHelpers = {
  // 月別集計を取得
  getMonthlyStats: (year: number, month: number) => {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`
    
    const records = dailyRecordHelpers.getByDateRange(startDate, endDate)
    const totalAmount = records.reduce((sum, record) => sum + record.totalAmount, 0)
    const totalDays = records.length
    
    return {
      year,
      month,
      totalAmount,
      totalDays,
      averagePerDay: totalDays > 0 ? Math.round(totalAmount / totalDays) : 0,
      records
    }
  },

  // カテゴリ別統計を取得
  getCategoryStats: (startDate: string, endDate: string) => {
    const records = dailyRecordHelpers.getByDateRange(startDate, endDate)
    const categories = categoryHelpers.getAll()
    const tasks = taskHelpers.getAll()
    
    const categoryStats = categories.map(category => {
      const categoryTasks = tasks.filter(task => task.categoryId === category.id)
      let totalAmount = 0
      let totalCount = 0
      
      for (const record of records) {
        const executions = taskExecutionHelpers.getByDailyRecordId(record.id)
        for (const execution of executions) {
          const task = categoryTasks.find(t => t.id === execution.taskId)
          if (task) {
            totalAmount += execution.adjustedAmount || execution.amount
            totalCount += execution.count
          }
        }
      }
      
      return {
        category,
        totalAmount,
        totalCount,
        taskCount: categoryTasks.length
      }
    })
    
    return categoryStats.sort((a, b) => b.totalAmount - a.totalAmount)
  }
}