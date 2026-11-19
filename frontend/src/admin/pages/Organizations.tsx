import React, { useState, useEffect, useMemo } from 'react'
import {
  Building2, Search, Filter, RefreshCw, Eye, ChevronLeft, ChevronRight,
  Copy, Check, ShieldAlert, Sparkles, AlertTriangle, ShieldCheck, XCircle, Power
} from 'lucide-react'
import AdminStatCard from '../components/AdminStatCard'
import StatusBadge from '../components/StatusBadge'
import AdminButton from '../components/AdminButton'
import AdminSelect from '../components/AdminSelect'
import AdminTableActionMenu from '../components/AdminTableActionMenu'
import AdminConfirmDialog from '../components/AdminConfirmDialog'
import { adminApi } from '../services/adminApi'
import type { OrganizationRecord, OrganizationStats, OrgStatus } from '../types/admin.types'

interface OrganizationsProps {
  onSelectOrg: (orgId: string) => void
}

export default function Organizations({ onSelectOrg }: OrganizationsProps) {
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([])
  const [stats, setStats] = useState<OrganizationStats>({
    total: 0,
    active: 0,
    trial: 0,
    suspended: 0,
    closed: 0,
  })
  const [isLiveApi, setIsLiveApi] = useState(false)
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrgStatus>('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Suspend/Reactivate Modal
  const [suspendTarget, setSuspendTarget] = useState<OrganizationRecord | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getOrganizations()
      setOrganizations(res.items)
      setStats(res.stats)
      setIsLiveApi(res.isLive)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCopyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleToggleSuspend = (reason?: string) => {
    if (!suspendTarget) return
    const isCurrentlySuspended = suspendTarget.status === 'suspended'
    const newStatus: OrgStatus = isCurrentlySuspended ? 'active' : 'suspended'

    setOrganizations((prev) =>
      prev.map((o) => (o.id === suspendTarget.id ? { ...o, status: newStatus } : o))
    )

    // Update stats locally
    setStats((prev) => ({
      ...prev,
      suspended: isCurrentlySuspended ? Math.max(0, prev.suspended - 1) : prev.suspended + 1,
      active: isCurrentlySuspended ? prev.active + 1 : Math.max(0, prev.active - 1),
    }))

    setActionNotice(
      `Organization "${suspendTarget.name}" has been ${isCurrentlySuspended ? 'reactivated' : 'suspended'}. Reason: "${reason || 'Operational adjustment'}". (Demo action)`
    )
    setSuspendTarget(null)
    setTimeout(() => setActionNotice(null), 5000)
  }

  // Filtered & Searched data
  const filteredData = useMemo(() => {
    return organizations.filter((org) => {
      if (statusFilter !== 'all' && org.status !== statusFilter) {
        return false
      }
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const matchName = org.name.toLowerCase().includes(q)
      const matchOwner = org.ownerName.toLowerCase().includes(q)
      const matchEmail = org.ownerEmail.toLowerCase().includes(q)
      const matchId = org.id.toLowerCase().includes(q)
      return matchName || matchOwner || matchEmail || matchId
    })
  }, [organizations, statusFilter, searchQuery])

  // Paginated data
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const statusSelectOptions: { value: 'all' | OrgStatus; label: string }[] = [
    { value: 'all', label: `All Statuses (${stats.total})` },
    { value: 'active', label: `Active (${stats.active})` },
    { value: 'trial', label: `Trial (${stats.trial})` },
    { value: 'suspended', label: `Suspended (${stats.suspended})` },
    { value: 'closed', label: `Closed (${stats.closed})` },
  ]

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Organizations</h2>
          <p className="admin-page-subheading">
            Manage and monitor all business tenancies registered on FinPilot AI.
          </p>
        </div>
        <div className="admin-page-actions">
          <div className="admin-data-source-pill">
            <span className={`source-dot ${isLiveApi ? 'live' : 'mock'}`} />
            <span>{isLiveApi ? 'Connected to Django API' : 'Demonstration Simulation Data'}</span>
          </div>
          <AdminButton
            variant="outline"
            size="sm"
            icon={<RefreshCw size={13} className={loading ? 'admin-spinner' : ''} />}
            onClick={fetchData}
            disabled={loading}
            tooltip="Refresh organizations list"
          >
            Refresh
          </AdminButton>
        </div>
      </div>

      {actionNotice && (
        <div className="admin-alert admin-alert-info" role="alert">
          <ShieldCheck size={16} className="text-success" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Security Privacy Notice */}
      <div className="admin-privacy-banner">
        <ShieldAlert size={16} className="text-warning flex-shrink-0" />
        <div className="privacy-text">
          <strong>Tenant Privacy Boundary Enforced:</strong> Platform Admin view displays operational metadata and entity counts only. All financial figures, invoice amounts, ledger records, and banking credentials are completely excluded.
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="admin-stat-cards-grid">
        <AdminStatCard
          label="Total Organizations"
          value={stats.total}
          icon={<Building2 size={20} />}
          description="Total tenancies in system"
        />
        <AdminStatCard
          label="Active Organizations"
          value={stats.active}
          changeType="positive"
          change={`${Math.round((stats.active / (stats.total || 1)) * 100)}%`}
          icon={<Building2 size={20} className="text-success" />}
          description="In operational status"
        />
        <AdminStatCard
          label="Trial Organizations"
          value={stats.trial}
          icon={<Sparkles size={20} className="text-info" />}
          description="On trial periods"
        />
        <AdminStatCard
          label="Suspended Organizations"
          value={stats.suspended}
          changeType="negative"
          icon={<Building2 size={20} className="text-danger" />}
          description="Overdue or locked"
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="admin-toolbar-card">
        <div className="admin-search-box">
          <Search size={15} className="admin-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by organization name, email or ID..."
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
            onChange={(val) => setStatusFilter(val)}
            options={statusSelectOptions}
            size="md"
            icon={<Filter size={14} />}
            label="Status"
          />

          {(searchQuery || statusFilter !== 'all') && (
            <AdminButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
            >
              Reset Filters
            </AdminButton>
          )}
        </div>
      </div>

      {/* Organizations Table Card */}
      <div className="admin-card admin-table-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Organization Name</th>
                <th>Organization ID</th>
                <th>Owner</th>
                <th>Email</th>
                <th>Subscription Plan</th>
                <th>Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="admin-table-empty">
                    <div className="admin-spinner" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>⟳</div>
                    <div>Loading organizations...</div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-table-empty">
                    <Building2 size={36} className="empty-icon" />
                    <div className="empty-title">No organizations found</div>
                    <div className="empty-desc">
                      No business accounts matched your search &quot;{searchQuery}&quot; or selected filter.
                    </div>
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
                paginatedData.map((org) => {
                  const isSuspended = org.status === 'suspended'
                  return (
                    <tr
                      key={org.id}
                      onClick={() => onSelectOrg(org.id)}
                      className="admin-table-clickable-row"
                    >
                      <td className="font-semibold">
                        <div className="admin-org-name-cell">
                          <span className="admin-org-avatar">
                            {org.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <div className="org-name-text">{org.name}</div>
                            {org.isLiveApiData && (
                              <span className="org-live-tag">Live DB</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-uuid-cell">
                          <span className="uuid-text" title={org.id}>
                            {org.id.slice(0, 8)}...{org.id.slice(-4)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(org.id, e)}
                            className="admin-copy-btn"
                            title="Copy full UUID"
                          >
                            {copiedId === org.id ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>
                      <td>{org.ownerName}</td>
                      <td>
                        <span className="admin-email-link" title={org.ownerEmail}>
                          {org.ownerEmail}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-plan-badge tier-${org.planTier}`}>
                          {org.plan}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={org.status} />
                      </td>
                      <td className="text-muted">
                        {new Date(org.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <AdminTableActionMenu
                          primaryAction={{
                            id: 'view',
                            label: 'View Details',
                            icon: <Eye size={14} />,
                            onClick: (e) => {
                              e.stopPropagation()
                              onSelectOrg(org.id)
                            },
                            variant: 'ghost',
                            tooltip: 'View organization profile & telemetry',
                            showLabel: true,
                          }}
                          secondaryActions={[
                            {
                              id: 'copy-id',
                              label: 'Copy UUID',
                              icon: <Copy size={13} />,
                              onClick: () => handleCopyId(org.id),
                            },
                            {
                              id: 'suspend-toggle',
                              label: isSuspended ? 'Reactivate Organization' : 'Suspend Organization',
                              icon: isSuspended ? <Check size={13} /> : <AlertTriangle size={13} />,
                              danger: !isSuspended,
                              onClick: () => setSuspendTarget(org),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filteredData.length > 0 && (
          <div className="admin-pagination-footer">
            <div className="pagination-info">
              Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}</strong> to{' '}
              <strong>{Math.min(currentPage * pageSize, filteredData.length)}</strong> of{' '}
              <strong>{filteredData.length}</strong> organizations
            </div>

            <div className="pagination-controls">
              <AdminButton
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={15} />}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </AdminButton>

              <div className="pagination-pages-list">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`admin-page-num-btn ${pageNumber === currentPage ? 'active' : ''}`}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>

              <AdminButton
                variant="outline"
                size="sm"
                icon={<ChevronRight size={15} />}
                iconPosition="right"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </AdminButton>
            </div>
          </div>
        )}
      </div>

      {/* Suspend / Reactivate Confirmation Dialog */}
      {suspendTarget && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setSuspendTarget(null)}
          onConfirm={handleToggleSuspend}
          title={suspendTarget.status === 'suspended' ? 'Reactivate Organization' : 'Suspend Organization'}
          isDanger={suspendTarget.status !== 'suspended'}
          confirmLabel={suspendTarget.status === 'suspended' ? 'Reactivate Workspace' : 'Confirm Suspension'}
          description={
            suspendTarget.status === 'suspended'
              ? `Reactivating this workspace restores full tenant access for authorized members immediately.`
              : `Suspending this organization immediately locks tenant portal sign-in and pauses automated reminder sequences.`
          }
          targetDetails={[
            { label: 'Organization', value: suspendTarget.name },
            { label: 'Owner Email', value: suspendTarget.ownerEmail },
            { label: 'Subscription Plan', value: suspendTarget.plan },
            { label: 'Current Status', value: <StatusBadge status={suspendTarget.status} /> },
          ]}
          requireReason={suspendTarget.status !== 'suspended'}
          reasonLabel="Operational Suspension Justification"
          reasonPlaceholder="e.g. Terms violation, overdue payment dispute, or customer request..."
          warningNote={
            suspendTarget.status !== 'suspended'
              ? 'Warning: Suspended organizations cannot issue invoices or run AI conversational assistant queries until reinstated.'
              : undefined
          }
        />
      )}
    </div>
  )
}
