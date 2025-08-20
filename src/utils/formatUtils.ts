/**
 * 金額を日本円形式でフォーマット
 */
export const formatCurrency = (amount: number): string => {
  return `¥${amount.toLocaleString('ja-JP')}`
}

/**
 * 数値を3桁区切りでフォーマット
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('ja-JP')
}

/**
 * パーセンテージをフォーマット
 */
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%'
  const percentage = (value / total) * 100
  return `${Math.round(percentage)}%`
}

/**
 * 文字列を指定した長さで切り詰める
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}

/**
 * カテゴリ名を表示用にフォーマット（アイコン付き）
 */
export const formatCategoryName = (name: string, icon: string): string => {
  return `${icon} ${name}`
}

/**
 * タスク実行回数を表示用にフォーマット
 */
export const formatTaskCount = (count: number): string => {
  return `${count}回`
}

/**
 * エラーメッセージを子供向けにフォーマット
 */
export const formatChildFriendlyError = (error: string): string => {
  const errorMap: Record<string, string> = {
    'Network Error': 'インターネットに接続できませんでした',
    'Database Error': 'データの保存でエラーが起きました',
    'Validation Error': '入力した内容を確認してください',
    'Not Found': '見つかりませんでした',
    'Permission Denied': '操作する権限がありません'
  }

  return errorMap[error] || 'エラーが起きました。もう一度試してみてください。'
}