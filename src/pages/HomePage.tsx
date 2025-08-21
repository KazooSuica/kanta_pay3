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

