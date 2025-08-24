import React from 'react'
import { useNavigate } from 'react-router-dom'
import { navigationItems } from '../../constants/navigation'

const Navigation: React.FC = () => {
  const navigate = useNavigate()

  const items = navigationItems.filter(item => item.id !== 'home')

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => handleNavigation(item.path)}
          className={`${item.color} text-white rounded-xl p-8 text-left transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 shadow-lg hover:shadow-xl animate-slide-in-up`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start space-x-4">
            <div className="text-5xl animate-bounce-gentle" style={{ animationDelay: `${index * 0.2}s` }}>
              {item.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{item.title}</h2>
              <p className="text-lg opacity-90">{item.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

export default Navigation
