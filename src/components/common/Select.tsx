import React, { forwardRef } from 'react'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
  size?: 'small' | 'medium' | 'large' | 'child'
  variant?: 'default' | 'child-friendly'
  fullWidth?: boolean
  required?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  options,
  placeholder,
  size = 'medium',
  variant = 'default',
  fullWidth = true,
  required = false,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

  const baseClasses = [
    'border-2 rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-opacity-50',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'bg-white appearance-none cursor-pointer',
    fullWidth ? 'w-full' : '',
    error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 
           'border-gray-300 focus:border-primary-500 focus:ring-primary-200',
  ].filter(Boolean).join(' ')

  const sizeClasses = {
    small: 'px-3 py-2 text-sm pr-8',
    medium: 'px-4 py-3 text-base pr-10',
    large: 'px-5 py-4 text-lg pr-12',
    child: 'px-6 py-4 text-child-friendly font-medium pr-12' // 子供向け大きなサイズ
  }

  const variantClasses = {
    default: '',
    'child-friendly': 'bg-blue-50 border-blue-200 focus:bg-white focus:border-blue-400 focus:ring-blue-200'
  }

  const selectClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label 
          htmlFor={selectId}
          className={`block text-sm font-medium text-gray-700 mb-2 ${
            size === 'child' ? 'text-child-friendly font-bold' : ''
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={selectClasses}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* カスタム矢印アイコン */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg 
            className={`text-gray-400 ${size === 'child' ? 'w-6 h-6' : 'w-5 h-5'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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

Select.displayName = 'Select'

export default Select