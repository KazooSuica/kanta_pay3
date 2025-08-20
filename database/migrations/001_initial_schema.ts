// マイグレーション: 初期スキーマ作成
// バージョン: 1
// 作成日: 2024-01-01

export const migration001 = {
  version: 1,
  name: 'initial_schema',
  description: '初期データベーススキーマの作成',
  
  up: async (store: any) => {
    console.log('Running migration 001: Initial schema')
    
    // デフォルトカテゴリの作成
    const categories = store.get('categories', {})
    const defaultCategories = [
      {
        id: 'help',
        name: 'お手伝い',
        color: '#22c55e',
        icon: '🏠',
        createdAt: new Date().toISOString()
      },
      {
        id: 'homework',
        name: '宿題',
        color: '#3b82f6',
        icon: '📚',
        createdAt: new Date().toISOString()
      },
      {
        id: 'other',
        name: 'その他',
        color: '#8b5cf6',
        icon: '⭐',
        createdAt: new Date().toISOString()
      }
    ]
    
    for (const category of defaultCategories) {
      if (!categories[category.id]) {
        categories[category.id] = category
      }
    }
    store.set('categories', categories)
    
    // デフォルト設定の作成
    const settings = store.get('settings', {})
    const defaultSettings = {
      childName: '',
      currency: 'JPY',
      dateFormat: 'YYYY-MM-DD',
      theme: 'light'
    }
    
    for (const [key, value] of Object.entries(defaultSettings)) {
      if (!settings[key]) {
        settings[key] = value
      }
    }
    store.set('settings', settings)
    
    // 空のテーブル初期化
    if (!store.has('tasks')) {
      store.set('tasks', {})
    }
    if (!store.has('dailyRecords')) {
      store.set('dailyRecords', {})
    }
    if (!store.has('taskExecutions')) {
      store.set('taskExecutions', {})
    }
    
    console.log('Migration 001 completed successfully')
  },
  
  down: async (store: any) => {
    console.log('Rolling back migration 001: Initial schema')
    
    // ロールバック処理（必要に応じて実装）
    // 通常は初期マイグレーションのロールバックは行わない
    
    console.log('Migration 001 rollback completed')
  }
}