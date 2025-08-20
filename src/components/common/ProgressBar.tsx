import React from 'react'

interface ProgressBarProps {
  value: number // 0-100の値
  max?: number
  size?: 'small' | 'medium' | 'large' | 'child'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
  label?: string
  animated?: boolean
  className?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'medium',
  variant = 'default',
  showLabel = false,
  label,
  animated = false,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const containerClasses = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4',
    child: 'h-6' // 子供向け大きなサイズ
  }

  const variantClasses = {
    default: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-red-500'
  }

  const baseClasses = [
    'w-full bg-gray-200 rounded-full overflow-hidden',
    containerClasses[size],
    className
  ].filter(Boolean).join(' ')

  const barClasses = [
    'h-full transition-all duration-300 ease-out',
    variantClasses[variant],
    animated ? 'animate-pulse' : ''
  ].filter(Boolean).join(' ')

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className={`text-gray-700 ${
            size === 'child' ? 'text-child-friendly font-medium' : 'text-sm'
          }`}>
            {label || 'プログレス'}
          </span>
          {showLabel && (
            <span className={`text-gray-600 ${
              size === 'child' ? 'text-base font-medium' : 'text-sm'
            }`}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={baseClasses}>
        <div
          className={barClasses}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `プログレス: ${Math.round(percentage)}%`}
        />
      </div>
    </div>
  )
}

export default ProgressBar