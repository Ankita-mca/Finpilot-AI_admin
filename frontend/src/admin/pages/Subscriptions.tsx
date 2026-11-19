import React, { useState, useMemo } from 'react'
import {
  CreditCard, Search, Filter, Sparkles, AlertTriangle, CheckCircle2,
  Calendar, ArrowRight, Eye, RefreshCw, XCircle, Clock, ChevronLeft, ChevronRight
} from 'lucide-react'
import AdminStatCard from '../components/AdminStatCard'
import StatusBadge from '../components/StatusBadge'
import AdminModal from '../components/AdminModal'
import AdminButton from '../components/AdminButton'
import AdminSelect from '../components/AdminSelect'
import AdminTableActionMenu from '../components/AdminTableActionMenu'
import AdminConfirmDialog from '../components/AdminConfirmDialog'
import type { DropdownItem } from '../components/AdminDropdown'
import { MOCK_SUBSCRIPTIONS, type SubscriptionRecord } from '../services/mockDataService'
import type { OrgStatus, PlanTier } from '../types/admin.types'

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(MOCK_SUBSCRIPTIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrgStatus>('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  // Modals
  const [selectedSub, setSelectedSub] = useState<SubscriptionRecord | null>(null)
  const [actionModal, setActionModal] = useState<{
    type: 'change_plan' | 'extend_trial' | 'cancel'
    sub: SubscriptionRecord
  } | null>(null)
  const [newPlanTier, setNewPlanTier] = useState<PlanTier>('business')
  const [extensionDays, setExtensionDays] = useState(14)
  const [actionToast, setActionToast] = useState<string | null>(null)

  // Summary counts
  const totalCount = subscriptions.length
  const activeCount = subscriptions.filter((s) => s.status === 'active').length
  const trialCount = subscriptions.filter((s) => s.status === 'trial').length
  const pastDueCount = subscriptions.filter((s) => s.status === 'past_due').length
  const closedCount = subscriptions.filter((s) => s.status === 'closed').length

  // Filtered subscriptions
  const filteredSubs = useMemo(() => {
    return subscriptions.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        s.organizationName.toLowerCase().includes(q) ||
        s.planName.toLowerCase().includes(q) ||
        s.organizationId.toLowerCase().includes(q)
      )
    })
  }, [subscriptions, statusFilter, searchQuery])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSubs.length / pageSize))
  const paginatedSubs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredSubs.slice(start, start + pageSize)
  }, [filteredSubs, currentPage, pageSize])

  const handleExecuteAction = (reason?: string) => {
    if (!actionModal) return
    const { type, sub } = actionModal

    if (type === 'change_plan') {
      const planNameFormatted = newPlanTier.charAt(0).toUpperCase() + newPlanTier.slice(1) + ' Plan'
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === sub.id ? { ...s, planName: planNameFormatted, planTier: newPlanTier } : s
        )
      )
      setActionToast(
        `Subscription for ${sub.organizationName} updated to ${planNameFormatted}${reason ? ` (${reason})` : ''}. (Demo action)`
      )
    } else if (type === 'extend_trial') {
      setActionToast(`Trial for ${sub.organizationName} extended by ${extensionDays} days. (Demo action)`)
    } else if (type === 'cancel') {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: 'closed', autoRenew: false } : s))
      )
      setActionToast(
        `Subscription for ${sub.organizationName} scheduled for termination${reason ? ` (Reason: ${reason})` : ''}. (Demo action)`
      )
    }

    setActionModal(null)
    setTimeout(() => setActionToast(null), 5000)
  }

  const statusOptions = [
    { value: 'all' as const, label: `All Statuses (${totalCount})` },
    { value: 'active' as const, label: `Active (${activeCount})` },
    { value: 'trial' as const, label: `Trial (${trialCount})` },
    { value: 'past_due' as const, label: `Past Due (${pastDueCount})` },
    { value: 'closed' as const, label: `Closed (${closedCount})` },
  ]

  const planOptions: { value: PlanTier; label: string }[] = [
    { value: 'starter', label: 'Starter Plan (₹1,499/mo)' },
    { value: 'growth', label: 'Growth Plan (₹3,499/mo)' },
    { value: 'business', label: 'Business Plan (₹7,999/mo)' },
    { value: 'enterprise', label: 'Enterprise Plan (Custom Quotas)' },
  ]

  const extensionOptions = [
    { value: 7, label: '+7 Days Extension' },
    { value: 14, label: '+14 Days Extension (Standard)' },
    { value: 30, label: '+30 Days Extension (Special Approval)' },
  ]

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Tenant Subscriptions</h2>
          <p className="admin-page-subheading">
            Oversight of tenant commercial plans, trial cadences, and automated renewals.
          </p>
        </div>
        <div className="admin-page-actions">
          <div className="admin-data-source-pill">
            <span className="source-dot mock" />
            <span>Billing Telemetry Demo</span>
          </div>
        </div>
      </div>

      {actionToast && (
        <div className="admin-alert admin-alert-info">
          <CheckCircle2 size={16} className="text-success" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="admin-stat-cards-grid">
        <AdminStatCard
          label="Active Subscriptions"
          value={activeCount}
          changeType="positive"
          change={`${Math.round((activeCount / totalCount) * 100)}%`}
          icon={<CreditCard size={20} className="text-success" />}
          description="Paid recurring tiers"
        />
        <AdminStatCard
          label="Trial Tenancies"
          value={trialCount}
          icon={<Sparkles size={20} className="text-info" />}
          description="14-day free trials"
        />
        <AdminStatCard
          label="Past-Due Accounts"
          value={pastDueCount}
          changeType="negative"
          icon={<AlertTriangle size={20} className="text-danger" />}
          description="Failed recurring payments"
        />
        <AdminStatCard
          label="Cancelled / Expired"
          value={closedCount}
          icon={<XCircle size={20} className="text-muted" />}
          description="Non-renewing accounts"
        />
      </div>

      {/* Toolbar Search & Filter */}
      <div className="admin-toolbar-card">
        <div className="admin-search-box">
          <Search size={15} className="admin-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by organization or plan..."
            className="admin-search-input-field"
          />
          {searchQuery && (
            <button
              type="button"
              className="admin-clear-search-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search query"
            >
              ×
            </button>
          )}
        </div>

        <div className="admin-filter-controls-row">
          <AdminSelect<'all' | OrgStatus>
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val)
              setCurrentPage(1)
            }}
            options={statusOptions}
            size="md"
            icon={<Filter size={14} />}
            label="Plan Status"
          />

          {(searchQuery || statusFilter !== 'all') && (
            <AdminButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setCurrentPage(1)
              }}
            >
              Reset Filters
            </AdminButton>
          )}
        </div>
      </div>

      {/* Subscriptions Table Card */}
      <div className="admin-card admin-table-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Current Plan</th>
                <th>Status</th>
                <th>Cadence</th>
                <th>Start Date</th>
                <th>Renewal / Expiry</th>
                <th>Auto-Renew</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSubs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-table-empty">
                    <CreditCard size={36} className="empty-icon" />
                    <div className="empty-title">No subscriptions found</div>
                    <div className="empty-desc">No records matched the selected query or filter.</div>
                    {(searchQuery || statusFilter !== 'all') && (
                      <AdminButton
                        variant="secondary"
                        size="sm"
                        style={{ marginTop: '0.75rem' }}
                        onClick={() => {
                          setSearchQuery('')
                          setStatusFilter('all')
                        }}
                      >
                        Reset Search & Filters
                      </AdminButton>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedSubs.map((sub) => {
                  const secondaryItems: DropdownItem[] = [
                    {
                      id: 'change-tier',
                      label: 'Modify Plan Tier',
                      icon: <RefreshCw size={13} />,
                      onClick: () => {
                        setNewPlanTier(sub.planTier)
                        setActionModal({ type: 'change_plan', sub })
                      },
                    },
                  ]

                  if (sub.status === 'trial') {
                    secondaryItems.push({
                      id: 'extend-trial',
                      label: 'Extend 14-Day Trial',
                      icon: <Calendar size={13} />,
                      onClick: () => setActionModal({ type: 'extend_trial', sub }),
                    })
                  }

                  if (sub.status !== 'closed') {
                    secondaryItems.push({
                      id: 'cancel-sub',
                      label: 'Schedule Cancellation',
                      icon: <XCircle size={13} />,
                      danger: true,
                      onClick: () => setActionModal({ type: 'cancel', sub }),
                    })
                  }

                  return (
                    <tr
                      key={sub.id}
                      className="admin-table-clickable-row"
                      onClick={() => setSelectedSub(sub)}
                    >
                      <td className="font-semibold">
                        <div className="org-name-text">{sub.organizationName}</div>
                        <div className="text-muted text-xs font-mono">{sub.organizationId.slice(0, 8)}...</div>
                      </td>
                      <td>
                        <span className={`admin-plan-badge tier-${sub.planTier}`}>
                          {sub.planName}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={sub.status} />
                      </td>
                      <td>{sub.billingCycle === 'annually' ? 'Annual' : 'Monthly'}</td>
                      <td className="text-muted">{sub.periodStart}</td>
                      <td className="font-semibold">{sub.periodEnd}</td>
                      <td>
                        <span className={`admin-badge ${sub.autoRenew ? 'admin-badge-active' : 'admin-badge-closed'}`}>
                          {sub.autoRenew ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <AdminTableActionMenu
                          primaryAction={{
                            id: 'view',
                            label: 'View History',
                            icon: <Eye size={14} />,
                            onClick: () => setSelectedSub(sub),
                            variant: 'ghost',
                            tooltip: 'Inspect subscription ledger & history',
                            showLabel: false,
                          }}
                          secondaryActions={secondaryItems}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredSubs.length > 0 && (
          <div className="admin-pagination-footer">
            <div className="pagination-info">
              Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredSubs.length)}</strong> to{' '}
              <strong>{Math.min(currentPage * pageSize, filteredSubs.length)}</strong> of{' '}
              <strong>{filteredSubs.length}</strong> subscriptions
            </div>
            <div className="pagination-controls">
              <AdminButton
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={15} />}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </AdminButton>

              <div className="pagination-pages-list">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`admin-page-num-btn ${currentPage === p ? 'active' : ''}`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <AdminButton
                variant="outline"
                size="sm"
                icon={<ChevronRight size={15} />}
                iconPosition="right"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
              </AdminButton>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Details Modal */}
      {selectedSub && (
        <AdminModal
          isOpen={true}
          onClose={() => setSelectedSub(null)}
          title={`Subscription — ${selectedSub.organizationName}`}
          subtitle={`Plan: ${selectedSub.planName}`}
        >
          <div className="admin-info-definition-list">
            <div className="admin-info-item">
              <span className="info-label">Organization ID</span>
              <span className="info-value font-mono">{selectedSub.organizationId}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Subscription Tier</span>
              <span className={`admin-plan-badge tier-${selectedSub.planTier}`}>{selectedSub.planName}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Status</span>
              <StatusBadge status={selectedSub.status} />
            </div>
            <div className="admin-info-item">
              <span className="info-label">Billing Cycle</span>
              <span className="info-value">{selectedSub.billingCycle}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Current Billing Period</span>
              <span className="info-value">{selectedSub.periodStart} to {selectedSub.periodEnd}</span>
            </div>
          </div>

          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '1.25rem 0 0.5rem 0', color: '#0f172a' }}>
            Subscription Event History
          </h4>
          <div className="admin-activity-list">
            {selectedSub.history.map((h, i) => (
              <div key={i} className="admin-activity-item severity-info">
                <div className="admin-activity-body">
                  <div className="admin-activity-row">
                    <span className="admin-activity-title">{h.event}</span>
                    <span className="admin-activity-time"><Clock size={12} /> {h.date}</span>
                  </div>
                  <p className="admin-activity-desc">{h.details}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <AdminButton
              variant="outline"
              size="sm"
              icon={<RefreshCw size={13} />}
              onClick={() => {
                const s = selectedSub
                setSelectedSub(null)
                setNewPlanTier(s.planTier)
                setActionModal({ type: 'change_plan', sub: s })
              }}
            >
              Modify Plan
            </AdminButton>
            {selectedSub.status === 'trial' && (
              <AdminButton
                variant="outline"
                size="sm"
                icon={<Calendar size={13} />}
                onClick={() => {
                  const s = selectedSub
                  setSelectedSub(null)
                  setActionModal({ type: 'extend_trial', sub: s })
                }}
              >
                Extend Trial
              </AdminButton>
            )}
          </div>
        </AdminModal>
      )}

      {/* Action Modals using AdminConfirmDialog */}
      {actionModal && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setActionModal(null)}
          title={
            actionModal.type === 'change_plan'
              ? 'Change Plan Tier'
              : actionModal.type === 'extend_trial'
              ? 'Extend Trial Period'
              : 'Cancel Subscription'
          }
          isDanger={actionModal.type === 'cancel'}
          confirmLabel={
            actionModal.type === 'change_plan'
              ? 'Update Plan Tier'
              : actionModal.type === 'extend_trial'
              ? 'Apply Extension'
              : 'Confirm Cancellation'
          }
          description={
            actionModal.type === 'change_plan'
              ? 'Select an updated commercial tier for this tenant workspace. Quotas update immediately.'
              : actionModal.type === 'extend_trial'
              ? 'Grant an extended evaluation period to allow the customer to complete onboarding.'
              : 'Are you sure you want to cancel this recurring subscription? The workspace retains access until the billing period end.'
          }
          targetDetails={[
            { label: 'Organization', value: actionModal.sub.organizationName },
            { label: 'Current Plan', value: actionModal.sub.planName },
            { label: 'Period Ends', value: actionModal.sub.periodEnd },
          ]}
          requireReason={actionModal.type === 'cancel' || actionModal.type === 'change_plan'}
          reasonLabel="Operational Reason for Modification"
          reasonPlaceholder="e.g. Customer requested upgrade, retention offer, or non-renewal..."
          warningNote={
            actionModal.type === 'cancel'
              ? 'Auto-renewal will be turned off immediately. No further invoices will be generated.'
              : undefined
          }
          onConfirm={handleExecuteAction}
        >
          {actionModal.type === 'change_plan' && (
            <div className="admin-form-group">
              <label className="admin-form-label">Target Commercial Plan</label>
              <AdminSelect<PlanTier>
                value={newPlanTier}
                onChange={(val) => setNewPlanTier(val)}
                options={planOptions}
                size="md"
              />
            </div>
          )}

          {actionModal.type === 'extend_trial' && (
            <div className="admin-form-group">
              <label className="admin-form-label">Extension Period</label>
              <AdminSelect<number>
                value={extensionDays}
                onChange={(val) => setExtensionDays(val)}
                options={extensionOptions}
                size="md"
              />
            </div>
          )}
        </AdminConfirmDialog>
      )}
    </div>
  )
}
