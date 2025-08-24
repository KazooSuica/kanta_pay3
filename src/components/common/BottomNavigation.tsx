import React from 'react'
import { Link } from 'react-router-dom'
import { navigationItems } from '../../constants/navigation'

interface Props {
  current: string
}

const BottomNavigation: React.FC<Props> = ({ current }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-around gap-2 p-4">
        {navigationItems.map(item => (
          <Link
            key={item.id}
            to={item.path}
            className={`${item.color} text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center ${
              item.id === current ? 'opacity-50 cursor-default pointer-events-none' : ''
            }`}
            aria-current={item.id === current ? 'page' : undefined}
          >
            <span className="mr-1 text-xl">{item.icon}</span>
            <span>{item.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

export default BottomNavigation
