import React from 'react'

interface ChildFriendlyCardProps {
  children: React.ReactNode
  title?: string
  icon?: string
  color?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
  size?: 'medium' | 'large'
  'aria-label'?: string
}

const ChildFriendlyCard: React.FC<ChildFriendlyCardProps> = ({
  children,
  title,
  icon,
  color = '#3b82f6',
  onClick,
  disabled = false,
  className = '',
  size = 'medium',
  'aria-label': ariaLabel
}) => {
  const baseClasses = [
    'rounded-2xl shadow-lg transition-all duration-200',
    'border-2 border-transparent',
    'select-none',
    onClick && !disabled ? 'cursor-pointer hover:shadow-xl hover:scale-105 active:scale-95' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
  ].filter(Boolean).join(' ')

  const sizeClasses = {
    medium: 'p-6',
    large: 'p-8'
  }

  const classes = `${baseClasses} ${sizeClasses[size]} ${className}`

  const handleClick = () => {
    if (disabled || !onClick) return
    onClick()
  }

  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      className={classes}
      onClick={handleClick}
      style={{ 
        backgroundColor: `${color}15`, // 15% opacity
        borderColor: `${color}30` // 30% opacity
      }}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {(icon || title) && (
        <div className="flex items-center justify-center mb-4">
          {icon && (
            <span className="text-6xl mr-3" role="img" aria-hidden="true">
              {icon}
            </span>
          )}
          {title && (
            <h3 
              className="text-2xl font-bold text-gray-800"
              style={{ color }}
            >
              {title}
            </h3>
          )}
        </div>
      )}
      
      <div className="text-child-friendly text-gray-700 text-center">
        {children}
      </div>
    </Component>
  )
}

export default ChildFriendlyCard