import React, { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  children: React.ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  disabled?: boolean
  className?: string
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 500,
  disabled = false,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showTimeout, setShowTimeout] = useState<NodeJS.Timeout | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    if (disabled) return
    
    const timeout = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    setShowTimeout(timeout)
  }

  const hideTooltip = () => {
    if (showTimeout) {
      clearTimeout(showTimeout)
      setShowTimeout(null)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (showTimeout) {
        clearTimeout(showTimeout)
      }
    }
  }, [showTimeout])

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800'
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && content && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]} ${className}`}
          role="tooltip"
        >
          {content}
          <div 
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  )
}

export default Tooltip