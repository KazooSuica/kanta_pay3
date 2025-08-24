import { 
  ValidationError, 
  ERROR_CODES, 
  Category, 
  Task, 
  TaskExecution,
  TaskFormData,
  CategoryFormData,
  DailyInputFormData,
  AmountAdjustmentFormData,
  CATEGORY_COLORS,
  CATEGORY_ICONS
} from '../types'

/**
 * 必須フィールドのバリデーション
 */
export const validateRequired = (value: string, fieldName: string): ValidationError | null => {
  if (!value || value.trim() === '') {
    return {
      field: fieldName,
      message: `${fieldName}は必須です`,
      code: ERROR_CODES.VALIDATION_REQUIRED
    }
  }
  return null
}

/**
 * 数値の範囲バリデーション
 */
export const validateNumberRange = (
  value: number, 
  min: number, 
  max: number, 
  fieldName: string
): ValidationError | null => {
  if (isNaN(value) || value < min || value > max) {
    return {
      field: fieldName,
      message: `${fieldName}は${min}から${max}の間で入力してください`,
      code: ERROR_CODES.VALIDATION_OUT_OF_RANGE
    }
  }
  return null
}

/**
 * 正の数値バリデーション
 */
export const validatePositiveNumber = (value: number, fieldName: string): ValidationError | null => {
  if (isNaN(value) || value < 0) {
    return {
      field: fieldName,
      message: `${fieldName}は0以上の数値を入力してください`,
      code: ERROR_CODES.VALIDATION_OUT_OF_RANGE
    }
  }
  return null
}

/**
 * 文字列の長さバリデーション
 */
export const validateStringLength = (
  value: string, 
  minLength: number, 
  maxLength: number, 
  fieldName: string
): ValidationError | null => {
  if (value.length < minLength || value.length > maxLength) {
    return {
      field: fieldName,
      message: `${fieldName}は${minLength}文字以上${maxLength}文字以下で入力してください`,
      code: ERROR_CODES.VALIDATION_INVALID_FORMAT
    }
  }
  return null
}

/**
 * タスク名のバリデーション
 */
export const validateTaskName = (name: string): ValidationError[] => {
  const errors: ValidationError[] = []
  
  const requiredError = validateRequired(name, 'タスク名')
  if (requiredError) errors.push(requiredError)
  
  if (name.trim().length > 0) {
    const lengthError = validateStringLength(name.trim(), 1, 50, 'タスク名')
    if (lengthError) errors.push(lengthError)
  }
  
  return errors
}

/**
 * 単価のバリデーション
 */
export const validateUnitPrice = (price: number): ValidationError[] => {
  const errors: ValidationError[] = []
  
  const positiveError = validatePositiveNumber(price, '単価')
  if (positiveError) errors.push(positiveError)
  
  const rangeError = validateNumberRange(price, 0, 10000, '単価')
  if (rangeError) errors.push(rangeError)
  
  return errors
}

/**
 * カテゴリ名のバリデーション
 */
export const validateCategoryName = (name: string): ValidationError[] => {
  const errors: ValidationError[] = []
  
  const requiredError = validateRequired(name, 'カテゴリ名')
  if (requiredError) errors.push(requiredError)
  
  if (name.trim().length > 0) {
    const lengthError = validateStringLength(name.trim(), 1, 20, 'カテゴリ名')
    if (lengthError) errors.push(lengthError)
  }
  
  return errors
}

/**
 * タスク実行回数のバリデーション
 */
export const validateTaskCount = (count: number): ValidationError[] => {
  const errors: ValidationError[] = []
  
  const positiveError = validatePositiveNumber(count, '実行回数')
  if (positiveError) errors.push(positiveError)
  
  const rangeError = validateNumberRange(count, 0, 100, '実行回数')
  if (rangeError) errors.push(rangeError)
  
  return errors
}

/**
 * バリデーションエラーを子供向けメッセージに変換
 */
