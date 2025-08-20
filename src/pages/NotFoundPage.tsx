import React from 'react'
import { Link } from 'react-router-dom'

const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="card text-center">
        <div className="text-6xl mb-4">😵</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          ページが見つかりません
        </h1>
        <p className="text-child-friendly text-gray-600 mb-6">
          お探しのページは存在しないか、<br />
          移動された可能性があります。
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

export default NotFoundPage