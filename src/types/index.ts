// ===== 基本データモデル =====

// カテゴリ
export interface Category {
  id: string
  name: string
  color: string
  icon: string
  createdAt: string
}

// タスク
export interface Task {
  id: string
  name: string
  categoryId: string
  unitPrice: number
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 日次記録
export interface DailyRecord {
  id: string
  date: string // YYYY-MM-DD format
  totalAmount: number
  createdAt: string
  updatedAt: string
}

// タスク実行記録
export interface TaskExecution {
  id: string
  dailyRecordId: string
  taskId: string
  count: number
  amount: number
  adjustedAmount?: number
  adjustmentReason?: string
  adjustedAt?: string
}

// お小遣い計算結果
export interface AllowanceCalculation {
  date: string
  categoryBreakdown: CategorySummary[]
  totalAmount: number
  taskDetails: TaskDetail[]
  adjustmentSummary?: AdjustmentSummary
}

// カテゴリ別集計
export interface CategorySummary {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  totalAmount: number
  originalAmount?: number
  adjustedAmount?: number
  taskCount: number
  executionCount?: number
  tasks?: TaskDetail[]
}

// タスク詳細
export interface TaskDetail {
  taskExecutionId?: string
  taskId: string
  taskName: string
  categoryId?: string
  categoryName: string
  categoryColor?: string
  categoryIcon?: string
  count: number
  unitPrice: number
  originalAmount?: number
  adjustedAmount?: number
  adjustmentReason?: string
  isAdjusted?: boolean
  adjustedAt?: string
}

// 調整サマリー
export interface AdjustmentSummary {
  totalAdjustments?: number
  adjustmentAmount?: number
  adjustedTasksCount: number
  adjustmentReasons?: string[]
}

// 統計データ
export interface StatisticsData {
  period?: {
    startDate: string
    endDate: string
    type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  }
  totalAmount: number
  totalTasks: number
  totalExecutions: number
  averagePerDay: number
  categoryStats?: CategoryStatistics[]
  taskStats?: TaskStatistics[]
  trends?: TrendData[]
}

// カテゴリ統計
export interface CategoryStatistics {
  category: Category
  totalAmount: number
  totalExecutions: number
  averageAmount: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

// タスク統計
export interface TaskStatistics {
  task: Task
  category: Category
  totalAmount: number
  totalExecutions: number
  averageAmount: number
  frequency: number
  lastExecuted?: string
}

// トレンドデータ
export interface TrendData {
  date: string
  amount: number
  executionCount: number
  categoryBreakdown?: {
    categoryId: string
    amount: number
  }[]
}

// ===== API・通信関連の型 =====

// API レスポンス型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// ===== フォーム関連の型 =====

// ローディング状態
export interface LoadingState {
  isLoading: boolean
  error?: string
}

// 印刷データ
export interface PrintData {
  type: 'receipt' | 'summary' | 'history'
  title: string
  date: string
  childName: string
  data: AllowanceCalculation | StatisticsData
  options?: PrintOptions
}

// 印刷オプション
export interface PrintOptions {
  includeAdjustments?: boolean
  includeCategoryBreakdown?: boolean
  includeTaskDetails?: boolean
  paperSize?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

// ===== ユーティリティ型 =====

// 部分的な更新用型
export type PartialUpdate<T> = Partial<Omit<T, 'id' | 'createdAt'>>

// 作成用型（IDと作成日時を除く）
export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

// アプリケーションエラー
export interface AppError {
  code: string
  message: string
  details?: string
  timestamp: string
  context?: Record<string, any>
}

// カテゴリ用カラーオプション
export const CATEGORY_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#6366f1'  // indigo
] as const

// カテゴリ用アイコンオプション
export const CATEGORY_ICONS = [
  '🏠', '📚', '⭐', '🧹', '🍽️', '🗑️', '🌱', '🎯', '💪', '🎨',
  '🏃', '🎵', '🔧', '💡', '🎪', '🌟', '🏆', '🎁', '🌈', '⚡'
] as const

// ===== 型ガード関数 =====

export function isCategory(obj: any): obj is Category {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string'
}

export function isTask(obj: any): obj is Task {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.categoryId === 'string'
}

export function isDailyRecord(obj: any): obj is DailyRecord {
  return obj && typeof obj.id === 'string' && typeof obj.date === 'string'
}

export function isTaskExecution(obj: any): obj is TaskExecution {
  return obj && typeof obj.id === 'string' && typeof obj.taskId === 'string' && typeof obj.count === 'number'
}

export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return obj && typeof obj.success === 'boolean'
}