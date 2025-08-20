import { format, parseISO, isValid } from 'date-fns'
import { ja } from 'date-fns/locale'

/**
 * 日付を YYYY-MM-DD 形式の文字列に変換
 */
export const formatDateToString = (date: Date): string => {
  return format(date, 'yyyy-MM-dd')
}

/**
 * YYYY-MM-DD 形式の文字列を Date オブジェクトに変換
 */
export const parseStringToDate = (dateString: string): Date => {
  return parseISO(dateString)
}

/**
 * 日付を日本語形式で表示用にフォーマット
 */
export const formatDateForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseStringToDate(date) : date
  return format(dateObj, 'yyyy年M月d日(E)', { locale: ja })
}

/**
 * 今日の日付を YYYY-MM-DD 形式で取得
 */
export const getTodayString = (): string => {
  return formatDateToString(new Date())
}

/**
 * 日付文字列が有効かどうかチェック
 */
export const isValidDateString = (dateString: string): boolean => {
  try {
    const date = parseStringToDate(dateString)
    return isValid(date)
  } catch {
    return false
  }
}

/**
 * 月の最初の日を取得
 */
export const getFirstDayOfMonth = (date: Date): string => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  return formatDateToString(firstDay)
}

/**
 * 月の最後の日を取得
 */
export const getLastDayOfMonth = (date: Date): string => {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return formatDateToString(lastDay)
}