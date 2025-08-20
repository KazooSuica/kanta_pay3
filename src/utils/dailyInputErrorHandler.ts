import { AppError, ERROR_CODES } from '../types'

export interface DailyInputError {
  type: 'validation' | 'network' | 'database' | 'system'
  code: string
  message: string
  childFriendlyMessage: string
  recoverable: boolean
  retryable: boolean
}

/**
 * エラーを子供向けのメッセージに変換
 */
export const handleDailyInputError = (error: unknown): DailyInputError => {
  // AppErrorの場合
  if (isAppError(error)) {
    return handleAppError(error)
  }

  // 一般的なErrorの場合
  if (error instanceof Error) {
    return handleGenericError(error)
  }

  // その他の場合
  return {
    type: 'system',
    code: 'UNKNOWN_ERROR',
    message: String(error),
    childFriendlyMessage: '何かがうまくいかなかったよ。もう一度試してみてね。',
    recoverable: true,
    retryable: true
  }
}

/**
 * AppErrorの処理
 */
const handleAppError = (error: AppError): DailyInputError => {
  switch (error.code) {
    case ERROR_CODES.DB_CONNECTION_FAILED:
      return {
        type: 'database',
        code: error.code,
        message: error.message,
        childFriendlyMessage: 'データの保存場所に接続できないよ。アプリを再起動してみてね。',
        recoverable: true,
        retryable: true
      }

    case ERROR_CODES.DB_OPERATION_FAILED:
      return {
        type: 'database',
        code: error.code,
        message: error.message,
        childFriendlyMessage: 'データの保存に失敗したよ。もう一度試してみてね。',
        recoverable: true,
        retryable: true
      }

    case ERROR_CODES.DB_VALIDATION_FAILED:
      return {
        type: 'validation',
        code: error.code,
        message: error.message,
        childFriendlyMessage: '入力した内容に問題があるよ。確認してみてね。',
        recoverable: true,
        retryable: false
      }

    case ERROR_CODES.IPC_COMMUNICATION_FAILED:
      return {
        type: 'network',
        code: error.code,
        message: error.message,
        childFriendlyMessage: 'アプリの内部で通信エラーが起きたよ。アプリを再起動してみてね。',
        recoverable: true,
        retryable: true
      }

    case ERROR_CODES.VALIDATION_REQUIRED:
      return {
        type: 'validation',
        code: error.code,
        message: error.message,
        childFriendlyMessage: '必要な情報が入力されていないよ。',
        recoverable: true,
        retryable: false
      }

    case ERROR_CODES.VALIDATION_INVALID_FORMAT:
      return {
        type: 'validation',
        code: error.code,
        message: error.message,
        childFriendlyMessage: '入力の形式が正しくないよ。',
        recoverable: true,
        retryable: false
      }

    case ERROR_CODES.VALIDATION_OUT_OF_RANGE:
      return {
        type: 'validation',
        code: error.code,
        message: error.message,
        childFriendlyMessage: '数字が範囲外だよ。正しい数字を入力してね。',
        recoverable: true,
        retryable: false
      }

    default:
      return {
        type: 'system',
        code: error.code,
        message: error.message,
        childFriendlyMessage: 'エラーが発生したよ。もう一度試してみてね。',
        recoverable: true,
        retryable: true
      }
  }
}

/**
 * 一般的なErrorの処理
 */
const handleGenericError = (error: Error): DailyInputError => {
  const message = error.message.toLowerCase()

  // ネットワーク関連エラー
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      type: 'network',
      code: 'NETWORK_ERROR',
      message: error.message,
      childFriendlyMessage: 'インターネットの接続に問題があるよ。接続を確認してみてね。',
      recoverable: true,
      retryable: true
    }
  }

  // データベース関連エラー
  if (message.includes('database') || message.includes('sqlite') || message.includes('storage')) {
    return {
      type: 'database',
      code: 'DATABASE_ERROR',
      message: error.message,
      childFriendlyMessage: 'データの保存に問題があるよ。アプリを再起動してみてね。',
      recoverable: true,
      retryable: true
    }
  }

  // バリデーション関連エラー
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return {
      type: 'validation',
      code: 'VALIDATION_ERROR',
      message: error.message,
      childFriendlyMessage: '入力した内容を確認してみてね。',
      recoverable: true,
      retryable: false
    }
  }

  // その他のエラー
  return {
    type: 'system',
    code: 'GENERIC_ERROR',
    message: error.message,
    childFriendlyMessage: 'エラーが発生したよ。もう一度試してみてね。',
    recoverable: true,
    retryable: true
  }
}

/**
 * AppErrorかどうかを判定
 */
const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error
  )
}

/**
 * エラーの重要度を判定
 */
export const getErrorSeverity = (error: DailyInputError): 'low' | 'medium' | 'high' | 'critical' => {
  switch (error.type) {
    case 'validation':
      return 'low'
    case 'network':
      return 'medium'
    case 'database':
      return 'high'
    case 'system':
      return 'critical'
    default:
      return 'medium'
  }
}

/**
 * エラーに応じた推奨アクションを取得
 */
export const getRecommendedAction = (error: DailyInputError): {
  primary: string
  secondary?: string
  icon: string
} => {
  switch (error.type) {
    case 'validation':
      return {
        primary: '入力内容を確認する',
        icon: '✏️'
      }

    case 'network':
      return {
        primary: 'もう一度試す',
        secondary: 'インターネット接続を確認する',
        icon: '🔄'
      }

    case 'database':
      return {
        primary: 'アプリを再起動する',
        secondary: 'しばらく待ってから試す',
        icon: '🔄'
      }

    case 'system':
      return {
        primary: 'アプリを再起動する',
        secondary: 'おうちの人に相談する',
        icon: '🆘'
      }

    default:
      return {
        primary: 'もう一度試す',
        icon: '🔄'
      }
  }
}

/**
 * エラーログを記録
 */
export const logDailyInputError = (error: DailyInputError, context?: Record<string, any>): void => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    error,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  }

  console.error('[DailyInput Error]', logEntry)

  // 本番環境では外部ログサービスに送信することも可能
  if (process.env.NODE_ENV === 'production') {
    // TODO: 外部ログサービスへの送信
  }
}

/**
 * エラー回復のための推奨待機時間（ミリ秒）
 */
export const getRetryDelay = (error: DailyInputError, attemptCount: number): number => {
  const baseDelay = 1000 // 1秒

  switch (error.type) {
    case 'validation':
      return 0 // バリデーションエラーは即座に再試行可能

    case 'network':
      return baseDelay * Math.pow(2, attemptCount) // 指数バックオフ

    case 'database':
      return baseDelay * (attemptCount + 1) // 線形増加

    case 'system':
      return baseDelay * 5 // 固定5秒

    default:
      return baseDelay
  }
}

/**
 * 最大再試行回数を取得
 */
export const getMaxRetryAttempts = (error: DailyInputError): number => {
  switch (error.type) {
    case 'validation':
      return 0 // バリデーションエラーは再試行しない

    case 'network':
      return 3

    case 'database':
      return 2

    case 'system':
      return 1

    default:
      return 1
  }
}