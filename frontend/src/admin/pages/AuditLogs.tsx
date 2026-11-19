import React, { useState, useMemo } from 'react'
import {
  ScrollText, Search, Filter, Download, ShieldCheck,
  Clock, Eye, CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet
} from 'lucide-react'
import AdminStatCard from '../components/AdminStatCard'
import AdminModal from '../components/AdminModal'
import AdminButton from '../components/AdminButton'
import AdminSelect from '../components/AdminSelect'
import AdminTableActionMenu from '../components/AdminTableActionMenu'
import { MOCK_AUDIT_LOGS, type AuditLogRecord } from '../services/mockDataService'

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogRecord[]>(MOCK_AUDIT_LOGS)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionCategory, setActionCategory] = useState<'all' | 'auth' | 'invoice' | 'billing' | 'reminder' | 'support'>('all')
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const totalEvents = logs.length
  const authEvents = logs.filter((l) => l.action.startsWith('auth.')).length
  const failedOrDenied = logs.filter((l) => l.result === 'denied' || l.result === 'failed').length

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (actionCategory !== 'all' && !l.action.startsWith(actionCategory)) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        l.actor.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        (l.targetOrg && l.targetOrg.toLowerCase().includes(q)) ||
        l.requestId.toLowerCase().includes(q)
      )
    })
  }, [logs, actionCategory, searchQuery])

  const handleExportCsv = () => {
    const headers = ['Request ID', 'Timestamp', 'Actor', 'Role', 'Action', 'Target Org', 'Result', 'Summary']
    const rows = filteredLogs.map((l) => [
      l.requestId,
      l.timestamp,
      l.actor,
      l.actorRole,
      l.action,
      l.targetOrg || 'System',
      l.result,
      `"${l.summary}"`,
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `platform_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setToastMsg('Audit log report generated and downloaded as CSV.')
    setTimeout(() => setToastMsg(null), 4000)
  }

  const categoryOptions = [
    { value: 'all' as const, label: `All Action Categories (${totalEvents})` },
    { value: 'auth' as const, label: 'Authentication & MFA' },
    { value: 'billing' as const, label: 'Billing & Subscriptions' },
    { value: 'invoice' as const, label: 'Invoice Operations' },
    { value: 'reminder' as const, label: 'Reminder Dispatch' },
    { value: 'support' as const, label: 'Support Ticket Sessions' },
  ]

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Platform Audit Trail</h2>
          <p className="admin-page-subheading">
            Immutable, cryptographically verifiable log of all administrative actions, authentication attempts, and tenant modifications.
          </p>
        </div>
        <div className="admin-page-actions">
          <AdminButton
            variant="primary"
            size="md"
            icon={<Download size={14} />}
            onClick={handleExportCsv}
            tooltip="Download filtered audit logs as CSV"
          >
            Export Audit Trail (CSV)
          </AdminButton>
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
          label="Total Logged Activities"
          value={totalEvents}
          icon={<ScrollText size={20} />}
          description="Security trail entries"
        />
        <AdminStatCard
          label="Authentication Events"
          value={authEvents}
          icon={<ShieldCheck size={20} className="text-info" />}
          description="Signins, MFA, password updates"
        />
        <AdminStatCard
          label="Denied / Failed Actions"
          value={failedOrDenied}
          changeType={failedOrDenied > 0 ? 'negative' : 'positive'}
          icon={<AlertTriangle size={20} className="text-danger" />}
          description="Security alerts and rejected ops"
        />
        <AdminStatCard
          label="Log Retention Period"
          value="365 Days"
          icon={<Clock size={20} className="text-muted" />}
          description="Encrypted compliance storage"
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
            placeholder="Search by actor, action, request ID, or summary..."
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
          <AdminSelect<'all' | 'auth' | 'invoice' | 'billing' | 'reminder' | 'support'>
            value={actionCategory}
            onChange={(val) => setActionCategory(val)}
            options={categoryOptions}
            size="md"
            label="Category"
          />

          {(searchQuery || actionCategory !== 'all') && (
            <AdminButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setActionCategory('all')
              }}
            >
              Reset Filters
            </AdminButton>
          )}
        </div>
      </div>

      {/* Audit Log Table Card */}
      <div className="admin-card admin-table-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor & Role</th>
                <th>Action</th>
                <th>Target Org / Scope</th>
                <th>Result</th>
                <th>Request ID</th>
                <th>Summary</th>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="admin-table-clickable-row"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="text-muted font-mono text-xs">{log.timestamp}</td>
                  <td>
                    <div className="font-semibold">{log.actor}</div>
                    <div className="text-muted text-xs">{log.actorRole}</div>
                  </td>
                  <td>
                    <span
                      className="font-mono text-xs font-semibold"
                      style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px' }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td>{log.targetOrg || <span className="text-muted">Global / System</span>}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        log.result === 'success'
                          ? 'admin-badge-active'
                          : log.result === 'denied'
                          ? 'admin-badge-pastDue'
                          : 'admin-badge-trial'
                      }`}
                    >
                      {log.result.toUpperCase()}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-muted">{log.requestId}</td>
                  <td className="text-sm">{log.summary}</td>
                  <td style={{ textAlign: 'right' }}>
                    <AdminTableActionMenu
                      primaryAction={{
                        id: 'view',
                        label: 'View Details',
                        icon: <Eye size={14} />,
                        onClick: () => setSelectedLog(log),
                        variant: 'ghost',
                        tooltip: 'Inspect complete audit record and payload metadata',
                        showLabel: false,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Details Modal */}
      {selectedLog && (
        <AdminModal
          isOpen={true}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event — ${selectedLog.action}`}
          subtitle={`Request ID: ${selectedLog.requestId}`}
        >
          <div className="admin-info-definition-list">
            <div className="admin-info-item">
              <span className="info-label">Actor</span>
              <span className="info-value">{selectedLog.actor} ({selectedLog.actorRole})</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Action Identifier</span>
              <span className="info-value font-mono">{selectedLog.action}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Result</span>
              <span
                className={`admin-badge ${
                  selectedLog.result === 'success' ? 'admin-badge-active' : 'admin-badge-pastDue'
                }`}
              >
                {selectedLog.result.toUpperCase()}
              </span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Timestamp (UTC/IST)</span>
              <span className="info-value">{selectedLog.timestamp}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Target Organization</span>
              <span className="info-value">{selectedLog.targetOrg || 'Global / Platform'}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Entity Ref</span>
              <span className="info-value font-mono">{selectedLog.entityType}: {selectedLog.entityId}</span>
            </div>
            <div className="admin-info-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
              <span className="info-label">Operational Event Summary</span>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  width: '100%',
                  color: '#0f172a',
                }}
              >
                {selectedLog.summary}
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  )
}
