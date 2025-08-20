import React, { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * お小遣い計算ページ（シンプル版）
 */
const CalculationPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [calculation, setCalculation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // 計算実行
  const handleCalculate = async () => {
    if (!selectedDate) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('[CalculationPage] Calculating for date:', selectedDate)
      const result = await window.electronAPI.calculateAllowance(selectedDate)
      
      if (result.success && result.data) {
        setCalculation(result.data)
        console.log('[CalculationPage] Calculation successful:', result.data)
      } else {
        setError(result.error || '計算に失敗しました')
        console.error('[CalculationPage] Calculation failed:', result.error)
      }
    } catch (error) {
      console.error('[CalculationPage] Error during calculation:', error)
      setError('計算中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 日付変更
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value
    setSelectedDate(newDate)
    setCalculation(null) // 前の計算結果をクリア
    setError(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          お小遣い計算
        </h1>
        <p className="text-gray-600">
          今日やったタスクからお小遣いを計算しよう
        </p>
      </div>

      {/* 日付選択 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          📅 計算する日付を選んでください
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <label htmlFor="calculation-date" className="block text-sm font-medium text-gray-700 mb-2">
              日付
            </label>
            <input
              id="calculation-date"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleCalculate}
              disabled={!selectedDate || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium"
            >
              {isLoading ? '計算中...' : '計算する'}
            </button>
          </div>
        </div>
      </div>

      {/* ローディング表示 */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            お小遣いを計算しています...
          </p>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-red-600 text-xl mr-2">⚠️</span>
              <div>
                <h3 className="text-red-800 font-medium">エラーが発生しました</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 計算結果表示 */}
      {calculation && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            💰 計算結果
          </h2>
          
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-green-600 mb-2">
              ¥{calculation.totalAmount?.toLocaleString() || '0'}
            </div>
            <div className="text-gray-600">
              {selectedDate}のお小遣い
            </div>
          </div>

          {calculation.categoryBreakdown && calculation.categoryBreakdown.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">カテゴリ別集計</h3>
              <div className="space-y-2">
                {calculation.categoryBreakdown.map((category: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{category.categoryIcon}</span>
                      <span className="font-medium">{category.categoryName}</span>
                    </div>
                    <span className="font-bold text-green-600">
                      ¥{category.totalAmount?.toLocaleString() || '0'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => console.log('印刷機能は後で実装')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium"
            >
              🖨️ 印刷する
            </button>
          </div>
        </div>
      )}

      {/* データがない場合の表示 */}
      {!calculation && !isLoading && !error && selectedDate && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            {selectedDate}のデータがありません
          </h3>
          <p className="text-gray-600 mb-6">
            この日付のタスク実行記録が見つかりませんでした。<br />
            まずは「タスク入力」でタスクを記録してください。
          </p>
          <Link to="/daily-input">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium inline-flex items-center">
              <span className="text-2xl mr-2">📝</span>
              タスク入力に移動
            </button>
          </Link>
        </div>
      )}

      {/* ナビゲーション */}
      <div className="mt-8 text-center">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/daily-input">
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md font-medium inline-flex items-center">
              <span className="text-2xl mr-2">📝</span>
              タスク入力
            </button>
          </Link>
          <Link to="/history">
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md font-medium inline-flex items-center">
              <span className="text-2xl mr-2">📊</span>
              履歴を見る
            </button>
          </Link>
          <Link to="/">
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md font-medium inline-flex items-center">
              <span className="text-2xl mr-2">🏠</span>
              ホームに戻る
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CalculationPage