import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  
  const currentDate = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const handleBackToHome = () => {
    navigate('/')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!isHomePage && (
              <button
                onClick={handleBackToHome}
                className="text-2xl hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded-lg p-1"
                title="ホームに戻る"
              >
                🏠
              </button>
            )}
            <div className="text-3xl">💰</div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                お小遣い請求アプリ
              </h1>
              <p className="text-sm text-gray-600">
                がんばった分だけお小遣いをもらおう！
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-child-friendly font-medium text-gray-700">
              {currentDate}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header