import React, { useState, useEffect } from 'react'
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react'
import AdminModal from './AdminModal'
import AdminButton from './AdminButton'

export interface TargetDetail {
  label: string
  value: React.ReactNode
}

export interface AdminConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason?: string) => void
  title: string
  description: React.ReactNode
  targetDetails?: TargetDetail[]
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  confirmLabel?: string
  cancelLabel?: string
  isDanger?: boolean
  loading?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
  warningNote?: string
}

export default function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  targetDetails,
  requireReason = false,
  reasonLabel = 'Reason for this administrative action',
  reasonPlaceholder = 'Please enter an operational justification for audit purposes...',
  confirmLabel,
  cancelLabel = 'Cancel',
  isDanger = false,
  loading = false,
  icon,
  children,
  warningNote,
}: AdminConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setReason('')
      setReasonError(null)
    }
  }, [isOpen])

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setReasonError('A valid operational reason is required for this action.')
      return
    }
    onConfirm(reason.trim())
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      isDanger={isDanger}
      loading={loading}
    >
      <div className="admin-confirm-dialog-content">
        {/* Explanation */}
        <div className="admin-confirm-description" style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, marginBottom: '1rem' }}>
          {description}
        </div>

        {/* Target Details Card */}
        {targetDetails && targetDetails.length > 0 && (
          <div
            className="admin-confirm-target-card"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'grid',
              gap: '0.45rem',
            }}
          >
            {targetDetails.map((td, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                }}
              >
                <span style={{ color: '#64748b', fontWeight: 500 }}>{td.label}:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{td.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Optional Custom Form Elements (e.g. extension days, plan selection) */}
        {children && <div style={{ marginBottom: '1rem' }}>{children}</div>}

        {/* Reason Input (When required or requested) */}
        {requireReason && (
          <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
            <label className="admin-form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{reasonLabel}</span>
              <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>* Required</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (reasonError) setReasonError(null)
              }}
              placeholder={reasonPlaceholder}
              rows={2}
              className={`admin-form-input ${reasonError ? 'has-error' : ''}`}
              style={{
                width: '100%',
                borderRadius: '8px',
                borderColor: reasonError ? '#ef4444' : undefined,
                fontSize: '0.82rem',
              }}
            />
            {reasonError && (
              <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                {reasonError}
              </div>
            )}
          </div>
        )}

        {/* Warning Note */}
        {warningNote && (
          <div
            className={`admin-alert ${isDanger ? 'admin-alert-danger' : 'admin-alert-warning'}`}
            style={{ marginBottom: '1rem' }}
          >
            <AlertTriangle size={16} />
            <span>{warningNote}</span>
          </div>
        )}

        {/* Action Buttons in Modal Footer */}
        <div
          className="admin-confirm-footer"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.65rem',
            marginTop: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <AdminButton
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </AdminButton>
          <AdminButton
            variant={isDanger ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmLabel || (isDanger ? 'Confirm Action' : 'Save Changes')}
          </AdminButton>
        </div>
      </div>
    </AdminModal>
  )
}

