import React from 'react'
import { useNavigate } from 'react-router-dom'

interface NavigationItem {
  id: string
  title: string
  description: string
  icon: string
  color: string
  path: string
}

const Navigation: React.FC = () => {
  const navigate = useNavigate()

  const navigationItems: NavigationItem[] = [
    {
      id: 'category-management',
      title: 'カテゴリ管理',
      description: 'タスクの種類を整理しよう',
      icon: '📂',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      path: '/category-management'
    },
    {
      id: 'task-management',
      title: 'タスク管理',
      description: 'お手伝いや宿題を登録しよう',
      icon: '📝',
      color: 'bg-blue-500 hover:bg-blue-600',
      path: '/task-management'
    },
    {
      id: 'daily-input',
      title: '今日のタスク入力',
      description: 'やったことを記録しよう',
      icon: '✅',
      color: 'bg-green-500 hover:bg-green-600',
      path: '/daily-input'
    },
    {
      id: 'calculation',
      title: 'お小遣い計算',
      description: 'いくらもらえるか計算しよう',
      icon: '💰',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      path: '/calculation'
    },
    {
      id: 'history',
      title: '履歴を見る',
      description: '過去の記録を確認しよう',
      icon: '📊',
      color: 'bg-purple-500 hover:bg-purple-600',
      path: '/history'
    }
  ]

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {navigationItems.map((item, index) => (
        <button
          key={item.id}
          onClick={() => handleNavigation(item.path)}
          className={`${item.color} text-white rounded-xl p-8 text-left transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 shadow-lg hover:shadow-xl animate-slide-in-up`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start space-x-4">
            <div className="text-5xl animate-bounce-gentle" style={{ animationDelay: `${index * 0.2}s` }}>
              {item.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{item.title}</h2>
              <p className="text-lg opacity-90">{item.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

export default Navigation