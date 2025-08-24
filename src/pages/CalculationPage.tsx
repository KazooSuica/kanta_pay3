import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import BottomNavigation from '../components/common/BottomNavigation'

/**
 * おこづかい計算ページ（シンプル版）
 */
const CalculationPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [calculation, setCalculation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [childName, setChildName] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [hasTaskData, setHasTaskData] = useState<boolean | null>(null)

  useEffect(() => {
    const fetchChildName = async () => {
      try {
        const result = await window.electronAPI.getSetting('childName')
        if (result.success) {
          setChildName(result.data || '')
        }
      } catch (err) {
        console.error('[CalculationPage] Failed to load child name:', err)
      }
    }
    fetchChildName()
  }, [])

  // 選択した日付にデータがあるかを確認
  useEffect(() => {
    const checkDailyRecord = async () => {
      if (!selectedDate) {
        setHasTaskData(null)
        return
      }
      try {
        const result = await window.electronAPI.getDailyRecord(selectedDate)
        if (result.success && result.data && result.data.taskExecutions?.length > 0) {
          setHasTaskData(true)
        } else {
          setHasTaskData(false)
        }
      } catch (err) {
        console.error('[CalculationPage] Failed to check daily record:', err)
        setHasTaskData(false)
      }
    }
    checkDailyRecord()
  }, [selectedDate])

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
    setHasTaskData(null)
  }

  const pieStyle = useMemo(() => {
    if (!calculation?.categoryBreakdown) return {}
    let current = 0
    const segments = calculation.categoryBreakdown.map((cat: any) => {
      const percent = calculation.totalAmount > 0 ? (cat.totalAmount / calculation.totalAmount) * 100 : 0
      const start = current
      current += percent
      return `${cat.categoryColor} ${start}% ${current}%`
    })
    return { background: `conic-gradient(${segments.join(',')})` }
  }, [calculation])

  const startAdjust = (task: any) => {
    setEditingTaskId(task.taskExecutionId)
    setAdjustAmount(String(task.adjustedAmount ?? task.originalAmount ?? 0))
    setAdjustReason(task.adjustmentReason || '')
  }

  const cancelAdjust = () => {
    setEditingTaskId(null)
    setAdjustAmount('')
    setAdjustReason('')
  }

  const submitAdjust = async () => {
    if (!editingTaskId) return
    const amountNum = parseInt(adjustAmount, 10)
    try {
      const result = await window.electronAPI.adjustTaskExecutionAmount(editingTaskId, amountNum, adjustReason)
      if (!result.success) {
        setError(result.error || '金額調整に失敗しました')
      }
    } catch (err) {
      console.error('[CalculationPage] Adjust amount failed:', err)
      setError('金額調整中にエラーが発生しました')
    }
    cancelAdjust()
    await handleCalculate()
  }

  const createPrintData = () => ({
    type: 'receipt' as const,
    title: 'おこづかい計算結果',
    date: selectedDate,
    childName: childName,
    data: calculation,
    options: {
      includeAdjustments: true,
      includeCategoryBreakdown: true,
      includeTaskDetails: true,
      paperSize: 'A4',
      orientation: 'portrait',
      margins: { top: 10, right: 10, bottom: 10, left: 10 }
    }
  })

  const handlePrint = async () => {
    if (!calculation) return
    const result = await window.electronAPI.printReceipt(createPrintData())
    if (!result.success) {
      setError(result.error || '印刷に失敗しました')
    }
  }

  const handleSavePDF = async () => {
    if (!calculation) return
    const result = await window.electronAPI.savePDF(createPrintData())
    if (!result.success) {
      setError(result.error || 'PDF保存に失敗しました')
    }
  }

  const handlePreview = async () => {
    if (!calculation) return
    const result = await window.electronAPI.showPrintPreview(createPrintData())
    if (!result.success) {
      setError(result.error || 'プレビュー表示に失敗しました')
    }
  }

  return (
    <>
      <div className="max-w-4xl mx-auto pb-24">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          おこづかい計算
        </h1>
        <p className="text-gray-600">
          今日やったタスクからおこづかいを計算しよう
        </p>
        <div className="flex justify-center items-center mt-4">
          <div className="text-lg font-medium text-blue-600">
            {new Date(selectedDate).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </div>
          <button
            onClick={() => dateInputRef.current?.showPicker()}
            className="ml-2 text-blue-600 hover:text-blue-800"
            aria-label="日付を選択"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          🧮 おこづかいを計算する
        </h2>

        <div className="flex justify-center">
          <button
            onClick={handleCalculate}
            disabled={!selectedDate || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium"
          >
            {isLoading ? '計算中...' : '計算する'}
          </button>
        </div>
      </div>

      {/* ローディング表示 */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            おこづかいを計算しています...
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
              {selectedDate}のおこづかい
            </div>
          </div>

          {calculation.categoryBreakdown && calculation.categoryBreakdown.length > 0 && (
            <>
              <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">カテゴリ別貢献度</h3>
                <div className="flex flex-col items-center">
                  <div className="w-48 h-48 rounded-full mb-4" style={pieStyle}></div>
                  <div className="space-y-2 w-full">
                    {calculation.categoryBreakdown.map((category: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: category.categoryColor }}></span>
                          <span className="font-medium">{category.categoryName}</span>
                        </div>
                        <span className="font-bold text-green-600">
                          ¥{category.totalAmount?.toLocaleString() || '0'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {calculation.taskDetails && calculation.taskDetails.length > 0 && (
                <div className="mt-8 overflow-x-auto">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">タスク詳細</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">タスク</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">回数</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">単価</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">基本金額</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">調整後</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">理由</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {calculation.taskDetails.map((task: any) => (
                        <React.Fragment key={task.taskExecutionId || task.taskId}>
                          <tr>
                            <td className="px-4 py-2">{task.taskName}</td>
                            <td className="px-4 py-2 text-right">{task.count}</td>
                            <td className="px-4 py-2 text-right">¥{task.unitPrice.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">¥{task.originalAmount?.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">
                              {task.adjustedAmount !== undefined ? `¥${task.adjustedAmount.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-4 py-2">{task.adjustmentReason || '-'}</td>
                            <td className="px-4 py-2 text-right">
                              <button onClick={() => startAdjust(task)} className="text-blue-600 hover:underline">調整</button>
                            </td>
                          </tr>
                          {editingTaskId === task.taskExecutionId && (
                            <tr className="bg-gray-50">
                              <td colSpan={7} className="px-4 py-3">
                                <div className="flex flex-col sm:flex-row gap-4">
                                  <div>
                                    <label className="block text-sm text-gray-700">金額</label>
                                    <input
                                      type="number"
                                      value={adjustAmount}
                                      onChange={e => setAdjustAmount(e.target.value)}
                                      className="mt-1 px-2 py-1 border rounded w-32"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="block text-sm text-gray-700">理由</label>
                                    <input
                                      type="text"
                                      value={adjustReason}
                                      onChange={e => setAdjustReason(e.target.value)}
                                      className="mt-1 px-2 py-1 border rounded w-full"
                                    />
                                  </div>
                                  <div className="flex items-end gap-2">
                                    <button onClick={submitAdjust} className="bg-blue-600 text-white px-4 py-1 rounded-md">保存</button>
                                    <button onClick={cancelAdjust} className="bg-gray-400 text-white px-4 py-1 rounded-md">取消</button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handlePrint} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium">
              🖨️ 印刷
            </button>
            <button onClick={handleSavePDF} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium">
              💾 PDF保存
            </button>
            <button onClick={handlePreview} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium">
              👀 プレビュー
            </button>
          </div>
        </div>
      )}

      {/* データがない場合の表示 */}
      {!calculation && !isLoading && !error && selectedDate && hasTaskData === false && (
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

      {/* データがあるが未計算の場合の表示 */}
      {!calculation && !isLoading && !error && selectedDate && hasTaskData === true && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">🧮</div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            {selectedDate}のデータがあります
          </h3>
          <p className="text-gray-600">
            「計算する」ボタンを押しておこづかいを計算しましょう。
          </p>
        </div>
      )}

      </div>
      <BottomNavigation current="calculation" />
    </>
  )
}

export default CalculationPage
