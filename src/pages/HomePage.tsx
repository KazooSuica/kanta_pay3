import React from 'react'
import Navigation from '../components/common/Navigation'
import WelcomeMessage from '../components/common/WelcomeMessage'

const HomePage: React.FC = () => {
  return (
    <>
      <WelcomeMessage />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            お小遣い請求アプリ
          </h1>
          <p className="text-child-friendly text-gray-600">
            毎日のお手伝いや宿題を記録して、お小遣いを計算しよう！
          </p>
        </div>
        
        <div className="animate-slide-in-up">
          <Navigation />
        </div>
        
        {/* テスト用ナビゲーションボタン */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-bold text-yellow-800 mb-4">🧪 テスト用ナビゲーション</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={() => {
                console.log('[HomePage] Test button clicked - Task Management')
                window.location.hash = '#/task-management'
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              タスク管理 (Hash)
            </button>
            <button
              onClick={() => {
                console.log('[HomePage] Test button clicked - Daily Input')
                window.history.pushState({}, '', '/daily-input')
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              タスク入力 (History)
            </button>
            <button
              onClick={() => {
                console.log('[HomePage] Test button clicked - Calculation')
                if (window.electronAPI && window.electronAPI.navigateTo) {
                  window.electronAPI.navigateTo('/calculation')
                } else {
                  console.error('electronAPI.navigateTo not available')
                }
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
            >
              計算 (IPC)
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-4 text-sm text-gray-500 bg-white rounded-full px-4 py-2 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse-slow"></span>
              <span>準備完了</span>
            </div>
            <span>•</span>
            <span>今日も頑張ろう！</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default HomePage