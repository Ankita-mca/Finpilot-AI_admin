import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption<T = string> {
  value: T
  label: string
  icon?: React.ReactNode
  badge?: React.ReactNode
}

export interface AdminSelectProps<T = string> {
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  label?: string
  placeholder?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
  icon?: React.ReactNode
  width?: string | number
}

export default function AdminSelect<T extends string | number = string>({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select option...',
  size = 'md',
  disabled = false,
  className = '',
  icon,
  width,
}: AdminSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
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
      ref={containerRef}
      className={`admin-select-container size-${size} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: width ? (typeof width === 'number' ? `${width}px` : width) : 'auto',
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`admin-select-trigger ${isOpen ? 'is-open' : ''} ${size === 'sm' ? 'trigger-sm' : 'trigger-md'}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="admin-select-trigger-content">
          {(selectedOption?.icon || icon) && (
            <span className="admin-select-icon">{selectedOption?.icon || icon}</span>
          )}
          {label && <span className="admin-select-label-prefix">{label}:</span>}
          <span className="admin-select-value-text">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="admin-select-badge">{selectedOption.badge}</span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`admin-select-chevron ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="admin-select-dropdown"
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 100,
            minWidth: '100%',
            width: 'max-content',
            maxWidth: '320px',
          }}
        >
          <div className="admin-select-options-list">
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`admin-select-option ${isSelected ? 'is-selected' : ''}`}
                >
                  <div className="admin-select-option-label">
                    {option.icon && <span className="option-icon">{option.icon}</span>}
                    <span>{option.label}</span>
                    {option.badge && <span className="option-badge">{option.badge}</span>}
                  </div>
                  {isSelected && <Check size={14} className="admin-select-check text-success" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

