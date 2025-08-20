// データモデル操作のユーティリティ関数
import { 
  Category, 
  Task, 
  DailyRecord, 
  TaskExecution, 
  TaskExecutionWithDetails,
  DailyRecordWithExecutions,
  AllowanceCalculation,
  CategorySummary,
  TaskDetail,
  AdjustmentSummary,
  StatisticsData,
  CategoryStatistics,
  TaskStatistics,
  TrendData
} from '../types'

/**
 * タスク実行記録に詳細情報を付加
 */
export const enrichTaskExecution = (
  execution: TaskExecution,
  task: Task,
  category: Category
): TaskExecutionWithDetails => {
  return {
    ...execution,
    taskName: task.name,
    categoryName: category.name,
    categoryColor: category.color,
    categoryIcon: category.icon,
    unitPrice: task.unitPrice,
    isAdjusted: execution.adjustedAmount !== undefined && execution.adjustedAmount !== execution.amount
  }
}

/**
 * 日次記録にタスク実行詳細を付加
 */
export const enrichDailyRecord = (
  record: DailyRecord,
  executions: TaskExecution[],
  tasks: Task[],
  categories: Category[]
): DailyRecordWithExecutions => {
  const enrichedExecutions = executions.map(execution => {
    const task = tasks.find(t => t.id === execution.taskId)
    const category = task ? categories.find(c => c.id === task.categoryId) : undefined
    
    if (!task || !category) {
      // データ整合性エラーの場合のフォールバック
      return {
        ...execution,
        taskName: '不明なタスク',
        categoryName: '不明なカテゴリ',
        categoryColor: '#6b7280',
        categoryIcon: '❓',
        unitPrice: 0,
        isAdjusted: false
      }
    }
    
    return enrichTaskExecution(execution, task, category)
  })
  
  return {
    ...record,
    taskExecutions: enrichedExecutions
  }
}

/**
 * お小遣い計算を実行
 */
export const calculateAllowance = (
  date: string,
  executions: TaskExecution[],
  tasks: Task[],
  categories: Category[]
): AllowanceCalculation => {
  // カテゴリ別にグループ化
  const categoryGroups = new Map<string, {
    category: Category
    executions: TaskExecution[]
    tasks: Task[]
  }>()
  
  // 初期化
  categories.forEach(category => {
    categoryGroups.set(category.id, {
      category,
      executions: [],
      tasks: []
    })
  })
  
  // 実行記録をカテゴリ別に分類
  executions.forEach(execution => {
    const task = tasks.find(t => t.id === execution.taskId)
    if (task) {
      const group = categoryGroups.get(task.categoryId)
      if (group) {
        group.executions.push(execution)
        if (!group.tasks.find(t => t.id === task.id)) {
          group.tasks.push(task)
        }
      }
    }
  })
  
  // カテゴリ別集計を作成
  const categoryBreakdown: CategorySummary[] = []
  const taskDetails: TaskDetail[] = []
  let totalAmount = 0
  let totalOriginalAmount = 0
  let totalAdjustedAmount = 0
  let adjustedTasksCount = 0
  const adjustmentReasons: string[] = []
  
  categoryGroups.forEach(({ category, executions: categoryExecutions, tasks: categoryTasks }) => {
    if (categoryExecutions.length === 0) return
    
    let categoryTotalAmount = 0
    let categoryOriginalAmount = 0
    let categoryAdjustedAmount = 0
    let categoryExecutionCount = 0
    const categoryTaskDetails: TaskDetail[] = []
    
    categoryExecutions.forEach(execution => {
      const task = categoryTasks.find(t => t.id === execution.taskId)
      if (!task) return
      
      const originalAmount = execution.amount
      const finalAmount = execution.adjustedAmount ?? execution.amount
      const isAdjusted = execution.adjustedAmount !== undefined && execution.adjustedAmount !== execution.amount
      
      categoryTotalAmount += finalAmount
      categoryOriginalAmount += originalAmount
      if (isAdjusted) {
        categoryAdjustedAmount += (execution.adjustedAmount! - originalAmount)
        adjustedTasksCount++
        if (execution.adjustmentReason && !adjustmentReasons.includes(execution.adjustmentReason)) {
          adjustmentReasons.push(execution.adjustmentReason)
        }
      }
      categoryExecutionCount += execution.count
      
      const taskDetail: TaskDetail = {
        taskId: task.id,
        taskName: task.name,
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color,
        categoryIcon: category.icon,
        count: execution.count,
        unitPrice: task.unitPrice,
        originalAmount,
        adjustedAmount: execution.adjustedAmount,
        adjustmentReason: execution.adjustmentReason,
        isAdjusted,
        adjustedAt: execution.adjustedAt
      }
      
      categoryTaskDetails.push(taskDetail)
      taskDetails.push(taskDetail)
    })
    
    totalAmount += categoryTotalAmount
    totalOriginalAmount += categoryOriginalAmount
    totalAdjustedAmount += categoryAdjustedAmount
    
    const categorySummary: CategorySummary = {
      categoryId: category.id,
      categoryName: category.name,
      categoryColor: category.color,
      categoryIcon: category.icon,
      totalAmount: categoryTotalAmount,
      originalAmount: categoryOriginalAmount,
      adjustedAmount: categoryAdjustedAmount,
      taskCount: categoryTasks.length,
      executionCount: categoryExecutionCount,
      tasks: categoryTaskDetails
    }
    
    categoryBreakdown.push(categorySummary)
  })
  
  // 金額順でソート
  categoryBreakdown.sort((a, b) => b.totalAmount - a.totalAmount)
  taskDetails.sort((a, b) => b.originalAmount - a.originalAmount)
  
  const adjustmentSummary: AdjustmentSummary = {
    totalAdjustments: adjustedTasksCount,
    adjustmentAmount: totalAdjustedAmount,
    adjustedTasksCount,
    adjustmentReasons
  }
  
  return {
    date,
    categoryBreakdown,
    totalAmount,
    taskDetails,
    adjustmentSummary
  }
}