export const formatValidationErrorsForChild = (errors: ValidationError[]): string[] => {
  return errors.map(error => {
    switch (error.field) {
      case 'タスク名':
        if (error.message.includes('必須')) {
          return 'タスクの名前を入力してください'
        }
        if (error.message.includes('文字')) {
          return 'タスクの名前は50文字以内で入力してください'
        }
        break
      case '単価':
        if (error.message.includes('0以上')) {
          return 'おこづかいの金額は0円以上で入力してください'
        }
        if (error.message.includes('10000')) {
          return 'おこづかいの金額は10000円以下で入力してください'
        }
        break
      case '実行回数':
        if (error.message.includes('0以上')) {
          return '実行回数は0回以上で入力してください'
        }
        if (error.message.includes('100')) {
          return '実行回数は100回以下で入力してください'
        }
        break
      default:
        return error.message
    }
    return error.message
  })
}/**
 
* 日付形式のバリデーション (YYYY-MM-DD)
 */
export const validateDateFormat = (date: string, fieldName: string = '日付'): ValidationError | null => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return {
      field: fieldName,
      message: `${fieldName}はYYYY-MM-DD形式で入力してください`,
      code: ERROR_CODES.VALIDATION_INVALID_FORMAT
    }
  }
  
  // 実際の日付として有効かチェック
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime()) || dateObj.toISOString().slice(0, 10) !== date) {
    return {
      field: fieldName,
      message: `${fieldName}が正しくありません`,
      code: ERROR_CODES.VALIDATION_INVALID_FORMAT
    }
  }
  
  return null
}

/**
 * 色コードのバリデーション (HEX形式)
 */
export const validateColorCode = (color: string, fieldName: string = '色'): ValidationError | null => {
  const colorRegex = /^#[0-9A-Fa-f]{6}$/
  if (!colorRegex.test(color)) {
    return {
      field: fieldName,
      message: `${fieldName}は#から始まる6桁の16進数で入力してください`,
      code: ERROR_CODES.VALIDATION_INVALID_FORMAT
    }
  }
  return null
}

/**
 * アイコンのバリデーション（絵文字）
 */
export const validateIcon = (icon: string, fieldName: string = 'アイコン'): ValidationError | null => {
  if (!icon || icon.trim() === '') {
    return {
      field: fieldName,
      message: `${fieldName}を選択してください`,
      code: ERROR_CODES.VALIDATION_REQUIRED
    }
  }
  
  // 絵文字の基本的なチェック（1-4文字の範囲）
  if (icon.length > 4) {
    return {
      field: fieldName,
      message: `${fieldName}は適切な絵文字を選択してください`,
      code: ERROR_CODES.VALIDATION_INVALID_FORMAT
    }
  }
  
  return null
}

/**
 * 整数のバリデーション
 */
export const validateInteger = (value: number, fieldName: string): ValidationError | null => {
  if (!Number.isInteger(value)) {
    return {
      field: fieldName,
      message: `${fieldName}は整数で入力してください`,
      code: ERROR_CODES.VALIDATION_INVALID_FORMAT
    }
  }
  return null
}

/**
 * カテゴリフォームデータの包括的バリデーション
 */
export const validateCategoryFormData = (data: CategoryFormData): ValidationError[] => {
  const errors: ValidationError[] = []
  
  // 名前のバリデーション
  const nameErrors = validateCategoryName(data.name)
  errors.push(...nameErrors)
  
  // 色のバリデーション
  const colorError = validateColorCode(data.color, 'カテゴリ色')
  if (colorError) errors.push(colorError)
  
  // アイコンのバリデーション
  const iconError = validateIcon(data.icon, 'カテゴリアイコン')
  if (iconError) errors.push(iconError)
  
  return errors
}

/**
 * タスクフォームデータの包括的バリデーション
 */
