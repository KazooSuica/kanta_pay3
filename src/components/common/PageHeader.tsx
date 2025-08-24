import React from 'react'
import { navigationItems } from '../../constants/navigation'

interface PageHeaderProps {
  title: string
  description?: string
  navId: string
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, navId }) => {
  const navItem = navigationItems.find(item => item.id === navId)
  const colorClasses = navItem?.color || ''
  const bgClass = colorClasses.split(' ').find(c => c.startsWith('bg-')) || 'bg-gray-500'

  return (
    <div className={`${bgClass} text-white text-center py-4 mb-8`}>
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      {description && <p className="text-child-friendly">{description}</p>}
    </div>
  )
}

export default PageHeader
