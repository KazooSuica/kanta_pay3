import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'small' | 'medium' | 'large'
  rounded?: boolean
  className?: string
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  rounded = true,
  className = ''
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center font-medium',
    'whitespace-nowrap',
    rounded ? 'rounded-full' : 'rounded-md',
  ].filter(Boolean).join(' ')

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  }

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-2 text-base'
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return (
    <span className={classes}>
      {children}
    </span>
  )
}

export default Badge