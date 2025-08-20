import React from 'react'
import LoadingSpinner from './LoadingSpinner'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'child-friendly' | 'outline'
  size?: 'small' | 'medium' | 'large' | 'child' | 'sm'
  disabled?: boolean
  loading?: boolean
  className?: string
  icon?: React.ReactNode
  fullWidth?: boolean
  rounded?: boolean
  shadow?: boolean
  'aria-label'?: string
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = '',
  icon,
  fullWidth = false,
  rounded = false,
  shadow = true,
  'aria-label': ariaLabel
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'focus:outline-none focus:ring-4 focus:ring-opacity-50',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'select-none', // テキスト選択を防ぐ
    fullWidth ? 'w-full' : '',
    rounded ? 'rounded-full' : 'rounded-lg',
    shadow ? 'shadow-lg hover:shadow-xl' : '',
  ].filter(Boolean).join(' ')
  
  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-300 active:bg-primary-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-300 active:bg-gray-400',
    success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-300 active:bg-success-700',
    warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-300 active:bg-warning-700',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 active:bg-red-700',
    outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300 active:bg-gray-100',
    'child-friendly': 'bg-gradient-to-r from-blue-400 to-purple-500 text-white hover:from-blue-500 hover:to-purple-600 focus:ring-blue-300 active:from-blue-600 active:to-purple-700 transform hover:scale-105'
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-8 gap-1',
    small: 'px-3 py-2 text-sm min-h-8 gap-1',
    medium: 'px-6 py-3 text-base min-h-11 gap-2',
    large: 'px-8 py-4 text-xl min-h-12 gap-3',
    child: 'px-8 py-6 text-2xl min-h-16 gap-4 font-bold' // 子供向け特大サイズ
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return
    
    // 子供向けのフィードバック効果
    if (variant === 'child-friendly' || size === 'child') {
      e.currentTarget.style.transform = 'scale(0.95)'
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
    >
      {loading && (
        <LoadingSpinner 
          size={size === 'small' ? 'small' : 'medium'} 
          color={variant === 'secondary' ? 'gray' : 'white'} 
        />
      )}
      {!loading && icon && (
        <span className="flex-shrink-0">
          {icon}
        </span>
      )}
      <span className={`${loading ? 'ml-2' : ''} ${icon && !loading ? 'flex-1' : ''}`}>
        {children}
      </span>
    </button>
  )
}

export default Button