import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Users as UsersIcon, Search, Filter, ShieldCheck, UserCheck, UserX,
  KeyRound, Mail, LogOut, Check, Eye, ChevronLeft, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react'
import AdminStatCard from '../components/AdminStatCard'
import StatusBadge from '../components/StatusBadge'
import AdminModal from '../components/AdminModal'
import AdminButton from '../components/AdminButton'
import AdminSelect from '../components/AdminSelect'
import AdminTableActionMenu from '../components/AdminTableActionMenu'
import AdminConfirmDialog from '../components/AdminConfirmDialog'
import { adminApi, type UserRecord } from '../services/adminApi'

export default function Users() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all')

  const fetchUsers = useCallback(async () => {
    try {
      const data = await adminApi.getUsers()
      setUsers(data)
      setError(null)
    } catch (err: any) {
      setError(err?.message || 'Failed to load customers from database.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchUsers()
  }

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  // User details modal
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)

  // Action dialog state
  const [actionModal, setActionModal] = useState<{
    type: 'toggle_status' | 'reset_password' | 'resend_verification' | 'revoke_sessions'
    user: UserRecord
  } | null>(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null)

  // Summary counts
  const totalCount = users.length
  const activeCount = users.filter((u) => u.status === 'active').length
  const suspendedCount = users.filter((u) => u.status === 'suspended').length
  const pendingCount = users.filter((u) => u.status === 'pending').length

  // Filtered & Searched data
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.organizationName.toLowerCase().includes(q)
      )
    })
  }, [users, statusFilter, searchQuery])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  const executeAction = (reason?: string) => {
    if (!actionModal) return
    const { type, user } = actionModal

    if (type === 'toggle_status') {
      const newStatus = user.status === 'active' ? 'suspended' : 'active'
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      )
      setActionSuccessMsg(
        `Customer ${user.email} status updated to ${newStatus.toUpperCase()}${reason ? ` (Reason: ${reason})` : ''}. (Demo action)`
      )
    } else if (type === 'reset_password') {
      setActionSuccessMsg(`Password reset link generated and dispatched to ${user.email}. (Demo action)`)
    } else if (type === 'resend_verification') {
      setActionSuccessMsg(`Verification email re-sent to ${user.email}. (Demo action)`)
    } else if (type === 'revoke_sessions') {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, sessionsActive: 0 } : u))
      )
      setActionSuccessMsg(`All active sessions revoked for ${user.email}. (Demo action)`)
    }

    setActionModal(null)
    setTimeout(() => setActionSuccessMsg(null), 5000)
  }

  const statusOptions = [
    { value: 'all' as const, label: `All Customers (${totalCount})` },
    { value: 'active' as const, label: `Active (${activeCount})` },
    { value: 'suspended' as const, label: `Suspended (${suspendedCount})` },
    { value: 'pending' as const, label: `Pending (${pendingCount})` },
  ]

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Platform Customers</h2>
          <p className="admin-page-subheading">
            Manage, verify, and monitor authenticated customer accounts and authorized team members across organizations.
          </p>
        </div>
        <div className="admin-page-actions">
          <div className="admin-data-source-pill" title="Live Database Data">
            <span className="source-dot live" />
            <span>Live Data</span>
          </div>
          <AdminButton
            variant="outline"
            size="sm"
            icon={<RefreshCw size={13} className={isRefreshing ? 'spin' : ''} />}
            onClick={handleRefresh}
            loading={isRefreshing}
            tooltip="Refresh customer accounts from database"
          >
            Refresh
          </AdminButton>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-danger" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
          <AdminButton variant="ghost" size="sm" onClick={handleRefresh} style={{ marginLeft: 'auto' }}>
            Retry
          </AdminButton>
        </div>
      )}

      {actionSuccessMsg && (
        <div className="admin-alert admin-alert-info">
          <Check size={16} className="text-success" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="admin-stat-cards-grid">
        <AdminStatCard
          label="Total Customers"
          value={totalCount}
          icon={<UsersIcon size={20} />}
          description="Registered customer accounts"
        />
        <AdminStatCard
          label="Active Customers"
          value={activeCount}
          changeType="positive"
          change={totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}%` : '0%'}
          icon={<UserCheck size={20} className="text-success" />}
          description="Operational customer accounts"
        />
        <AdminStatCard
          label="Suspended Customers"
          value={suspendedCount}
          changeType="negative"
          icon={<UserX size={20} className="text-danger" />}
          description="Locked or inactive"
        />
        <AdminStatCard
          label="Pending Verification"
          value={pendingCount}
          icon={<Mail size={20} className="text-warning" />}
          description="Email confirmation pending"
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
            placeholder="Search by customer name, email, or organization..."
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
          <AdminSelect<'all' | 'active' | 'suspended' | 'pending'>
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val)
              setCurrentPage(1)
            }}
            options={statusOptions}
            size="md"
            icon={<Filter size={14} />}
            label="Account Status"
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

      {/* Users Data Table */}
      <div className="admin-card admin-table-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Organization</th>
                <th>Tenant Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Active Sessions</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty">
                    <RefreshCw size={24} className="spin" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                    <div className="empty-title">Loading customers...</div>
                    <div className="empty-desc">Fetching customer accounts from the database.</div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty">
                    <UsersIcon size={36} className="empty-icon" />
                    <div className="empty-title">No customers found</div>
                    <div className="empty-desc">Try clearing your search query or status filter.</div>
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
                paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="admin-table-clickable-row"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="font-semibold">
                      <div className="admin-org-name-cell">
                        <span className="admin-org-avatar">{user.name.slice(0, 2).toUpperCase()}</span>
                        <div>
                          <div className="org-name-text">{user.name}</div>
                          <div className="text-muted text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.organizationName}</td>
                    <td>
                      <span className={`admin-member-role-pill ${user.roleInOrg === 'Business Owner' ? 'owner' : ''}`}>
                        {user.roleInOrg}
                      </span>
                    </td>
                    <td>
                      <StatusBadge
                        status={user.status === 'suspended' ? 'suspended' : user.status === 'active' ? 'active' : 'trial'}
                        label={user.status}
                      />
                    </td>
                    <td className="text-muted">{user.lastLogin}</td>
                    <td>
                      <span className="admin-data-pill">{user.sessionsActive} active</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <AdminTableActionMenu
                        primaryAction={{
                          id: 'view',
                          label: 'View Profile',
                          icon: <Eye size={14} />,
                          onClick: () => setSelectedUser(user),
                          variant: 'ghost',
                          tooltip: 'Inspect customer profile & sessions',
                          showLabel: false,
                        }}
                        secondaryActions={[
                          {
                            id: 'status-toggle',
                            label: user.status === 'active' ? 'Deactivate Customer Account' : 'Reactivate Customer Account',
                            icon: user.status === 'active' ? <UserX size={13} /> : <UserCheck size={13} />,
                            danger: user.status === 'active',
                            onClick: () => setActionModal({ type: 'toggle_status', user }),
                          },
                          {
                            id: 'reset-pwd',
                            label: 'Send Password Reset Link',
                            icon: <KeyRound size={13} />,
                            onClick: () => setActionModal({ type: 'reset_password', user }),
                          },
                          {
                            id: 'resend-verify',
                            label: 'Resend Verification Email',
                            icon: <Mail size={13} />,
                            onClick: () => setActionModal({ type: 'resend_verification', user }),
                          },
                          {
                            id: 'divider',
                            label: '',
                            divider: true,
                          },
                          {
                            id: 'revoke-sessions',
                            label: 'Revoke Active Sessions',
                            icon: <LogOut size={13} />,
                            danger: true,
                            onClick: () => setActionModal({ type: 'revoke_sessions', user }),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredUsers.length > 0 && (
          <div className="admin-pagination-footer">
            <div className="pagination-info">
              Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredUsers.length)}</strong> to{' '}
              <strong>{Math.min(currentPage * pageSize, filteredUsers.length)}</strong> of{' '}
              <strong>{filteredUsers.length}</strong> customers
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

      {/* User Details Modal */}
      {selectedUser && (
        <AdminModal
          isOpen={true}
          onClose={() => setSelectedUser(null)}
          title={selectedUser.name}
          subtitle={`Customer ID: ${selectedUser.id}`}
        >
          <div className="admin-info-definition-list" style={{ marginTop: '0.5rem' }}>
            <div className="admin-info-item">
              <span className="info-label">Email Address</span>
              <span className="info-value">{selectedUser.email}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Organization</span>
              <span className="info-value">{selectedUser.organizationName}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Tenant Role</span>
              <span className="info-value">{selectedUser.roleInOrg}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Account Status</span>
              <StatusBadge
                status={selectedUser.status === 'suspended' ? 'suspended' : 'active'}
                label={selectedUser.status}
              />
            </div>
            <div className="admin-info-item">
              <span className="info-label">Last Login</span>
              <span className="info-value">{selectedUser.lastLogin}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Member Since</span>
              <span className="info-value">{selectedUser.createdAt}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Active Workstations/Sessions</span>
              <span className="info-value">{selectedUser.sessionsActive} device(s)</span>
            </div>
          </div>

          <div
            className="admin-modal-quick-actions"
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '1rem',
            }}
          >
            <AdminButton
              variant="outline"
              size="sm"
              icon={<KeyRound size={13} />}
              onClick={() => {
                const u = selectedUser
                setSelectedUser(null)
                setActionModal({ type: 'reset_password', user: u })
              }}
            >
              Reset Password
            </AdminButton>
            <AdminButton
              variant="outline"
              size="sm"
              icon={<Mail size={13} />}
              onClick={() => {
                const u = selectedUser
                setSelectedUser(null)
                setActionModal({ type: 'resend_verification', user: u })
              }}
            >
              Resend Verification
            </AdminButton>
            <AdminButton
              variant="danger"
              size="sm"
              icon={<LogOut size={13} />}
              onClick={() => {
                const u = selectedUser
                setSelectedUser(null)
                setActionModal({ type: 'revoke_sessions', user: u })
              }}
            >
              Revoke Sessions
            </AdminButton>
          </div>
        </AdminModal>
      )}

      {/* Confirmation Action Modal using AdminConfirmDialog */}
      {actionModal && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setActionModal(null)}
          title={
            actionModal.type === 'toggle_status'
              ? `${actionModal.user.status === 'active' ? 'Deactivate' : 'Reactivate'} Customer Account`
              : actionModal.type === 'reset_password'
              ? 'Send Password Reset Link'
              : actionModal.type === 'resend_verification'
              ? 'Resend Account Verification Email'
              : 'Revoke All Active Sessions'
          }
          isDanger={
            (actionModal.type === 'toggle_status' && actionModal.user.status === 'active') ||
            actionModal.type === 'revoke_sessions'
          }
          confirmLabel={
            actionModal.type === 'toggle_status'
              ? actionModal.user.status === 'active'
                ? 'Deactivate Customer'
                : 'Reactivate Customer'
              : actionModal.type === 'revoke_sessions'
              ? 'Revoke All Sessions'
              : 'Confirm & Send'
          }
          description={
            actionModal.type === 'toggle_status'
              ? actionModal.user.status === 'active'
                ? 'Deactivating this customer will revoke their application access and invalidate current sessions immediately.'
                : 'Reactivating this customer restores access to their tenant organization workspace.'
              : actionModal.type === 'reset_password'
              ? 'An encrypted password reset link will be sent to the customer email. Current passwords remain valid until replaced.'
              : actionModal.type === 'resend_verification'
              ? 'A fresh verification token email will be dispatched to verify customer identity.'
              : 'All active web and mobile device sessions will be terminated immediately. The customer will be required to authenticate again.'
          }
          targetDetails={[
            { label: 'Customer Name', value: actionModal.user.name },
            { label: 'Email Address', value: actionModal.user.email },
            { label: 'Organization', value: actionModal.user.organizationName },
            { label: 'Role in Tenant', value: actionModal.user.roleInOrg },
          ]}
          requireReason={actionModal.type === 'toggle_status' && actionModal.user.status === 'active'}
          reasonLabel="Deactivation Justification (Audit Trail)"
          reasonPlaceholder="e.g. Employee offboarding, security precaution, or duplicate account..."
          warningNote={
            actionModal.type === 'toggle_status' && actionModal.user.status === 'active'
              ? 'Security Policy: All deactivations are permanently timestamped and audited.'
              : undefined
          }
          onConfirm={executeAction}
        />
      )}
    </div>
  )
}
