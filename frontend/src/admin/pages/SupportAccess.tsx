import React, { useState } from 'react'
import {
  ShieldCheck, ShieldAlert, Clock, CheckCircle2, XCircle,
  AlertTriangle, KeyRound, Lock, UserCheck, Plus
} from 'lucide-react'
import AdminStatCard from '../components/AdminStatCard'
import StatusBadge from '../components/StatusBadge'
import AdminButton from '../components/AdminButton'
import AdminSelect from '../components/AdminSelect'
import AdminTableActionMenu from '../components/AdminTableActionMenu'
import AdminConfirmDialog from '../components/AdminConfirmDialog'
import { MOCK_SUPPORT_REQUESTS, type SupportAccessRequest } from '../services/mockDataService'

export default function SupportAccess() {
  const [requests, setRequests] = useState<SupportAccessRequest[]>(MOCK_SUPPORT_REQUESTS)
  const [activeModal, setActiveModal] = useState<{
    type: 'approve' | 'reject' | 'revoke'
    req: SupportAccessRequest
  } | null>(null)
  const [newRequestModal, setNewRequestModal] = useState(false)
  const [newOrgName, setNewOrgName] = useState('Acme Industries Pvt Ltd')
  const [newTicketId, setNewTicketId] = useState('FP-9002')
  const [newReason, setNewReason] = useState('')
  const [newScope, setNewScope] = useState<'read_settings' | 'reconciliation_diagnostics' | 'ingestion_debug'>('read_settings')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const activeCount = requests.filter((r) => r.status === 'active').length
  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const totalCount = requests.length

  const handleExecuteModalAction = (reason?: string) => {
    if (!activeModal) return
    const { type, req } = activeModal

    if (type === 'approve') {
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'active', approvedBy: 'admin@finpilot.ai' } : r))
      )
      setToastMsg(`Support access for ticket #${req.ticketId} approved. 2-hour window opened. (Demo Action)`)
    } else if (type === 'reject') {
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'revoked' } : r))
      )
      setToastMsg(`Support access request #${req.ticketId} rejected${reason ? ` (${reason})` : ''}. (Demo Action)`)
    } else if (type === 'revoke') {
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'revoked' } : r))
      )
      setToastMsg(`Active session for #${req.ticketId} revoked immediately${reason ? ` (${reason})` : ''}. (Demo Action)`)
    }

    setActiveModal(null)
    setTimeout(() => setToastMsg(null), 5000)
  }

  const handleCreateRequest = () => {
    const newEntry: SupportAccessRequest = {
      id: `req-${Date.now()}`,
      ticketId: newTicketId || 'FP-NEW',
      organizationId: 'de042d83-8642-40b9-abe3-9f1aae4f28f0',
      organizationName: newOrgName,
      requestedByAgent: 'Operator Support Agent',
      agentEmail: 'agent@finpilot.ai',
      scope: newScope,
      reason: newReason || 'Investigating reported tenant data anomaly',
      status: 'pending',
      requestedAt: 'Just now',
      expiresAt: 'In 2 hours',
    }
    setRequests((prev) => [newEntry, ...prev])
    setNewRequestModal(false)
    setNewReason('')
    setToastMsg(`New support access request for ${newOrgName} submitted for review. (Demo action)`)
    setTimeout(() => setToastMsg(null), 5000)
  }

  const orgSelectOptions = [
    { value: 'Acme Industries Pvt Ltd', label: 'Acme Industries Pvt Ltd' },
    { value: 'Vanguard Logistics Corp', label: 'Vanguard Logistics Corp' },
    { value: 'Zenith Tech Solutions', label: 'Zenith Tech Solutions' },
  ]

  const scopeSelectOptions: { value: 'read_settings' | 'reconciliation_diagnostics' | 'ingestion_debug'; label: string }[] = [
    { value: 'read_settings', label: 'Read-only Settings & GST Parameters' },
    { value: 'reconciliation_diagnostics', label: 'Bank Reconciliation Diagnostic Outbox' },
    { value: 'ingestion_debug', label: 'CSV Ingestion & Schema Error Inspection' },
  ]

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Time-Limited Support Access Governance</h2>
          <p className="admin-page-subheading">
            Strict Zero-Trust access control. Support staff must request short-lived (max 2-hour), read-only scope for diagnosed tenant customer tickets.
          </p>
        </div>
        <div className="admin-page-actions">
          <AdminButton
            variant="primary"
            size="md"
            icon={<Plus size={14} />}
            onClick={() => setNewRequestModal(true)}
            tooltip="Submit a new customer support ticket access request"
          >
            Request Support Ticket Access
          </AdminButton>
        </div>
      </div>

      {/* Strict Security Policy Notice */}
      <div className="admin-privacy-banner">
        <ShieldAlert size={18} className="text-warning flex-shrink-0" />
        <div className="privacy-text">
          <strong>Mandatory Customer Consent & Dual Authorization:</strong> Support Access grants temporary, read-only diagnostic visibility to configuration and reconciliation tables. Unrestricted access to tenant invoice amounts or bank accounts is strictly blocked. Every access event is cryptographically audited.
        </div>
      </div>

      {toastMsg && (
        <div className="admin-alert admin-alert-info">
          <CheckCircle2 size={16} className="text-success" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="admin-stat-cards-grid">
        <AdminStatCard
          label="Active Diagnostic Sessions"
          value={activeCount}
          changeType={activeCount > 0 ? 'neutral' : 'positive'}
          icon={<KeyRound size={20} className={activeCount > 0 ? 'text-warning' : 'text-success'} />}
          description="Live temporary access tokens"
        />
        <AdminStatCard
          label="Pending Approvals"
          value={pendingCount}
          icon={<Clock size={20} className="text-info" />}
          description="Awaiting authorization"
        />
        <AdminStatCard
          label="Total Historical Tickets"
          value={totalCount}
          icon={<ShieldCheck size={20} />}
          description="Audited ticket investigations"
        />
        <AdminStatCard
          label="Default Session Ceiling"
          value="120 Mins"
          icon={<Lock size={20} className="text-muted" />}
          description="Automatic token expiration"
        />
      </div>

      {/* Access Requests Table Card */}
      <div className="admin-card admin-table-card">
        <div className="admin-card-header" style={{ padding: '1.25rem 1.5rem 0.5rem 1.5rem' }}>
          <div>
            <h3 className="admin-card-title">Support Access Requests & Session Roster</h3>
            <p className="admin-card-subtitle">Detailed ticket authorizations, scope limits, and live session termination</p>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Target Organization</th>
                <th>Support Agent</th>
                <th>Requested Scope</th>
                <th>Access Justification</th>
                <th>Status</th>
                <th>Window Expiry</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td className="font-mono text-xs font-semibold">{req.ticketId}</td>
                  <td className="font-semibold">{req.organizationName}</td>
                  <td>
                    <div>{req.requestedByAgent}</div>
                    <div className="text-muted text-xs">{req.agentEmail}</div>
                  </td>
                  <td>
                    <span className="font-mono text-xs" style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                      {req.scope.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-xs" style={{ maxWidth: '240px' }} title={req.reason}>
                    {req.reason}
                  </td>
                  <td>
                    <span
                      className={`admin-badge ${
                        req.status === 'active'
                          ? 'admin-badge-active'
                          : req.status === 'pending'
                          ? 'admin-badge-trial'
                          : 'admin-badge-closed'
                      }`}
                    >
                      {req.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-muted text-xs font-mono">{req.expiresAt}</td>
                  <td style={{ textAlign: 'right' }}>
                    {req.status === 'pending' && (
                      <AdminTableActionMenu
                        primaryAction={{
                          id: 'approve',
                          label: 'Approve',
                          icon: <CheckCircle2 size={13} />,
                          variant: 'outline',
                          tooltip: 'Authorize 2-hour temporary diagnostic window',
                          showLabel: true,
                          onClick: () => setActiveModal({ type: 'approve', req }),
                        }}
                        secondaryActions={[
                          {
                            id: 'reject',
                            label: 'Reject Request',
                            icon: <XCircle size={13} />,
                            danger: true,
                            onClick: () => setActiveModal({ type: 'reject', req }),
                          },
                        ]}
                      />
                    )}
                    {req.status === 'active' && (
                      <AdminTableActionMenu
                        primaryAction={{
                          id: 'revoke',
                          label: 'Revoke Now',
                          icon: <Lock size={13} />,
                          variant: 'danger',
                          tooltip: 'Immediately revoke active diagnostic access',
                          showLabel: true,
                          onClick: () => setActiveModal({ type: 'revoke', req }),
                        }}
                      />
                    )}
                    {req.status === 'revoked' && (
                      <span className="text-muted text-xs">Expired / Revoked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {activeModal && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title={
            activeModal.type === 'approve'
              ? `Approve Support Access for Ticket #${activeModal.req.ticketId}`
              : activeModal.type === 'reject'
              ? `Reject Request #${activeModal.req.ticketId}`
              : `Immediately Revoke Active Session for #${activeModal.req.ticketId}`
          }
          isDanger={activeModal.type !== 'approve'}
          confirmLabel={
            activeModal.type === 'approve'
              ? 'Authorize 2-Hour Window'
              : activeModal.type === 'reject'
              ? 'Reject Access'
              : 'Revoke Access Now'
          }
          description={
            activeModal.type === 'approve'
              ? 'Authorizing this ticket grants a strictly monitored, 2-hour read-only diagnostic session.'
              : activeModal.type === 'reject'
              ? 'Rejecting this request terminates the support authorization.'
              : 'Immediately revoking this session invalidates the active support token.'
          }
          targetDetails={[
            { label: 'Organization', value: activeModal.req.organizationName },
            { label: 'Agent', value: `${activeModal.req.requestedByAgent} (${activeModal.req.agentEmail})` },
            { label: 'Scope', value: activeModal.req.scope.replace('_', ' ') },
            { label: 'Reason', value: activeModal.req.reason },
          ]}
          requireReason={activeModal.type === 'revoke' || activeModal.type === 'reject'}
          reasonLabel="Justification for Decision"
          reasonPlaceholder="e.g. Issue resolved, incorrect scope, or security review..."
          onConfirm={handleExecuteModalAction}
        />
      )}

      {/* New Request Modal */}
      {newRequestModal && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setNewRequestModal(false)}
          title="Submit Temporary Support Access Request"
          confirmLabel="Submit for Review"
          description="Requests require administrative authorization before diagnostic permissions are granted."
          onConfirm={handleCreateRequest}
        >
          <div className="admin-form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="admin-form-label">Support Ticket ID (Zendesk / Jira)</label>
            <input
              type="text"
              value={newTicketId}
              onChange={(e) => setNewTicketId(e.target.value)}
              placeholder="e.g. FP-9042"
              className="admin-form-input"
            />
          </div>

          <div className="admin-form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="admin-form-label">Target Organization</label>
            <AdminSelect
              value={newOrgName}
              onChange={(val) => setNewOrgName(val)}
              options={orgSelectOptions}
              size="md"
            />
          </div>

          <div className="admin-form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="admin-form-label">Requested Diagnostic Scope</label>
            <AdminSelect<'read_settings' | 'reconciliation_diagnostics' | 'ingestion_debug'>
              value={newScope}
              onChange={(val) => setNewScope(val)}
              options={scopeSelectOptions}
              size="md"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Customer Ticket Context & Justification</label>
            <textarea
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Provide exact customer issue description for the audit log..."
              className="admin-form-input"
              rows={2}
            />
          </div>
        </AdminConfirmDialog>
      )}
    </div>
  )
}
