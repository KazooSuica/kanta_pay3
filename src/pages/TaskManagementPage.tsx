import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Task, Category, CreateInput } from '../types'
import TaskValidator from '../utils/taskValidation'

const TaskManagementPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState<CreateInput<Task>>({
    name: '',
    categoryId: '',
    unitPrice: 0,
    description: '',
    isActive: true
  })
  const [validationError, setValidationError] = useState<string | null>(null)

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
    } catch {
      setError('データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openNewModal = () => {
    setEditingTask(null)
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      unitPrice: 0,
      description: '',
      isActive: true
    })
    setValidationError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    setFormData({
      name: task.name,
      categoryId: task.categoryId,
      unitPrice: task.unitPrice,
      description: task.description || '',
      isActive: task.isActive
    })
    setValidationError(null)
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    const validation = editingTask
      ? TaskValidator.validateUpdateTaskData(formData)
      : TaskValidator.validateCreateTaskData(formData)

    if (!validation.isValid) {
      setValidationError(TaskValidator.getChildFriendlyMessage(validation.errors[0]))
      return
    }

    try {
      if (editingTask) {
        if (!window.confirm(`${editingTask.name}を更新してもよろしいですか？`)) {
          return
        }
        const result = await window.electronAPI.updateTask(editingTask.id, formData)
        if (!result.success) {
          throw new Error(result.error || 'タスクの更新に失敗しました')
        }
      } else {
        const result = await window.electronAPI.createTask(formData)
        if (!result.success) {
          throw new Error(result.error || 'タスクの作成に失敗しました')
        }
      }

      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : '保存に失敗しました')
    }
  }

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`${task.name}を削除してもよろしいですか？`)) {
      return
    }
    try {
      const result = await window.electronAPI.deleteTask(task.id)
      if (!result.success) {
        throw new Error(result.error || 'タスクの削除に失敗しました')
      }
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }

  const filteredTasks =
    selectedCategory === 'all'
      ? tasks
      : tasks.filter(task => task.categoryId === selectedCategory)

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">データを読み込んでいます...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">タスク管理</h1>
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
    <>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingTask ? 'タスクを編集' : '新規タスク'}
            </h2>
            {validationError && (
              <div className="mb-4 text-red-600 text-sm">{validationError}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">タスク名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">カテゴリ</label>
                <select
                  value={formData.categoryId}
                  onChange={e =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">選択してください</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">単価</label>
                <input
                  type="number"
                  value={formData.unitPrice}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      unitPrice: Number(e.target.value)
                    })
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">説明</label>
                <textarea
                  value={formData.description}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      description: e.target.value
                    })
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="flex items-center">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      isActive: e.target.checked
                    })
                  }
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm">
                  有効
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">タスク管理</h1>
          <p className="text-gray-600">お手伝いや宿題を登録・編集できます</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* カテゴリ一覧 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">📂 カテゴリ一覧</h2>
              <Link to="/category-management">
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  管理
                </button>
              </Link>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-gray-600 mb-4">カテゴリがありません</p>
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
              <h2 className="text-xl font-bold text-gray-800">✅ タスク一覧</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="border rounded-md px-2 py-1"
                >
                  <option value="all">すべて</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={openNewModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  新規作成
                </button>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-600 mb-4">タスクがありません</p>
                <button
                  onClick={openNewModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  タスクを作成
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTasks.map(task => {
                  const category = categories.find(c => c.id === task.categoryId)
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
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
                      <div className="mt-2 flex space-x-2">
                        <button
                          onClick={() => openEditModal(task)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm font-medium"
                        >
                          削除
                        </button>
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
    </>
  )
}

export default TaskManagementPage

