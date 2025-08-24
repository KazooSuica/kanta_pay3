import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Task, Category } from '../types'
import {
  validateDailyInput,
  formatValidationErrors,
  getDuplicateDateMessage,
  getSaveSuccessMessage
} from '../utils/dailyInputValidation'

const DailyInputPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTasks, setSelectedTasks] = useState<Record<string, number>>({})
  const [currentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [activeCategoryId, setActiveCategoryId] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)

  // データの初期読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[DailyInputPage] Loading data...')
        const [categoriesResponse, tasksResponse] = await Promise.all([
          window.electronAPI.getAllCategories(),
          window.electronAPI.getAllTasks()
        ])

        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data)
          if (categoriesResponse.data.length > 0) {
            setActiveCategoryId(categoriesResponse.data[0].id)
          }
          console.log('[DailyInputPage] Categories loaded:', categoriesResponse.data.length)
        } else {
          throw new Error('カテゴリの読み込みに失敗しました')
        }

        if (tasksResponse.success && tasksResponse.data) {
          setTasks(tasksResponse.data)
          console.log('[DailyInputPage] Tasks loaded:', tasksResponse.data.length)
        } else {
          throw new Error('タスクの読み込みに失敗しました')
        }

        // 既存の記録を読み込み
        const existingRecord = await window.electronAPI.getDailyRecord(currentDate)
        if (existingRecord.success && existingRecord.data) {
          const initialSelected: Record<string, number> = {}
          for (const exec of existingRecord.data.taskExecutions) {
            initialSelected[exec.taskId] = exec.count
          }
          setSelectedTasks(initialSelected)
          setIsEditing(true)
          console.log('[DailyInputPage] Existing record loaded')
        }
      } catch (error) {
        console.error('[DailyInputPage] Error loading data:', error)
        setError('データの読み込みに失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // タスクの回数を設定
  const setTaskCount = (taskId: string, count: number) => {
    setSelectedTasks(prev => {
      if (count === 0) {
        const { [taskId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [taskId]: count }
    })
  }

  // 合計金額を計算
  const totalAmount = Object.entries(selectedTasks).reduce((sum, [taskId, count]) => {
    const task = tasks.find(t => t.id === taskId)
    return sum + (task ? task.unitPrice * count : 0)
  }, 0)

  // 選択済みタスクをカテゴリ別に整理
  const selectedTaskDetails = Object.entries(selectedTasks)
    .map(([taskId, count]) => {
      const task = tasks.find(t => t.id === taskId)
      return task ? { ...task, count } : null
    })
    .filter((t): t is Task & { count: number } => t !== null)

  const selectedTasksByCategory = categories
    .map(category => ({
      category,
      tasks: selectedTaskDetails.filter(task => task.categoryId === category.id)
    }))
    .filter(group => group.tasks.length > 0)

  // 保存処理
  const handleSave = async () => {
    const validation = validateDailyInput(
      { date: currentDate, selectedTasks },
      tasks
    )

    if (!validation.isValid) {
      const messages = formatValidationErrors(validation.errors)
      alert(messages.join('\n'))
      return
    }

    try {
      console.log('[DailyInputPage] Saving record...')

      if (!isEditing) {
        const existing = await window.electronAPI.getDailyRecord(currentDate)
        if (existing.success && existing.data) {
          const overwrite = window.confirm(getDuplicateDateMessage(currentDate))
          if (!overwrite) {
            return
          }
        }
      }

      const taskExecutions = Object.entries(selectedTasks).map(([taskId, count]) => {
        const task = tasks.find(t => t.id === taskId)!
        return {
          taskId,
          count,
          amount: task.unitPrice * count
        }
      })

      const result = await window.electronAPI.saveDailyRecord({
        date: currentDate,
        taskExecutions
      })

      if (result.success) {
        console.log('[DailyInputPage] Record saved successfully')
        alert(
          getSaveSuccessMessage(
            currentDate,
            totalAmount,
            Object.keys(selectedTasks).length
          )
        )
        setIsEditing(true)
      } else {
        throw new Error(result.error || '保存に失敗しました')
      }
    } catch (error) {
      console.error('[DailyInputPage] Error saving record:', error)
      alert('保存に失敗しました')
    }
  }

  const handleClear = async () => {
    if (window.confirm('入力内容をクリアしますか？')) {
      try {
        if (isEditing) {
          await window.electronAPI.deleteDailyRecord(currentDate)
        }
        setSelectedTasks({})
        setIsEditing(false)
      } catch (error) {
        console.error('[DailyInputPage] Error deleting record:', error)
        alert('記録の削除に失敗しました')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              データを読み込んでいます...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            今日のタスク入力
          </h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-2">⚠️</span>
            <div>
              <h3 className="text-red-800 font-medium">データの読み込みに失敗しました</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            今日のタスク入力
          </h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            カテゴリがありません
          </h2>
          <p className="text-gray-600 mb-6">
            まずはカテゴリとタスクを作成してください
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/category-management">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium">
                カテゴリ管理
              </button>
            </Link>
            <Link to="/task-management">
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium">
                タスク管理
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          今日のタスク入力
        </h1>
        <p className="text-gray-600 mb-4">
          今日やったお手伝いや宿題を記録しよう
        </p>
        <div className="text-lg font-medium text-blue-600">
          {new Date(currentDate).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📝 今日やったタスクを選んでください
            </h2>
            
            <div className="mb-6 flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`px-3 py-1 rounded-full border flex items-center gap-1 ${
                    activeCategoryId === category.id
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>

            {(() => {
              const category = categories.find(c => c.id === activeCategoryId)
              const categoryTasks = tasks.filter(
                task => task.categoryId === activeCategoryId && task.isActive
              )

              if (!category || categoryTasks.length === 0) {
                return <div className="text-gray-600">このカテゴリにはタスクがありません</div>
              }

              return (
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                    <span className="text-2xl mr-2">{category.icon}</span>
                    {category.name}
                  </h3>

                  <div className="space-y-3">
                    {categoryTasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{task.name}</div>
                          <div className="text-sm text-gray-600">¥{task.unitPrice} / 回</div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() =>
                              setTaskCount(
                                task.id,
                                Math.max(0, (selectedTasks[task.id] || 0) - 1)
                              )
                            }
                            className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                          >
                            -
                          </button>

                          <span className="w-8 text-center font-medium">
                            {selectedTasks[task.id] || 0}
                          </span>

                          <button
                            onClick={() =>
                              setTaskCount(task.id, (selectedTasks[task.id] || 0) + 1)
                            }
                            className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 合計表示 */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-4">今日の合計</h3>
            <div className="text-3xl font-bold text-green-600 mb-4">
              ¥{totalAmount.toLocaleString()}
            </div>

            {Object.keys(selectedTasks).length > 0 && (
              <>
                <button
                  onClick={handleSave}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium inline-flex items-center justify-center"
                >
                  <span className="text-2xl mr-2">💾</span>
                  記録を保存
                </button>
                <button
                  onClick={handleClear}
                  className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md font-medium inline-flex items-center justify-center"
                >
                  <span className="text-xl mr-2">🗑️</span>
                  入力内容をクリア
                </button>
              </>
            )}
          </div>

          {/* 選択済みタスク */}
          {selectedTasksByCategory.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">選んだタスク</h3>
              {selectedTasksByCategory.map(({ category, tasks }) => (
                <div key={category.id} className="mb-4 last:mb-0">
                  <h4 className="font-medium text-gray-700 flex items-center">
                    <span className="text-xl mr-2">{category.icon}</span>
                    {category.name}
                  </h4>
                  <ul className="mt-2 space-y-1">
                    {tasks.map(task => (
                      <li key={task.id} className="flex justify-between text-sm">
                        <span>{task.name}</span>
                        <span>{task.count}回</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* ナビゲーション */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              その他の機能
            </h3>
            <div className="space-y-3">
              <Link to="/calculation">
                <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium inline-flex items-center justify-center">
                  <span className="text-xl mr-2">🧮</span>
                  お小遣い計算
                </button>
              </Link>
              <Link to="/history">
                <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium inline-flex items-center justify-center">
                  <span className="text-xl mr-2">📊</span>
                  履歴を見る
                </button>
              </Link>
              <Link to="/">
                <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium inline-flex items-center justify-center">
                  <span className="text-xl mr-2">🏠</span>
                  ホームに戻る
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyInputPage
