import { ValidationError } from '../types'

/**
 * バリデーションヘルパー関数集
 * 子供向けアプリケーションに特化したバリデーション機能を提供
 */

// エラーメッセージの重要度レベル
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// 拡張されたバリデーションエラー
export interface ExtendedValidationError extends ValidationError {
  severity?: ValidationSeverity
  helpText?: string
  childFriendlyMessage?: string
}

// バリデーション結果
export interface ValidationResult {
  isValid: boolean
  errors: ExtendedValidationError[]
  warnings: ExtendedValidationError[]
  hasErrors: boolean
  hasWarnings: boolean
}

/**
 * バリデーション結果を作成
 */
export function createValidationResult(
  errors: ExtendedValidationError[] = [],
  warnings: ExtendedValidationError[] = []
): ValidationResult {
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0
  }
}

/**
 * エラーメッセージを子供向けに変換
 */
export function toChildFriendlyMessage(message: string): string {
  const translations: Record<string, string> = {
    // タスク関連
    'タスク名を入力してください': 'タスクの名前を書いてください',
    'タスク名は50文字以内で入力してください': 'タスクの名前は50文字までです',
    'タスク名は2文字以上で入力してください': 'タスクの名前は2文字以上で書いてください',
    'タスク名に使用できない文字が含まれています': 'タスクの名前に使えない文字があります',
    
    // 単価関連
    '単価を入力してください': 'お金の金額を入力してください',
    '単価は数値で入力してください': 'お金の金額は数字で入力してください',
    '単価は0円以上で入力してください': 'お金の金額は0円以上にしてください',
    '単価は10,000円以下で入力してください': 'お金の金額は10,000円以下にしてください',
    '単価は整数で入力してください': 'お金の金額は整数で入力してください',
    
    // カテゴリ関連
    'カテゴリを選択してください': 'カテゴリを選んでください',
    'カテゴリが存在しません': '選んだカテゴリが見つかりません',
    
    // 説明関連
    '説明は200文字以内で入力してください': '説明は200文字までです',
    '説明にHTMLタグは使用できません': '説明に特殊な文字は使えません',
    
    // 一般的なエラー
    '必須項目です': 'この項目は必ず入力してください',
    '入力形式が正しくありません': '入力の形式が間違っています',
    '値が範囲外です': '入力した値が範囲を超えています'
  }

  return translations[message] || message
}

/**
 * ヘルプテキストを生成
 */
export function generateHelpText(field: string, error: ValidationError): string {
  const helpTexts: Record<string, Record<string, string>> = {
    name: {
      'VALIDATION_REQUIRED': 'タスクの名前を入力してください。例：「お皿洗い」「宿題」など',
      'VALIDATION_OUT_OF_RANGE': 'タスクの名前は2文字以上50文字以内で入力してください',
      'VALIDATION_INVALID_FORMAT': '< > " \' & などの特殊文字は使用できません'
    },
    unitPrice: {
      'VALIDATION_REQUIRED': '1回あたりの金額を入力してください',
      'VALIDATION_OUT_OF_RANGE': '0円から10,000円までの金額を入力してください',
      'VALIDATION_INVALID_FORMAT': '整数で入力してください（小数点は使用できません）'
    },
    categoryId: {
      'VALIDATION_REQUIRED': 'タスクのカテゴリを選択してください'
    },
    description: {
      'VALIDATION_OUT_OF_RANGE': '説明は200文字以内で入力してください',
      'VALIDATION_INVALID_FORMAT': 'HTMLタグや特殊文字は使用できません'
    }
  }

  return helpTexts[field]?.[error.code || ''] || '入力内容を確認してください'
}

/**
 * バリデーションエラーを拡張
 */
export function enhanceValidationError(
  error: ValidationError,
  severity: ValidationSeverity = ValidationSeverity.ERROR
): ExtendedValidationError {
  return {
    ...error,
    severity,
    childFriendlyMessage: toChildFriendlyMessage(error.message),
    helpText: generateHelpText(error.field, error)
  }
}

/**
 * バリデーションエラーの配列を拡張
 */
export function enhanceValidationErrors(
  errors: ValidationError[],
  severity: ValidationSeverity = ValidationSeverity.ERROR
): ExtendedValidationError[] {
  return errors.map(error => enhanceValidationError(error, severity))
}

/**
 * フィールド別エラーメッセージを取得
 */
export function getFieldError(
  errors: ValidationError[],
  field: string
): ValidationError | undefined {
  return errors.find(error => error.field === field)
}

/**
 * フィールド別エラーメッセージを取得（子供向け）
 */
export function getChildFriendlyFieldError(
  errors: ExtendedValidationError[],
  field: string
): string | undefined {
  const error = errors.find(error => error.field === field)
  return error?.childFriendlyMessage || error?.message
}

/**
 * バリデーション結果をコンソールに出力（デバッグ用）
 */
export function logValidationResult(result: ValidationResult, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    const prefix = context ? `[${context}]` : '[Validation]'
    
    if (result.isValid) {
      console.log(`${prefix} ✅ Validation passed`)
    } else {
      console.group(`${prefix} ❌ Validation failed`)
      
      if (result.hasErrors) {
        console.group('Errors:')
        result.errors.forEach(error => {
          console.error(`- ${error.field}: ${error.message}`)
        })
        console.groupEnd()
      }
      
      if (result.hasWarnings) {
        console.group('Warnings:')
        result.warnings.forEach(warning => {
          console.warn(`- ${warning.field}: ${warning.message}`)
        })
        console.groupEnd()
      }
      
      console.groupEnd()
    }
  }
}

/**
 * バリデーション結果をユーザーフレンドリーな形式で取得
 */
export function formatValidationSummary(result: ValidationResult): string {
  if (result.isValid) {
    return '入力内容に問題はありません'
  }

  const errorCount = result.errors.length
  const warningCount = result.warnings.length

  let summary = ''
  
  if (errorCount > 0) {
    summary += `${errorCount}個のエラーがあります`
  }
  
  if (warningCount > 0) {
    if (summary) summary += '、'
    summary += `${warningCount}個の警告があります`
  }

  return summary
}

/**
 * 入力値のサニタイズ
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // 危険な文字を除去
    .replace(/\s+/g, ' ') // 連続する空白を単一の空白に
}

/**
 * 数値の正規化
 */
export function normalizeNumber(value: any): number {
  if (typeof value === 'number') {
    return Math.round(value) // 整数に丸める
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''))
    return isNaN(parsed) ? 0 : Math.round(parsed)
  }
  
  return 0
}

/**
 * バリデーション設定
 */
export interface ValidationConfig {
  enableChildFriendlyMessages: boolean
  enableRealTimeValidation: boolean
  enableHelpText: boolean
  logValidationResults: boolean
}

export const defaultValidationConfig: ValidationConfig = {
  enableChildFriendlyMessages: true,
  enableRealTimeValidation: true,
  enableHelpText: true,
  logValidationResults: process.env.NODE_ENV === 'development'
}