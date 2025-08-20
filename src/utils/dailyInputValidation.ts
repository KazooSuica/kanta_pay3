import { Task } from '../types'

export interface DailyInputValidationError {
  field: string
  message: string
  code: string
}

export interface DailyInputData {
  date: string
  selectedTasks: Record<string, number>
}

export interface ValidationResult {
  isValid: boolean
  errors: DailyInputValidationError[]
}

/**
 * 日次入力データのバリデーション
 */
export const validateDailyInput = (
  data: DailyInputData,
  tasks: Task[]
): ValidationResult => {
  const errors: DailyInputValidationError[] = []

  // 日付のバリデーション
  if (!data.date) {
    errors.push({
      field: 'date',
      message: '日付が選択されていません',
      code: 'REQUIRED'
    })
  } else if (!isValidDate(data.date)) {
    errors.push({
      field: 'date',
      message: '正しい日付形式ではありません',
      code: 'INVALID_FORMAT'
    })
  } else if (isFutureDate(data.date)) {
    errors.push({
      field: 'date',
      message: '未来の日付は選択できません',
      code: 'FUTURE_DATE'
    })
  }

  // タスク選択のバリデーション
  const selectedTaskEntries = Object.entries(data.selectedTasks).filter(([_, count]) => count > 0)
  
  if (selectedTaskEntries.length === 0) {
    errors.push({
      field: 'selectedTasks',
      message: 'タスクが選択されていません',
      code: 'NO_TASKS_SELECTED'
    })
  }

  // 各タスクの回数バリデーション
  const taskMap = new Map(tasks.map(task => [task.id, task]))
  
  selectedTaskEntries.forEach(([taskId, count]) => {
    const task = taskMap.get(taskId)
    
    if (!task) {
      errors.push({
        field: `task_${taskId}`,
        message: `タスクが見つかりません: ${taskId}`,
        code: 'TASK_NOT_FOUND'
      })
      return
    }

    if (!task.isActive) {
      errors.push({
        field: `task_${taskId}`,
        message: `無効なタスクが選択されています: ${task.name}`,
        code: 'INACTIVE_TASK'
      })
    }

    // 回数の範囲チェック
    if (count < 0) {
      errors.push({
        field: `task_${taskId}_count`,
        message: `${task.name}の回数は0回以上である必要があります`,
        code: 'NEGATIVE_COUNT'
      })
    } else if (count > 99) {
      errors.push({
        field: `task_${taskId}_count`,
        message: `${task.name}の回数は99回以下である必要があります`,
        code: 'COUNT_TOO_HIGH'
      })
    } else if (!Number.isInteger(count)) {
      errors.push({
        field: `task_${taskId}_count`,
        message: `${task.name}の回数は整数である必要があります`,
        code: 'NON_INTEGER_COUNT'
      })
    }
  })

  // 合計金額の上限チェック（1日100万円まで）
  const totalAmount = selectedTaskEntries.reduce((sum, [taskId, count]) => {
    const task = taskMap.get(taskId)
    return sum + (task ? task.unitPrice * count : 0)
  }, 0)

  if (totalAmount > 1000000) {
    errors.push({
      field: 'totalAmount',
      message: '1日の合計金額は100万円以下である必要があります',
      code: 'AMOUNT_TOO_HIGH'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 日付形式の検証（YYYY-MM-DD）
 */
const isValidDate = (dateString: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    return false
  }

  const date = new Date(dateString)
  const [year, month, day] = dateString.split('-').map(Number)
  
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/**
 * 未来の日付かどうかチェック
 */
const isFutureDate = (dateString: string): boolean => {
  const [y, m, d] = dateString.split('-').map(Number)
  const inputDate = new Date(y, m - 1, d)
  inputDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return inputDate.getTime() > today.getTime()
}

/**
 * 子供向けのエラーメッセージに変換
 */
export const getChildFriendlyErrorMessage = (error: DailyInputValidationError): string => {
  switch (error.code) {
    case 'REQUIRED':
      return '日付を選んでね'
    case 'INVALID_FORMAT':
      return '正しい日付を選んでね'
    case 'FUTURE_DATE':
      return 'まだ来ていない日は選べないよ'
    case 'NO_TASKS_SELECTED':
      return 'やったタスクを選んでね'
    case 'TASK_NOT_FOUND':
      return 'タスクが見つからないよ'
    case 'INACTIVE_TASK':
      return '使えないタスクが選ばれているよ'
    case 'NEGATIVE_COUNT':
      return '回数は0回以上にしてね'
    case 'COUNT_TOO_HIGH':
      return '回数は99回以下にしてね'
    case 'NON_INTEGER_COUNT':
      return '回数は整数で入力してね'
    case 'AMOUNT_TOO_HIGH':
      return '1日の合計金額が多すぎるよ'
    default:
      return error.message
  }
}

/**
 * バリデーションエラーを子供向けメッセージに変換
 */
export const formatValidationErrors = (errors: DailyInputValidationError[]): string[] => {
  return errors.map(getChildFriendlyErrorMessage)
}

/**
 * 重複する日付の確認メッセージ
 */
export const getDuplicateDateMessage = (date: string): string => {
  const formattedDate = new Date(date).toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
  
  return `${formattedDate}の記録がすでにあります。上書きしますか？`
}

/**
 * 保存成功メッセージ
 */
export const getSaveSuccessMessage = (date: string, totalAmount: number, taskCount: number): string => {
  const formattedDate = new Date(date).toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
  
  return `${formattedDate}の記録を保存しました！\n合計: ¥${totalAmount.toLocaleString()}\nタスク数: ${taskCount}個`
}