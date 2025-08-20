import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'small' | 'medium' | 'large'
  shadow?: boolean
  border?: boolean
  rounded?: boolean
  hover?: boolean
  onClick?: () => void
  'aria-label'?: string
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'medium',
  shadow = true,
  border = true,
  rounded = true,
  hover = false,
  onClick,
  'aria-label': ariaLabel
}) => {
  const baseClasses = [
    'bg-white',
    'transition-all duration-200',
    shadow ? 'shadow-sm' : '',
    border ? 'border border-gray-200' : '',
    rounded ? 'rounded-xl' : '',
    hover ? 'hover:shadow-md hover:border-gray-300' : '',
    onClick ? 'cursor-pointer' : '',
  ].filter(Boolean).join(' ')

  const paddingClasses = {
    none: '',
    small: 'p-3',
    medium: 'p-6',
    large: 'p-8'
  }

  const classes = `${baseClasses} ${paddingClasses[padding]} ${className}`

  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </Component>
  )
}

export default Card