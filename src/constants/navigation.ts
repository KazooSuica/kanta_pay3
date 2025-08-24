export interface NavigationItem {
  id: string
  title: string
  description?: string
  icon: string
  color: string
  path: string
}

export const navigationItems: NavigationItem[] = [
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
    title: 'おこづかい計算',
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
  },
  {
    id: 'home',
    title: 'ホーム',
    icon: '🏠',
    color: 'bg-gray-500 hover:bg-gray-600',
    path: '/'
  }
]
