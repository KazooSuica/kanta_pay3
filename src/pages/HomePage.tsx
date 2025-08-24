import React from 'react'
import Navigation from '../components/common/Navigation'
import WelcomeMessage from '../components/common/WelcomeMessage'
import PageHeader from '../components/common/PageHeader'

const HomePage: React.FC = () => {
  return (
    <>
      <WelcomeMessage />
      <div className="max-w-4xl mx-auto">
        <div className="animate-fade-in">
          <PageHeader
            title="おこづかい請求アプリ"
            description="毎日のお手伝いや宿題を記録して、おこづかいを計算しよう！"
            navId="home"
          />
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

