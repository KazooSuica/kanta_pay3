import React, { useState, useEffect } from 'react'

const WelcomeMessage: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    // Show welcome message on first visit
    const hasVisited = localStorage.getItem('allowance-app-visited')
    if (!hasVisited) {
      setShowWelcome(true)
      localStorage.setItem('allowance-app-visited', 'true')
    }
  }, [])

  const handleClose = () => {
    setShowWelcome(false)
  }

  if (!showWelcome) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center animate-slide-in-up">
        <div className="text-6xl mb-4 animate-bounce-gentle">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          ようこそ！
        </h2>
        <p className="text-child-friendly text-gray-600 mb-6">
          お小遣い請求アプリへようこそ！<br />
          毎日のお手伝いや宿題を記録して、<br />
          がんばった分だけお小遣いをもらおう！
        </p>
        <button
          onClick={handleClose}
          className="btn-primary"
        >
          はじめる
        </button>
      </div>
    </div>
  )
}

export default WelcomeMessage