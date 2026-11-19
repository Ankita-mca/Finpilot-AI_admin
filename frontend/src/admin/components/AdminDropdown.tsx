import React, { useState, useRef, useEffect } from 'react'

export interface DropdownItem {
  id: string
  label: React.ReactNode
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
  badge?: React.ReactNode
  divider?: boolean
}

export interface AdminDropdownProps {
  trigger: (props: { isOpen: boolean; toggle: () => void }) => React.ReactNode
  items?: DropdownItem[]
  children?: React.ReactNode
  align?: 'left' | 'right'
  width?: string | number
  className?: string
  menuClassName?: string
}

export default function AdminDropdown({
  trigger,
  items,
  children,
  align = 'right',
  width,
  className = '',
  menuClassName = '',
}: AdminDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const toggle = () => setIsOpen((prev) => !prev)
  const close = () => setIsOpen(false)

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div
      ref={wrapperRef}
      className={`admin-dropdown-wrapper ${className}`}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {trigger({ isOpen, toggle })}

      {isOpen && (
        <div
          className={`admin-dropdown-menu align-${align} ${menuClassName}`}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align]: 0,
            zIndex: 100,
            width: width ? (typeof width === 'number' ? `${width}px` : width) : 'auto',
            minWidth: '180px',
          }}
          role="menu"
        >
          {items ? (
            <div className="admin-dropdown-list">
              {items.map((item, index) => {
                if (item.divider) {
                  return <div key={item.id || index} className="admin-dropdown-divider" />
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      if (!item.disabled && item.onClick) {
                        item.onClick()
                        close()
                      }
                    }}
                    className={`admin-dropdown-item ${item.danger ? 'text-danger is-danger' : ''} ${item.disabled ? 'is-disabled' : ''}`}
                  >
                    {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
                    <span className="dropdown-item-text">{item.label}</span>
                    {item.badge && <span className="dropdown-item-badge">{item.badge}</span>}
                  </button>
                )
              })}
            </div>
          ) : (
            typeof children === 'function'
              ? (children as any)({ close })
              : children
          )}
        </div>
      )}
    </div>
  )
}

