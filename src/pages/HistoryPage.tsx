import React from 'react'
import { Link } from 'react-router-dom'

const HistoryPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          履歴を見る
        </h1>
        <p className="text-child-friendly text-gray-600">
          過去のお小遣い記録を確認しよう
        </p>
      </div>
      
      <div className="card text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          準備中です
        </h2>
        <p className="text-child-friendly text-gray-600 mb-6">
          この機能はまだ作っています。<br />
          もう少し待ってね！
        </p>
        <Link 
          to="/" 
          className="btn-primary inline-block"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  )
}

export default HistoryPage