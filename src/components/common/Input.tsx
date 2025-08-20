import React, { forwardRef } from 'react'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  size?: 'small' | 'medium' | 'large' | 'child'
  variant?: 'default' | 'child-friendly'
  fullWidth?: boolean
  required?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  size = 'medium',
  variant = 'default',
  fullWidth = true,
  required = false,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  const baseClasses = [
    'border-2 rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-opacity-50',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    fullWidth ? 'w-full' : '',
    error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 
           'border-gray-300 focus:border-primary-500 focus:ring-primary-200',
  ].filter(Boolean).join(' ')

  const sizeClasses = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-4 py-3 text-base',
    large: 'px-5 py-4 text-lg',
    child: 'px-6 py-4 text-child-friendly font-medium' // 子供向け大きなサイズ
  }

  const variantClasses = {
    default: '',
    'child-friendly': 'bg-blue-50 border-blue-200 focus:bg-white focus:border-blue-400 focus:ring-blue-200'
  }

  const inputClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label 
          htmlFor={inputId}
          className={`block text-sm font-medium text-gray-700 mb-2 ${
            size === 'child' ? 'text-child-friendly font-bold' : ''
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">
              {icon}
            </span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`${inputClasses} ${icon ? 'pl-10' : ''}`}
          {...props}
        />
      </div>
      
      {hint && !error && (
        <p className={`mt-1 text-gray-500 ${
          size === 'child' ? 'text-base' : 'text-sm'
        }`}>
          {hint}
        </p>
      )}
      
      {error && (
        <p className={`mt-1 text-red-600 ${
          size === 'child' ? 'text-base font-medium' : 'text-sm'
        }`}>
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input