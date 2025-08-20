import React from 'react'
import LoadingSpinner from './LoadingSpinner'

interface IconButtonProps {
  icon: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
  size?: 'small' | 'medium' | 'large' | 'child'
  disabled?: boolean
  loading?: boolean
  rounded?: boolean
  className?: string
  'aria-label': string // アクセシビリティのため必須
  tooltip?: string
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  type = 'button',
  variant = 'secondary',
  size = 'medium',
  disabled = false,
  loading = false,
  rounded = true,
  className = '',
  'aria-label': ariaLabel,
  tooltip
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'transition-all duration-200',
    'focus:outline-none focus:ring-4 focus:ring-opacity-50',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'select-none',
    rounded ? 'rounded-full' : 'rounded-lg',
  ].filter(Boolean).join(' ')

  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-300 active:bg-primary-700',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-300 active:bg-gray-400',
    success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-300 active:bg-success-700',
    warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-300 active:bg-warning-700',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 active:bg-red-700',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-300 active:bg-gray-200'
  }

  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    medium: 'w-10 h-10 text-base',
    large: 'w-12 h-12 text-lg',
    child: 'w-16 h-16 text-2xl shadow-lg hover:shadow-xl transform hover:scale-105' // 子供向け特大サイズ
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return
    
    // 子供向けのフィードバック効果
    if (size === 'child') {
      e.currentTarget.style.transform = 'scale(0.9)'
      setTimeout(() => {
        if (e.currentTarget) {
          e.currentTarget.style.transform = ''
        }
      }, 100)
    }
    
    onClick?.()
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={classes}
      aria-label={ariaLabel}
      title={tooltip || ariaLabel}
    >
      {loading ? (
        <LoadingSpinner 
          size={size === 'small' ? 'small' : 'medium'} 
          color={variant === 'secondary' || variant === 'ghost' ? 'gray' : 'white'} 
        />
      ) : (
        icon
      )}
    </button>
  )
}

export default IconButton