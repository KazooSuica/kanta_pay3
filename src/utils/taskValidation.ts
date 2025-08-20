import { ValidationError, Task, CreateInput, PartialUpdate } from '../types'

export interface TaskValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export class TaskValidator {
  // タスク名のバリデーション
  static validateTaskName(name: string): ValidationError[] {
    const errors: ValidationError[] = []

    if (!name || name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'タスク名を入力してください',
        code: 'VALIDATION_REQUIRED'
      })
    } else if (name.trim().length > 50) {
      errors.push({
        field: 'name',
        message: 'タスク名は50文字以内で入力してください',
        code: 'VALIDATION_OUT_OF_RANGE'
      })
    } else if (name.trim().length < 2) {
      errors.push({
        field: 'name',
        message: 'タスク名は2文字以上で入力してください',
        code: 'VALIDATION_OUT_OF_RANGE'
      })
    }

    // 特殊文字のチェック
    const invalidChars = /[<>\"'&]/
    if (invalidChars.test(name)) {
      errors.push({
        field: 'name',
        message: 'タスク名に使用できない文字が含まれています',
        code: 'VALIDATION_INVALID_FORMAT'
      })
    }

    return errors
  }

  // 単価のバリデーション
  static validateUnitPrice(unitPrice: number): ValidationError[] {
    const errors: ValidationError[] = []

    if (unitPrice === undefined || unitPrice === null) {
      errors.push({
        field: 'unitPrice',
        message: '単価を入力してください',
        code: 'VALIDATION_REQUIRED'
      })
      return errors
    }

    if (typeof unitPrice !== 'number' || isNaN(unitPrice)) {
      errors.push({
        field: 'unitPrice',
        message: '単価は数値で入力してください',
        code: 'VALIDATION_INVALID_FORMAT'
      })
      return errors
    }

    if (unitPrice < 0) {
      errors.push({
        field: 'unitPrice',
        message: '単価は0円以上で入力してください',
        code: 'VALIDATION_OUT_OF_RANGE'
      })
    }

    if (unitPrice > 10000) {
      errors.push({
        field: 'unitPrice',
        message: '単価は10,000円以下で入力してください',
        code: 'VALIDATION_OUT_OF_RANGE'
      })
    }

    // 小数点以下は許可しない（円単位）
    if (unitPrice % 1 !== 0) {
      errors.push({
        field: 'unitPrice',
        message: '単価は整数で入力してください（小数点は使用できません）',
        code: 'VALIDATION_INVALID_FORMAT'
      })
    }

    return errors
  }

  // カテゴリIDのバリデーション
  static validateCategoryId(categoryId: string): ValidationError[] {
    const errors: ValidationError[] = []

    if (!categoryId || categoryId.trim().length === 0) {
      errors.push({
        field: 'categoryId',
        message: 'カテゴリを選択してください',
        code: 'VALIDATION_REQUIRED'
      })
    }

    return errors
  }

  // 説明のバリデーション
  static validateDescription(description?: string): ValidationError[] {
    const errors: ValidationError[] = []

    if (description && description.length > 200) {
      errors.push({
        field: 'description',
        message: '説明は200文字以内で入力してください',
        code: 'VALIDATION_OUT_OF_RANGE'
      })
    }

    // HTMLタグのチェック
    if (description && /<[^>]*>/g.test(description)) {
      errors.push({
        field: 'description',
        message: '説明にHTMLタグは使用できません',
        code: 'VALIDATION_INVALID_FORMAT'
      })
    }

    return errors
  }

  // タスク作成データの包括的バリデーション
  static validateCreateTaskData(data: CreateInput<Task>): TaskValidationResult {
    const errors: ValidationError[] = []

    // 各フィールドのバリデーション
    errors.push(...this.validateTaskName(data.name))
    errors.push(...this.validateUnitPrice(data.unitPrice))
    errors.push(...this.validateCategoryId(data.categoryId))
    errors.push(...this.validateDescription(data.description))

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // タスク更新データの包括的バリデーション
  static validateUpdateTaskData(data: PartialUpdate<Task>): TaskValidationResult {
    const errors: ValidationError[] = []

    // 更新されるフィールドのみバリデーション
    if (data.name !== undefined) {
      errors.push(...this.validateTaskName(data.name))
    }

    if (data.unitPrice !== undefined) {
      errors.push(...this.validateUnitPrice(data.unitPrice))
    }

    if (data.categoryId !== undefined) {
      errors.push(...this.validateCategoryId(data.categoryId))
    }

    if (data.description !== undefined) {
      errors.push(...this.validateDescription(data.description))
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 単一フィールドのバリデーション（リアルタイム用）
  static validateField(field: keyof Task, value: any): ValidationError[] {
    switch (field) {
      case 'name':
        return this.validateTaskName(value)
      case 'unitPrice':
        return this.validateUnitPrice(value)
      case 'categoryId':
        return this.validateCategoryId(value)
      case 'description':
        return this.validateDescription(value)
      default:
        return []
    }
  }

  // バリデーションエラーメッセージの子供向け変換
  static getChildFriendlyMessage(error: ValidationError): string {
    const childFriendlyMessages: Record<string, string> = {
      'タスク名を入力してください': 'タスクの名前を書いてください',
      'タスク名は50文字以内で入力してください': 'タスクの名前は50文字までです',
      'タスク名は2文字以上で入力してください': 'タスクの名前は2文字以上で書いてください',
      'タスク名に使用できない文字が含まれています': 'タスクの名前に使えない文字があります',
      '単価を入力してください': 'お金の金額を入力してください',
      '単価は数値で入力してください': 'お金の金額は数字で入力してください',
      '単価は0円以上で入力してください': 'お金の金額は0円以上にしてください',
      '単価は10,000円以下で入力してください': 'お金の金額は10,000円以下にしてください',
      '単価は整数で入力してください（小数点は使用できません）': 'お金の金額は整数で入力してください',
      'カテゴリを選択してください': 'カテゴリを選んでください',
      '説明は200文字以内で入力してください': '説明は200文字までです',
      '説明にHTMLタグは使用できません': '説明に特殊な文字は使えません'
    }

    return childFriendlyMessages[error.message] || error.message
  }

  // バリデーション結果を子供向けメッセージに変換
  static toChildFriendlyResult(result: TaskValidationResult): TaskValidationResult {
    return {
      isValid: result.isValid,
      errors: result.errors.map(error => ({
        ...error,
        message: this.getChildFriendlyMessage(error)
      }))
    }
  }
}

// 便利な関数をエクスポート
export const validateTaskName = TaskValidator.validateTaskName
export const validateUnitPrice = TaskValidator.validateUnitPrice
export const validateCategoryId = TaskValidator.validateCategoryId
export const validateDescription = TaskValidator.validateDescription
export const validateCreateTaskData = TaskValidator.validateCreateTaskData
export const validateUpdateTaskData = TaskValidator.validateUpdateTaskData
export const validateTaskField = TaskValidator.validateField

// デフォルトエクスポート
export default TaskValidator