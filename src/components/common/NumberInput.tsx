import React, { useState, useCallback } from 'react'
import IconButton from './IconButton'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  error?: string
  hint?: string
  size?: 'small' | 'medium' | 'large' | 'child'
  variant?: 'default' | 'child-friendly'
  disabled?: boolean
  required?: boolean
  showButtons?: boolean
  className?: string
  id?: string
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  error,
  hint,
  size = 'medium',
  variant = 'default',
  disabled = false,
  required = false,
  showButtons = true,
  className = '',
  id
}) => {
  const [inputValue, setInputValue] = useState(value.toString())
  const inputId = id || `number-input-${Math.random().toString(36).substr(2, 9)}`

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    const numValue = parseFloat(newValue)
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue)
    }
  }, [onChange, min, max])

  const handleBlur = useCallback(() => {
    const numValue = parseFloat(inputValue)
    if (isNaN(numValue) || numValue < min || numValue > max) {
      setInputValue(value.toString())
    }
  }, [inputValue, value, min, max])

  const increment = useCallback(() => {
    const newValue = Math.min(value + step, max)
    onChange(newValue)
    setInputValue(newValue.toString())
  }, [value, step, max, onChange])

  const decrement = useCallback(() => {
    const newValue = Math.max(value - step, min)
    onChange(newValue)
    setInputValue(newValue.toString())
  }, [value, step, min, onChange])

  const baseClasses = [
    'border-2 rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-opacity-50',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'text-center font-medium',
    error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 
           'border-gray-300 focus:border-primary-500 focus:ring-primary-200',
  ].filter(Boolean).join(' ')

  const sizeClasses = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-4 py-3 text-base',
    large: 'px-5 py-4 text-lg',
    child: 'px-6 py-4 text-child-friendly font-bold' // 子供向け大きなサイズ
  }

  const variantClasses = {
    default: 'bg-white',
    'child-friendly': 'bg-blue-50 border-blue-200 focus:bg-white focus:border-blue-400 focus:ring-blue-200'
  }

  const inputClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`

  const buttonSize = size === 'child' ? 'child' : size === 'large' ? 'large' : 'medium'

  return (
    <div className="w-full">
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
      
      <div className="flex items-center space-x-2">
        {showButtons && (
          <IconButton
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            }
            onClick={decrement}
            disabled={disabled || value <= min}
            size={buttonSize}
            variant="secondary"
            aria-label="数を減らす"
          />
        )}
        
        <input
          id={inputId}
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`${inputClasses} ${showButtons ? 'flex-1' : 'w-full'}`}
          aria-label={label || '数値入力'}
        />
        
        {showButtons && (
          <IconButton
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
            onClick={increment}
            disabled={disabled || value >= max}
            size={buttonSize}
            variant="secondary"
            aria-label="数を増やす"
          />
        )}
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
}

export default NumberInput