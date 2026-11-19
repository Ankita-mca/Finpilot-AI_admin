import React, { useState, useMemo } from 'react'
import {
  BarChart3, Search, AlertTriangle, ShieldCheck,
  CheckCircle2, Sliders, Clock, Sparkles
} from 'lucide-react'
import AdminStatCard from '../components/AdminStatCard'
import AdminModal from '../components/AdminModal'
import AdminButton from '../components/AdminButton'
import AdminSelect from '../components/AdminSelect'
import AdminTableActionMenu from '../components/AdminTableActionMenu'
import AdminConfirmDialog from '../components/AdminConfirmDialog'
import { MOCK_USAGE, type UsageRecord } from '../services/mockDataService'

export default function Usage() {
  const [usageList, setUsageList] = useState<UsageRecord[]>(MOCK_USAGE)
  const [searchQuery, setSearchQuery] = useState('')
  const [thresholdFilter, setThresholdFilter] = useState<'all' | 'warning' | 'exceeded'>('all')

  // Override Modal
  const [overrideTarget, setOverrideTarget] = useState<UsageRecord | null>(null)
  const [resourceType, setResourceType] = useState<'invoices' | 'ai_tokens' | 'users' | 'messages'>('invoices')
  const [newLimit, setNewLimit] = useState(600)
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideExpiry, setOverrideExpiry] = useState('2026-12-31')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Summary counts
  const totalOrgs = usageList.length
  const warningCount = usageList.filter((u) => u.hasWarning).length
  const exceededCount = usageList.filter((u) => u.hasExceeded).length
  const normalCount = totalOrgs - warningCount

  // Filtered
  const filteredList = useMemo(() => {
    return usageList.filter((u) => {
      if (thresholdFilter === 'warning' && !u.hasWarning) return false
      if (thresholdFilter === 'exceeded' && !u.hasExceeded) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return u.organizationName.toLowerCase().includes(q) || u.organizationId.toLowerCase().includes(q)
    })
  }, [usageList, thresholdFilter, searchQuery])

  const handleApplyOverride = (reason?: string) => {
    if (!overrideTarget) return
    const reasonText = reason || overrideReason.trim() || 'Temporary operational quota adjustment'

    setUsageList((prev) =>
      prev.map((u) => {
        if (u.organizationId === overrideTarget.organizationId) {
          return {
            ...u,
            activeOverride: {
              resourceType,
              overrideLimit: newLimit,
              reason: reasonText,
              expiresAt: overrideExpiry,
            },
          }
        }
        return u
      })
    )

    setToastMsg(
      `Temporary override of ${newLimit} for ${resourceType} applied to ${overrideTarget.organizationName}. (Demo Action)`
    )
    setOverrideTarget(null)
    setOverrideReason('')
    setTimeout(() => setToastMsg(null), 5000)
  }

  const renderProgressBar = (used: number, limit: number, isOverridden = false) => {
    const pct = Math.min(100, Math.round((used / limit) * 100))
    let colorClass = 'bar-segment active'
    if (pct >= 100) colorClass = 'bar-segment past-due'
    else if (pct >= 80) colorClass = 'bar-segment trial'

    return (
      <div className="admin-usage-cell">
        <div className="usage-cell-labels">
          <span>{used} / {limit}</span>
          <span className={`usage-pct ${pct >= 100 ? 'text-danger font-semibold' : pct >= 80 ? 'text-warning font-semibold' : ''}`}>
            {pct}%
          </span>
        </div>
        <div className="admin-stacked-bar" style={{ height: '6px' }}>
          <div className={colorClass} style={{ width: `${pct}%` }} />
        </div>
        {isOverridden && (
          <span className="override-badge font-mono">Override Active</span>
        )}
      </div>
    )
  }

  const thresholdOptions = [
    { value: 'all' as const, label: `All Accounts (${totalOrgs})` },
    { value: 'warning' as const, label: `≥ 80% Warning (${warningCount})` },
    { value: 'exceeded' as const, label: `Quota Exceeded (${exceededCount})` },
  ]

  const resourceOptions = [
    { value: 'invoices' as const, label: 'Monthly Invoices' },
    { value: 'ai_tokens' as const, label: 'Gemini AI Tokens' },
    { value: 'users' as const, label: 'Customer Seats' },
    { value: 'messages' as const, label: 'WhatsApp & SMS Messages' },
  ]

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Platform Resource Usage</h2>
          <p className="admin-page-subheading">
            Live consumption telemetry across customer seats, invoices, communication messages, and AI tokens.
          </p>
        </div>
        <div className="admin-page-actions">
          <div className="admin-data-source-pill">
            <span className="source-dot mock" />
            <span>Usage Metering Telemetry</span>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="admin-alert admin-alert-info">
          <CheckCircle2 size={16} className="text-success" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="admin-stat-cards-grid">
        <AdminStatCard
          label="Monitored Tenancies"
          value={totalOrgs}
          icon={<BarChart3 size={20} />}
          description="Organizations with active quotas"
        />
        <AdminStatCard
          label="Within Safe Quotas"
          value={normalCount}
          changeType="positive"
          icon={<ShieldCheck size={20} className="text-success" />}
          description="< 80% consumption"
        />
        <AdminStatCard
          label="Warning Threshold (>=80%)"
          value={warningCount}
          changeType="neutral"
          icon={<AlertTriangle size={20} className="text-warning" />}
          description="Approaching limit"
        />
        <AdminStatCard
          label="Quota Exceeded"
          value={exceededCount}
          changeType="negative"
          icon={<AlertTriangle size={20} className="text-danger" />}
          description="Requires tier upgrade or override"
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
            placeholder="Search by organization name or ID..."
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
          <AdminSelect<'all' | 'warning' | 'exceeded'>
            value={thresholdFilter}
            onChange={(val) => setThresholdFilter(val)}
            options={thresholdOptions}
            size="md"
            label="Threshold Filter"
          />

          {(searchQuery || thresholdFilter !== 'all') && (
            <AdminButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setThresholdFilter('all')
              }}
            >
              Reset Filters
            </AdminButton>
          )}
        </div>
      </div>

      {/* Usage Table Card */}
      <div className="admin-card admin-table-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Plan Tier</th>
                <th style={{ minWidth: '130px' }}>Customer Seats</th>
                <th style={{ minWidth: '150px' }}>Invoices (Monthly)</th>
                <th style={{ minWidth: '150px' }}>Messages (SMS/WA)</th>
                <th style={{ minWidth: '160px' }}>Gemini AI Tokens</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((u) => {
                const hasOverride = !!u.activeOverride
                return (
                  <tr key={u.organizationId}>
                    <td className="font-semibold">
                      <div className="org-name-text">{u.organizationName}</div>
                      <div className="text-muted text-xs font-mono">{u.organizationId.slice(0, 8)}...</div>
                    </td>
                    <td>
                      <span className={`admin-plan-badge tier-${u.planTier}`}>
                        {u.planTier.toUpperCase()}
                      </span>
                    </td>
                    <td>{renderProgressBar(u.usersUsed, u.usersLimit)}</td>
                    <td>
                      {renderProgressBar(
                        u.invoicesUsed,
                        hasOverride && u.activeOverride?.resourceType === 'invoices'
                          ? u.activeOverride.overrideLimit
                          : u.invoicesLimit,
                        hasOverride && u.activeOverride?.resourceType === 'invoices'
                      )}
                    </td>
                    <td>{renderProgressBar(u.messagesUsed, u.messagesLimit)}</td>
                    <td>
                      {renderProgressBar(
                        Math.round(u.aiTokensUsed / 1000),
                        Math.round(
                          (hasOverride && u.activeOverride?.resourceType === 'ai_tokens'
                            ? u.activeOverride.overrideLimit
                            : u.aiTokensLimit) / 1000
                        ),
                        hasOverride && u.activeOverride?.resourceType === 'ai_tokens'
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <AdminTableActionMenu
                        primaryAction={{
                          id: 'override',
                          label: 'Override Quota',
                          icon: <Sliders size={13} />,
                          variant: 'outline',
                          showLabel: true,
                          tooltip: 'Apply temporary administrative quota expansion',
                          onClick: () => {
                            setOverrideTarget(u)
                            setNewLimit(u.invoicesLimit + 100)
                          },
                        }}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Temporary Usage Override Modal */}
      {overrideTarget && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setOverrideTarget(null)}
          title={`Temporary Usage Override — ${overrideTarget.organizationName}`}
          confirmLabel="Apply Override"
          description="Grant temporary quota expansion with mandatory operational justification. All overrides are logged."
          targetDetails={[
            { label: 'Organization', value: overrideTarget.organizationName },
            { label: 'Current Plan', value: overrideTarget.planTier.toUpperCase() },
          ]}
          requireReason={true}
          reasonLabel="Operational Reason (Audit Mandatory)"
          reasonPlaceholder="e.g. Approved temporary extension for fiscal close volume surge..."
          warningNote="Usage overrides automatically expire at 23:59 on the specified date."
          onConfirm={handleApplyOverride}
        >
          <div className="admin-form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="admin-form-label">Resource to Override</label>
            <AdminSelect<'invoices' | 'ai_tokens' | 'users' | 'messages'>
              value={resourceType}
              onChange={(val) => setResourceType(val)}
              options={resourceOptions}
              size="md"
            />
          </div>

          <div className="admin-form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="admin-form-label">New Temporary Quota Limit</label>
            <input
              type="number"
              value={newLimit}
              onChange={(e) => setNewLimit(Number(e.target.value))}
              className="admin-form-input"
              min={1}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Override Expiry Date</label>
            <input
              type="date"
              value={overrideExpiry}
              onChange={(e) => setOverrideExpiry(e.target.value)}
              className="admin-form-input"
            />
          </div>
        </AdminConfirmDialog>
      )}
    </div>
  )
}