export const validateTaskFormData = (data: TaskFormData, categories: Category[] = []): ValidationError[] => {
  const errors: ValidationError[] = []
  
  // 名前のバリデーション
  const nameErrors = validateTaskName(data.name)
  errors.push(...nameErrors)
  
  // カテゴリIDのバリデーション
  if (!data.categoryId) {
    errors.push({
      field: 'categoryId',
      message: 'カテゴリを選択してください',
      code: ERROR_CODES.VALIDATION_REQUIRED
    })
  } else if (categories.length > 0 && !categories.find(cat => cat.id === data.categoryId)) {
    errors.push({
      field: 'categoryId',
      message: '選択されたカテゴリが存在しません',
      code: ERROR_CODES.VALIDATION_INVALID_FORMAT
    })
  }
  
  // 単価のバリデーション
  const priceErrors = validateUnitPrice(data.unitPrice)
  errors.push(...priceErrors)
  
  // 説明のバリデーション（オプション）
  if (data.description && data.description.length > 200) {
    errors.push({
      field: 'description',
      message: '説明は200文字以内で入力してください',
      code: ERROR_CODES.VALIDATION_INVALID_FORMAT
    })
  }
  
  return errors
}

/**
 * 日次入力フォームデータの包括的バリデーション
 */
export const validateDailyInputFormData = (data: DailyInputFormData, tasks: Task[] = []): ValidationError[] => {
  const errors: ValidationError[] = []
  
  // 日付のバリデーション
  const dateError = validateDateFormat(data.date)
  if (dateError) errors.push(dateError)
  
  // 未来の日付チェック
  const today = new Date().toISOString().slice(0, 10)
  if (data.date > today) {
    errors.push({
      field: 'date',
      message: '未来の日付は入力できません',
      code: ERROR_CODES.VALIDATION_INVALID_FORMAT
    })
  }
  
  // タスク実行データのバリデーション
  if (!data.taskExecutions || data.taskExecutions.length === 0) {
    errors.push({
      field: 'taskExecutions',
      message: '少なくとも1つのタスクを入力してください',
      code: ERROR_CODES.VALIDATION_REQUIRED
    })
  } else {
    data.taskExecutions.forEach((execution, index) => {
      // タスクIDの存在チェック
      if (!execution.taskId) {
        errors.push({
          field: `taskExecutions[${index}].taskId`,
          message: 'タスクが選択されていません',
          code: ERROR_CODES.VALIDATION_REQUIRED
        })
      } else if (tasks.length > 0 && !tasks.find(task => task.id === execution.taskId)) {
        errors.push({
          field: `taskExecutions[${index}].taskId`,
          message: '選択されたタスクが存在しません',
          code: ERROR_CODES.VALIDATION_INVALID_FORMAT
        })
      }
      
      // 実行回数のバリデーション
      const countErrors = validateTaskCount(execution.count)
      countErrors.forEach(error => {
        errors.push({
          ...error,
          field: `taskExecutions[${index}].count`
        })
      })
    })
  }
  
  return errors
}

/**
 * 金額調整フォームデータのバリデーション
 */
export const validateAmountAdjustmentFormData = (data: AmountAdjustmentFormData): ValidationError[] => {
  const errors: ValidationError[] = []
  
  // 調整金額のバリデーション
  const amountError = validatePositiveNumber(data.adjustedAmount, '調整金額')
  if (amountError) errors.push(amountError)
  
  const rangeError = validateNumberRange(data.adjustedAmount, 0, 50000, '調整金額')
  if (rangeError) errors.push(rangeError)
  
  // 調整理由のバリデーション
  const reasonError = validateRequired(data.adjustmentReason, '調整理由')
  if (reasonError) errors.push(reasonError)
  
  if (data.adjustmentReason && data.adjustmentReason.length > 100) {
    errors.push({
      field: 'adjustmentReason',
      message: '調整理由は100文字以内で入力してください',
      code: ERROR_CODES.VALIDATION_INVALID_FORMAT
    })
  }
  
  return errors
}

/**
 * 子供の名前のバリデーション
 */
export const validateChildName = (name: string): ValidationError[] => {
  const errors: ValidationError[] = []
  
  if (name.trim().length === 0) {
    errors.push({
      field: 'childName',
      message: 'お子さんの名前を入力してください',
      code: ERROR_CODES.VALIDATION_REQUIRED
    })
  } else if (name.length > 20) {
    errors.push({
      field: 'childName',
      message: 'お子さんの名前は20文字以内で入力してください',
      code: ERROR_CODES.VALIDATION_INVALID_FORMAT
    })
  }
  
  return errors
}

