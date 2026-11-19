import React from 'react'
import { MoreHorizontal } from 'lucide-react'
import AdminDropdown, { type DropdownItem } from './AdminDropdown'
import AdminButton from './AdminButton'

export interface TablePrimaryAction {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  variant?: 'ghost' | 'outline' | 'primary' | 'secondary' | 'danger'
  tooltip?: string
  disabled?: boolean
  showLabel?: boolean
}

export interface AdminTableActionMenuProps {
  primaryAction?: TablePrimaryAction
  secondaryActions?: DropdownItem[]
  extraActions?: TablePrimaryAction[]
  alignMenu?: 'left' | 'right'
}

export default function AdminTableActionMenu({
  primaryAction,
  secondaryActions,
  extraActions,
  alignMenu = 'right',
}: AdminTableActionMenuProps) {
  return (
    <div
      className="admin-table-actions-container"
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '0.4rem',
      }}
    >
      {/* Primary Action Button */}
      {primaryAction && (
        <AdminButton
          size="sm"
          variant={primaryAction.variant || 'ghost'}
          icon={primaryAction.icon}
          tooltip={primaryAction.tooltip || primaryAction.label}
          disabled={primaryAction.disabled}
          onClick={primaryAction.onClick}
          className="admin-table-primary-btn"
        >
          {primaryAction.showLabel ? primaryAction.label : undefined}
        </AdminButton>
      )}

      {/* Extra Icon Actions if any */}
      {extraActions &&
        extraActions.map((action) => (
          <AdminButton
            key={action.id}
            size="sm"
            variant={action.variant || 'ghost'}
            icon={action.icon}
            tooltip={action.tooltip || action.label}
            disabled={action.disabled}
            onClick={action.onClick}
            className="admin-table-action-btn"
          >
            {action.showLabel ? action.label : undefined}
          </AdminButton>
        ))}

      {/* More Actions Dropdown Menu */}
      {secondaryActions && secondaryActions.length > 0 && (
        <AdminDropdown
          align={alignMenu}
          width={200}
          items={secondaryActions}
          trigger={({ isOpen, toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className={`admin-table-more-btn ${isOpen ? 'is-active' : ''}`}
              title="More actions"
              aria-label="More row actions"
              aria-expanded={isOpen}
            >
              <MoreHorizontal size={15} />
            </button>
          )}
        />
      )}
    </div>
  )
}

