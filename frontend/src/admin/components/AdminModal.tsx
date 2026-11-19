import React, { useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import AdminButton from './AdminButton'

interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  isDanger?: boolean
  confirmDisabled?: boolean
  loading?: boolean
  maxWidth?: string
}

export default function AdminModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  isDanger = false,
  confirmDisabled = false,
  loading = false,
  maxWidth = '540px',
}: AdminModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="admin-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="admin-modal-container"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div className="admin-modal-title-group">
            {isDanger && (
              <div className="admin-modal-danger-icon">
                <AlertTriangle size={18} className="text-danger" />
              </div>
            )}
            <div>
              <h3 className="admin-modal-title">{title}</h3>
              {subtitle && <p className="admin-modal-subtitle">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            className="admin-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="admin-modal-body">
          {children}
        </div>

        {/* Modal Footer */}
        {(onConfirm || cancelLabel) && (
          <div className="admin-modal-footer">
            {cancelLabel && (
              <AdminButton
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={loading}
              >
                {cancelLabel}
              </AdminButton>
            )}
            {onConfirm && (
              <AdminButton
                variant={isDanger ? 'danger' : 'primary'}
                size="md"
                onClick={onConfirm}
                disabled={confirmDisabled || loading}
                loading={loading}
              >
                {confirmLabel || (isDanger ? 'Confirm Action' : 'Save Changes')}
              </AdminButton>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
