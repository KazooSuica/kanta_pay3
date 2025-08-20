import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Task, Category } from '../types'

const TaskManagementPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesResponse, tasksResponse] = await Promise.all([
          window.electronAPI.getAllCategories(),
          window.electronAPI.getAllTasks()
        ])

        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data)
        }

        if (tasksResponse.success && tasksResponse.data) {
          setTasks(tasksResponse.data)
        }
      } catch (error) {
        setError('データの読み込みに失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

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
            タスク管理
          </h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-2">⚠️</span>
            <div>
              <h3 className="text-red-800 font-medium">エラーが発生しました</h3>
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          タスク管理
        </h1>
        <p className="text-gray-600">
          お手伝いや宿題を登録・編集できます
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* カテゴリ一覧 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              📂 カテゴリ一覧
            </h2>
            <Link to="/category-management">
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                管理
              </button>
            </Link>
          </div>
          
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-gray-600 mb-4">
                カテゴリがありません
              </p>
              <Link to="/category-management">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">
                  カテゴリを作成
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <div className="font-medium text-gray-800">
                        {category.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {tasks.filter(task => task.categoryId === category.id).length}個のタスク
                      </div>
                    </div>
                  </div>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* タスク一覧 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              ✅ タスク一覧
            </h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              新規作成
            </button>
          </div>
          
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-gray-600 mb-4">
                タスクがありません
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">
                タスクを作成
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tasks.map(task => {
                const category = categories.find(c => c.id === task.categoryId)
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{category?.icon || '📝'}</span>
                      <div>
                        <div className="font-medium text-gray-800">
                          {task.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {category?.name} • ¥{task.unitPrice}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          task.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {task.isActive ? '有効' : '無効'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* アクションボタン */}
      <div className="mt-8 text-center">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/daily-input">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium inline-flex items-center">
              <span className="text-2xl mr-2">📝</span>
              タスクを記録する
            </button>
          </Link>
          <Link to="/calculation">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium inline-flex items-center">
              <span className="text-2xl mr-2">🧮</span>
              お小遣いを計算する
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

export default TaskManagementPage