/**
 * 統計データを計算
 */
export const calculateStatistics = (
  records: DailyRecord[],
  executions: TaskExecution[],
  tasks: Task[],
  categories: Category[],
  startDate: string,
  endDate: string
): StatisticsData => {
  const filteredRecords = records.filter(record => 
    record.date >= startDate && record.date <= endDate
  )
  
  const totalAmount = filteredRecords.reduce((sum, record) => sum + record.totalAmount, 0)
  const totalTasks = tasks.length
  const totalExecutions = executions.length
  const dayCount = filteredRecords.length
  const averagePerDay = dayCount > 0 ? Math.round(totalAmount / dayCount) : 0
  
  // カテゴリ統計
  const categoryStats: CategoryStatistics[] = categories.map(category => {
    const categoryTasks = tasks.filter(task => task.categoryId === category.id)
    const categoryExecutions = executions.filter(execution => 
      categoryTasks.some(task => task.id === execution.taskId)
    )
    
    const categoryAmount = categoryExecutions.reduce((sum, execution) => 
      sum + (execution.adjustedAmount ?? execution.amount), 0
    )
    const categoryExecutionCount = categoryExecutions.reduce((sum, execution) => 
      sum + execution.count, 0
    )
    const averageAmount = categoryExecutions.length > 0 ? 
      Math.round(categoryAmount / categoryExecutions.length) : 0
    const percentage = totalAmount > 0 ? Math.round((categoryAmount / totalAmount) * 100) : 0
    
    return {
      category,
      totalAmount: categoryAmount,
      totalExecutions: categoryExecutionCount,
      averageAmount,
      percentage,
      trend: 'stable' as const // TODO: 実際のトレンド計算を実装
    }
  }).filter(stat => stat.totalAmount > 0)
  
  // タスク統計
  const taskStats: TaskStatistics[] = tasks.map(task => {
    const category = categories.find(c => c.id === task.categoryId)!
    const taskExecutions = executions.filter(execution => execution.taskId === task.id)
    
    const taskAmount = taskExecutions.reduce((sum, execution) => 
      sum + (execution.adjustedAmount ?? execution.amount), 0
    )
    const taskExecutionCount = taskExecutions.reduce((sum, execution) => 
      sum + execution.count, 0
    )
    const averageAmount = taskExecutions.length > 0 ? 
      Math.round(taskAmount / taskExecutions.length) : 0
    const frequency = dayCount > 0 ? taskExecutions.length / dayCount : 0
    
    // 最後に実行された日付を取得
    const lastExecution = taskExecutions
      .map(execution => {
        const record = records.find(r => 
          executions.some(e => e.dailyRecordId === r.id && e.id === execution.id)
        )
        return record?.date
      })
      .filter(Boolean)
      .sort()
      .pop()
    
    return {
      task,
      category,
      totalAmount: taskAmount,
      totalExecutions: taskExecutionCount,
      averageAmount,
      frequency,
      lastExecuted: lastExecution
    }
  }).filter(stat => stat.totalAmount > 0)
  
  // トレンドデータ（日別）
  const trends: TrendData[] = filteredRecords.map(record => {
    const recordExecutions = executions.filter(execution => execution.dailyRecordId === record.id)
    const executionCount = recordExecutions.reduce((sum, execution) => sum + execution.count, 0)
    
    const categoryBreakdown = categories.map(category => {
      const categoryTasks = tasks.filter(task => task.categoryId === category.id)
      const categoryExecutions = recordExecutions.filter(execution =>
        categoryTasks.some(task => task.id === execution.taskId)
      )
      const amount = categoryExecutions.reduce((sum, execution) => 
        sum + (execution.adjustedAmount ?? execution.amount), 0
      )
      
      return {
        categoryId: category.id,
        amount
      }
    }).filter(breakdown => breakdown.amount > 0)
    
    return {
      date: record.date,
      amount: record.totalAmount,
      executionCount,
      categoryBreakdown
    }
  }).sort((a, b) => a.date.localeCompare(b.date))
  
  return {
    period: {
      startDate,
      endDate,
      type: dayCount <= 1 ? 'daily' : dayCount <= 7 ? 'weekly' : dayCount <= 31 ? 'monthly' : 'yearly'
    },
    totalAmount,
    totalTasks,
    totalExecutions,
    averagePerDay,
    categoryStats: categoryStats.sort((a, b) => b.totalAmount - a.totalAmount),
    taskStats: taskStats.sort((a, b) => b.totalAmount - a.totalAmount),
    trends
  }
}

/**
 * データの整合性をチェック
 */
export const validateDataIntegrity = (
  categories: Category[],
  tasks: Task[],
  records: DailyRecord[],
  executions: TaskExecution[]
): {
  isValid: boolean
  issues: string[]
} => {
  const issues: string[] = []
  
  // タスクのカテゴリ参照チェック
  tasks.forEach(task => {
    if (!categories.find(category => category.id === task.categoryId)) {
      issues.push(`タスク "${task.name}" が存在しないカテゴリ "${task.categoryId}" を参照しています`)
    }
  })
  
  // 実行記録のタスク参照チェック
  executions.forEach(execution => {
    if (!tasks.find(task => task.id === execution.taskId)) {
      issues.push(`実行記録 "${execution.id}" が存在しないタスク "${execution.taskId}" を参照しています`)
    }
    if (!records.find(record => record.id === execution.dailyRecordId)) {
      issues.push(`実行記録 "${execution.id}" が存在しない日次記録 "${execution.dailyRecordId}" を参照しています`)
    }
  })
  
  // 金額の整合性チェック
  records.forEach(record => {
    const recordExecutions = executions.filter(execution => execution.dailyRecordId === record.id)
    const calculatedTotal = recordExecutions.reduce((sum, execution) => 
      sum + (execution.adjustedAmount ?? execution.amount), 0
    )
    
    if (Math.abs(record.totalAmount - calculatedTotal) > 0.01) {
      issues.push(`日次記録 "${record.date}" の合計金額が実行記録の合計と一致しません`)
    }
  })
  
  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * データをクリーンアップ（孤立したレコードを削除）
 */
export const cleanupOrphanedData = (
  categories: Category[],
  tasks: Task[],
  records: DailyRecord[],
  executions: TaskExecution[]
): {
  cleanedTasks: Task[]
  cleanedExecutions: TaskExecution[]
  removedCount: number
} => {
  let removedCount = 0
  
  // 存在しないカテゴリを参照するタスクを削除
  const cleanedTasks = tasks.filter(task => {
    const exists = categories.find(category => category.id === task.categoryId)
    if (!exists) removedCount++
    return exists
  })
  
  // 存在しないタスクまたは日次記録を参照する実行記録を削除
  const cleanedExecutions = executions.filter(execution => {
    const taskExists = cleanedTasks.find(task => task.id === execution.taskId)
    const recordExists = records.find(record => record.id === execution.dailyRecordId)
    const exists = taskExists && recordExists
    if (!exists) removedCount++
    return exists
  })
  
  return {
    cleanedTasks,
    cleanedExecutions,
    removedCount
  }
}

/**
 * デフォルトのカテゴリを作成
 */
export const createDefaultCategories = (): Omit<Category, 'id'>[] => {
  return [
    {
      name: 'お手伝い',
      color: '#22c55e',
      icon: '🏠',
      createdAt: new Date().toISOString()
    },
    {
      name: '宿題',
      color: '#3b82f6',
      icon: '📚',
      createdAt: new Date().toISOString()
    },
    {
      name: 'その他',
      color: '#8b5cf6',
      icon: '⭐',
      createdAt: new Date().toISOString()
    }
  ]
}

/**
 * サンプルタスクを作成
 */
export const createSampleTasks = (categories: Category[]): Omit<Task, 'id'>[] => {
  const helpCategory = categories.find(c => c.name === 'お手伝い')
  const homeworkCategory = categories.find(c => c.name === '宿題')
  
  const tasks: Omit<Task, 'id'>[] = []
  
  if (helpCategory) {
    tasks.push(
      {
        name: 'お皿洗い',
        categoryId: helpCategory.id,
        unitPrice: 50,
        description: '夕食後のお皿洗い',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: '掃除機かけ',
        categoryId: helpCategory.id,
        unitPrice: 100,
        description: 'リビングの掃除機かけ',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'ゴミ出し',
        categoryId: helpCategory.id,
        unitPrice: 20,
        description: '朝のゴミ出し',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    )
  }
  
  if (homeworkCategory) {
    tasks.push(
      {
        name: '算数の宿題',
        categoryId: homeworkCategory.id,
        unitPrice: 30,
        description: '算数のドリル1ページ',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: '国語の宿題',
        categoryId: homeworkCategory.id,
        unitPrice: 30,
        description: '漢字練習',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    )
  }
  
  return tasks
}