import React from 'react'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: 'primary' | 'white' | 'gray'
  message?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = 'primary',
  message
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'text-primary-500',
    white: 'text-white',
    gray: 'text-gray-500'
  }

  return (
    <div className="flex flex-col justify-center items-center">
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
        role="status"
        aria-label="読み込み中"
      >
        <svg
          className="w-full h-full"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  )
}

export default LoadingSpinner