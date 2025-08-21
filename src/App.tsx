import React, { useEffect, useState } from 'react'
import { BrowserRouter, HashRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Header from './components/common/Header'
import LoadingSpinner from './components/common/LoadingSpinner'
import HomePage from './pages/HomePage'
import TaskManagementPage from './pages/TaskManagementPage'
import CategoryManagementPage from './pages/CategoryManagementPage'
import DailyInputPage from './pages/DailyInputPage'
import CalculationPage from './pages/CalculationPage'
import HistoryPage from './pages/HistoryPage'
import NotFoundPage from './pages/NotFoundPage'

// ナビゲーション機能を持つ内部コンポーネント
function AppContent() {
  const navigate = useNavigate()
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'checking'>('checking')
  const [appVersion, setAppVersion] = useState<string>('')

  useEffect(() => {
    console.log('[App] AppContent useEffect called')
    
    const initializeApp = async () => {
      try {
        console.log('[App] Initializing app...')
        // Check database connection
        const dbResult = await window.electronAPI.dbHealthCheck()
        setDbStatus(dbResult.success ? 'connected' : 'error')
        console.log('[App] Database status:', dbResult.success ? 'connected' : 'error')
        
        // Get app version
        const version = await window.electronAPI.getAppVersion()
        setAppVersion(version)
        console.log('[App] App version:', version)
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setDbStatus('error')
      }
    }

    // メニューからのナビゲーション要求を受信
    const handleNavigationChange = (route: string) => {
      console.log(`[App] Received navigation request: ${route}`)
      console.log('[App] Current location:', window.location.pathname)
      navigate(route)
      console.log('[App] Navigation called with route:', route)
    }

    // ナビゲーションリスナーを設定
    console.log('[App] Setting up navigation listener...')
    if (window.electronAPI && window.electronAPI.onNavigationChange) {
      window.electronAPI.onNavigationChange(handleNavigationChange)
      console.log('[App] Navigation listener set up successfully')
    } else {
      console.error('[App] electronAPI or onNavigationChange not available')
    }

    initializeApp()

    // クリーンアップ
    return () => {
      console.log('[App] Cleaning up navigation listener')
      if (window.electronAPI && window.electronAPI.removeNavigationListener) {
        window.electronAPI.removeNavigationListener()
      }
    }
  }, [navigate])

  if (dbStatus === 'error') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">😵</div>
          <h1 className="text-2xl font-bold text-red-800 mb-4">
            アプリが起動できませんでした
          </h1>
          <p className="text-child-friendly text-red-700 mb-6">
            データベースに接続できません。<br />
            アプリを再起動してみてください。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            もう一度試す
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/task-management" element={<TaskManagementPage />} />
          <Route path="/category-management" element={<CategoryManagementPage />} />
          <Route path="/daily-input" element={<DailyInputPage />} />
          <Route path="/calculation" element={<CalculationPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-success-500' : 'bg-red-500'}`}></span>
            <span>データベース: {dbStatus === 'connected' ? '接続中' : 'エラー'}</span>
            <span>•</span>
            <span>バージョン: {appVersion}</span>
          </div>
        </div>
      </main>
    </div>
  )
}

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time for smooth UX
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-child-friendly text-primary-700 font-medium">
            アプリを起動しています...
          </p>
        </div>
      </div>
    )
  }

  const isFileProtocol = typeof window !== 'undefined' && window.location?.protocol === 'file:'
  const RouterComponent = isFileProtocol ? HashRouter : BrowserRouter

  return (
    <RouterComponent>
      <AppContent />
    </RouterComponent>
  )
}

export default App