/**
 * 重複チェック用のバリデーション
 */
export const validateUniqueName = <T extends { name: string }>(
  name: string,
  existingItems: T[],
  currentId?: string,
  fieldName: string = '名前'
): ValidationError | null => {
  const duplicate = existingItems.find(item => 
    item.name.toLowerCase() === name.toLowerCase() && 
    (currentId ? (item as any).id !== currentId : true)
  )
  
  if (duplicate) {
    return {
      field: fieldName,
      message: `この${fieldName}は既に使用されています`,
      code: ERROR_CODES.VALIDATION_INVALID_FORMAT
    }
  }
  
  return null
}

/**
 * バリデーションエラーを子供向けメッセージに変換（拡張版）
 */
export const formatValidationErrorsForChild = (errors: ValidationError[]): string[] => {
  return errors.map(error => {
    // エラーコードベースの変換
    switch (error.code) {
      case ERROR_CODES.VALIDATION_REQUIRED:
        if (error.field.includes('name') || error.field.includes('名前')) {
          return '名前を入力してください'
        }
        if (error.field.includes('category') || error.field.includes('カテゴリ')) {
          return 'カテゴリを選んでください'
        }
        if (error.field.includes('count') || error.field.includes('回数')) {
          return '回数を入力してください'
        }
        return '必要な項目を入力してください'
        
      case ERROR_CODES.VALIDATION_OUT_OF_RANGE:
        if (error.field.includes('price') || error.field.includes('単価')) {
          return 'おこづかいの金額を正しく入力してください'
        }
        if (error.field.includes('count') || error.field.includes('回数')) {
          return '回数を正しく入力してください'
        }
        return '数字を正しく入力してください'
        
      case ERROR_CODES.VALIDATION_INVALID_FORMAT:
        if (error.field.includes('date') || error.field.includes('日付')) {
          return '日付を正しく選んでください'
        }
        if (error.field.includes('color') || error.field.includes('色')) {
          return '色を正しく選んでください'
        }
        return '正しい形式で入力してください'
    }
    
    // フィールド名ベースの変換（従来の方式）
    switch (error.field) {
      case 'タスク名':
        if (error.message.includes('必須')) {
          return 'タスクの名前を入力してください'
        }
        if (error.message.includes('文字')) {
          return 'タスクの名前は50文字以内で入力してください'
        }
        break
      case '単価':
        if (error.message.includes('0以上')) {
          return 'おこづかいの金額は0円以上で入力してください'
        }
        if (error.message.includes('10000')) {
          return 'おこづかいの金額は10000円以下で入力してください'
        }
        break
      case '実行回数':
        if (error.message.includes('0以上')) {
          return '実行回数は0回以上で入力してください'
        }
        if (error.message.includes('100')) {
          return '実行回数は100回以下で入力してください'
        }
        break
      case 'カテゴリ名':
        if (error.message.includes('必須')) {
          return 'カテゴリの名前を入力してください'
        }
        if (error.message.includes('文字')) {
          return 'カテゴリの名前は20文字以内で入力してください'
        }
        break
      case 'childName':
        return 'お子さんの名前を入力してください'
      default:
        return error.message
    }
    return error.message
  })
}

/**
 * バリデーション結果の型
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  childFriendlyErrors: string[]
}

/**
 * バリデーション結果を作成するヘルパー関数
 */
export const createValidationResult = (errors: ValidationError[]): ValidationResult => {
  return {
    isValid: errors.length === 0,
    errors,
    childFriendlyErrors: formatValidationErrorsForChild(errors)
  }
}

/**
 * 複数のバリデーション結果をマージ
 */
export const mergeValidationResults = (...results: ValidationResult[]): ValidationResult => {
  const allErrors = results.flatMap(result => result.errors)
  return createValidationResult(allErrors)
}