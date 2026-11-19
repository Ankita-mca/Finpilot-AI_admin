import React from 'react'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  onClick?: () => void
  active?: boolean
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
  return (
    <nav className="admin-breadcrumb" aria-label="Breadcrumb">
      <div className="admin-breadcrumb-item">
        <Home size={14} className="admin-breadcrumb-home-icon" />
      </div>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <React.Fragment key={index}>
            <ChevronRight size={14} className="admin-breadcrumb-separator" />
            <div className={`admin-breadcrumb-item ${isLast || item.active ? 'active' : ''}`}>
              {item.onClick && !isLast ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="admin-breadcrumb-link"
                >
                  {item.label}
                </button>
              ) : (
                <span className="admin-breadcrumb-current">{item.label}</span>
              )}
            </div>
          </React.Fragment>
        )
      })}
    </nav>
  )
}
