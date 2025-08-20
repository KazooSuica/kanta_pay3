import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Category } from '../types'
import TaskValidator from '../utils/taskValidation'

const CategoryManagementPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const colorOptions = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6']
  const iconOptions = ['📝', '✅', '📚', '🎮', '🧹', '🛒']
  const [formData, setFormData] = useState({
    name: '',
    color: colorOptions[0],
    icon: iconOptions[0]
  })

  const loadCategories = async () => {
    try {
      const response = await window.electronAPI.getAllCategories()
      if (response.success && response.data) {
        setCategories(response.data)
      } else {
        throw new Error('カテゴリの読み込みに失敗しました')
      }
    } catch (error) {
      setError('データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openNewModal = () => {
    setEditingCategory(null)
    setFormData({ name: '', color: colorOptions[0], icon: iconOptions[0] })
    setValidationError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setFormData({ name: category.name, color: category.color, icon: category.icon })
    setValidationError(null)
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    const nameErrors = TaskValidator.validateTaskName(formData.name)
    if (nameErrors.length > 0) {
      setValidationError(TaskValidator.getChildFriendlyMessage(nameErrors[0]))
      return
    }

    try {
      if (editingCategory) {
        const result = await window.electronAPI.updateCategory(editingCategory.id, {
          name: formData.name,
          color: formData.color,
          icon: formData.icon
        })
        if (!result.success) {
          throw new Error(result.error || 'カテゴリの更新に失敗しました')
        }
      } else {
        const result = await window.electronAPI.createCategory({
          name: formData.name,
          color: formData.color,
          icon: formData.icon
        })
        if (!result.success) {
          throw new Error(result.error || 'カテゴリの作成に失敗しました')
        }
      }
      setIsModalOpen(false)
      await loadCategories()
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : '保存に失敗しました')
    }
  }

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`${category.name}を削除してもよろしいですか？`)) {
      return
    }
    try {
      const result = await window.electronAPI.deleteCategory(category.id)
      if (!result.success) {
        throw new Error(result.error || 'カテゴリの削除に失敗しました')
      }
      await loadCategories()
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました')
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
            カテゴリ管理
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
    <>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingCategory ? 'カテゴリ編集' : 'カテゴリ作成'}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {validationError && (
                <p className="text-red-600 text-sm mt-1">{validationError}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">色</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color
                        ? 'ring-2 ring-offset-2 ring-blue-500 border-white'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">アイコン</label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`p-2 border rounded ${
                      formData.icon === icon
                        ? 'bg-blue-100 border-blue-500'
                        : 'bg-white'
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
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

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            カテゴリ管理
          </h1>
          <p className="text-gray-600">
            タスクの種類を整理・管理できます
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              📂 カテゴリ一覧
            </h2>
            <button
              onClick={openNewModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              新規作成
            </button>
          </div>

        {categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                カテゴリがありません
              </h3>
              <p className="text-gray-600 mb-6">
                最初のカテゴリを作成してタスクを整理しましょう
              </p>
              <button
                onClick={openNewModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
              >
                カテゴリを作成
              </button>
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <div
                key={category.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{category.icon}</span>
                    <div>
                      <h3 className="font-medium text-gray-800">{category.name}</h3>
                      <div className="text-sm text-gray-600">
                        作成日: {new Date(category.createdAt).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </div>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: category.color }}
                  />
                </div>
                
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(category)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm font-medium"
                    >
                      削除
                    </button>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>

        {/* ナビゲーション */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/task-management">
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium inline-flex items-center">
                <span className="text-2xl mr-2">✅</span>
                タスク管理
              </button>
            </Link>
            <Link to="/daily-input">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium inline-flex items-center">
                <span className="text-2xl mr-2">📝</span>
                タスク入力
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

export default CategoryManagementPage