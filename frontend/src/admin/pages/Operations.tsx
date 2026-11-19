import React, { useState } from 'react'
import {
  Server, AlertTriangle, CheckCircle2, Clock, RotateCcw,
  FileSpreadsheet, Download, TrendingUp, RefreshCw, Eye, AlertCircle
} from 'lucide-react'
import AdminStatCard from '../components/AdminStatCard'
import StatusBadge from '../components/StatusBadge'
import AdminModal from '../components/AdminModal'
import AdminButton from '../components/AdminButton'
import AdminSelect from '../components/AdminSelect'
import AdminTableActionMenu from '../components/AdminTableActionMenu'
import AdminConfirmDialog from '../components/AdminConfirmDialog'
import { MOCK_OPERATIONS_JOBS, type OperationJobRecord } from '../services/mockDataService'

export default function Operations() {
  const [jobs, setJobs] = useState<OperationJobRecord[]>(MOCK_OPERATIONS_JOBS)
  const [typeFilter, setTypeFilter] = useState<'all' | 'import' | 'export' | 'forecast' | 'reconciliation'>('all')
  const [selectedJob, setSelectedJob] = useState<OperationJobRecord | null>(null)
  const [retryTarget, setRetryTarget] = useState<OperationJobRecord | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const failedCount = jobs.filter((j) => j.status === 'failed').length
  const completedCount = jobs.filter((j) => j.status === 'completed').length
  const inProgressCount = jobs.filter((j) => j.status === 'in_progress').length
  const totalCount = jobs.length

  const filteredJobs = jobs.filter((j) => {
    if (typeFilter !== 'all' && j.type !== typeFilter) return false
    return true
  })

  const handleRetryJob = (reason?: string) => {
    if (!retryTarget) return
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === retryTarget.id) {
          return {
            ...j,
            status: 'completed',
            retryCount: j.retryCount + 1,
            sanitizedError: undefined,
          }
        }
        return j
      })
    )
    setToastMsg(
      `Job ${retryTarget.id} requeued and processed successfully${reason ? ` (${reason})` : ''}. (Demo action)`
    )
    setRetryTarget(null)
    setTimeout(() => setToastMsg(null), 5000)
  }

  const categoryOptions = [
    { value: 'all' as const, label: `All Task Types (${totalCount})` },
    { value: 'import' as const, label: 'Data Imports' },
    { value: 'export' as const, label: 'Data Exports' },
    { value: 'forecast' as const, label: 'Cash Flow Forecasts' },
    { value: 'reconciliation' as const, label: 'Bank Reconciliations' },
  ]

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Background Operations & Tasks</h2>
          <p className="admin-page-subheading">
            Telemetry for asynchronous jobs: bulk customer/invoice imports, data exports, cash flow forecasts, and automated bank reconciliations.
          </p>
        </div>
        <div className="admin-page-actions">
          <div className="admin-data-source-pill">
            <span className="source-dot mock" />
            <span>Celery Task Queue Telemetry</span>
          </div>
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
          label="Total Jobs (24h)"
          value={totalCount}
          icon={<Server size={20} />}
          description="Processed background tasks"
        />
        <AdminStatCard
          label="Completed Successfully"
          value={completedCount}
          changeType="positive"
          change={`${Math.round((completedCount / totalCount) * 100)}%`}
          icon={<CheckCircle2 size={20} className="text-success" />}
          description="Zero-error executions"
        />
        <AdminStatCard
          label="Failed Tasks"
          value={failedCount}
          changeType={failedCount > 0 ? 'negative' : 'neutral'}
          icon={<AlertTriangle size={20} className="text-danger" />}
          description="Require inspection or retry"
        />
        <AdminStatCard
          label="In-Progress / Queued"
          value={inProgressCount}
          icon={<Clock size={20} className="text-info" />}
          description="Active worker threads"
        />
      </div>

      {/* Toolbar Filter */}
      <div className="admin-toolbar-card">
        <div className="admin-filter-controls-row">
          <AdminSelect<'all' | 'import' | 'export' | 'forecast' | 'reconciliation'>
            value={typeFilter}
            onChange={(val) => setTypeFilter(val)}
            options={categoryOptions}
            size="md"
            label="Job Category"
          />

          {typeFilter !== 'all' && (
            <AdminButton
              variant="ghost"
              size="sm"
              onClick={() => setTypeFilter('all')}
            >
              Show All Types
            </AdminButton>
          )}
        </div>
      </div>

      {/* Jobs Table Card */}
      <div className="admin-card admin-table-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Task Type</th>
                <th>Target Organization</th>
                <th>Status</th>
                <th>Created Timestamp</th>
                <th>Duration</th>
                <th>Sanitized Error / Status Note</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => {
                const secondaryActions = []
                if (job.status === 'failed') {
                  secondaryActions.push({
                    id: 'retry',
                    label: 'Requeue & Retry Job',
                    icon: <RotateCcw size={13} />,
                    onClick: () => setRetryTarget(job),
                  })
                }

                return (
                  <tr
                    key={job.id}
                    className="admin-table-clickable-row"
                    onClick={() => setSelectedJob(job)}
                  >
                    <td className="font-mono text-xs font-semibold">{job.id}</td>
                    <td>
                      <span className="admin-plan-badge tier-growth" style={{ textTransform: 'uppercase' }}>
                        {job.type}
                      </span>
                    </td>
                    <td>{job.organizationName}</td>
                    <td>
                      <span
                        className={`admin-badge ${
                          job.status === 'completed'
                            ? 'admin-badge-active'
                            : job.status === 'failed'
                            ? 'admin-badge-pastDue'
                            : 'admin-badge-trial'
                        }`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-muted">{job.createdAt}</td>
                    <td className="text-muted">{job.durationSec}s</td>
                    <td>
                      {job.sanitizedError ? (
                        <span className="text-danger font-mono text-xs" title={job.sanitizedError}>
                          {job.sanitizedError.slice(0, 45)}...
                        </span>
                      ) : (
                        <span className="text-muted text-xs">Completed cleanly</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <AdminTableActionMenu
                        primaryAction={{
                          id: 'view',
                          label: 'View Job Details',
                          icon: <Eye size={14} />,
                          onClick: () => setSelectedJob(job),
                          variant: 'ghost',
                          tooltip: 'Inspect task payload & error trace',
                          showLabel: false,
                        }}
                        secondaryActions={secondaryActions.length > 0 ? secondaryActions : undefined}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <AdminModal
          isOpen={true}
          onClose={() => setSelectedJob(null)}
          title={`Job Details — ${selectedJob.id}`}
          subtitle={`Type: ${selectedJob.type.toUpperCase()}`}
        >
          <div className="admin-info-definition-list">
            <div className="admin-info-item">
              <span className="info-label">Task UUID</span>
              <span className="info-value font-mono">{selectedJob.id}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Organization</span>
              <span className="info-value">{selectedJob.organizationName}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Execution Status</span>
              <span
                className={`admin-badge ${
                  selectedJob.status === 'completed' ? 'admin-badge-active' : 'admin-badge-pastDue'
                }`}
              >
                {selectedJob.status}
              </span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Execution Time</span>
              <span className="info-value">{selectedJob.durationSec} seconds</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Retry Attempts</span>
              <span className="info-value">{selectedJob.retryCount}</span>
            </div>
            {selectedJob.sanitizedError && (
              <div className="admin-info-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
                <span className="info-label text-danger">Sanitized Failure Log</span>
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: '0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    width: '100%',
                    color: '#991b1b',
                    fontFamily: 'monospace',
                  }}
                >
                  {selectedJob.sanitizedError}
                </div>
              </div>
            )}
          </div>

          {selectedJob.status === 'failed' && (
            <div style={{ marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <AdminButton
                variant="primary"
                size="md"
                icon={<RotateCcw size={14} />}
                onClick={() => {
                  const j = selectedJob
                  setSelectedJob(null)
                  setRetryTarget(j)
                }}
              >
                Requeue & Retry Job Now
              </AdminButton>
            </div>
          )}
        </AdminModal>
      )}

      {/* Retry Confirmation Modal */}
      {retryTarget && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setRetryTarget(null)}
          title={`Requeue Background Task ${retryTarget.id}?`}
          confirmLabel="Execute Retry"
          onConfirm={handleRetryJob}
          description="Dispatching a retry re-enqueues this asynchronous Celery worker job for execution."
          targetDetails={[
            { label: 'Job ID', value: retryTarget.id },
            { label: 'Job Type', value: retryTarget.type.toUpperCase() },
            { label: 'Organization', value: retryTarget.organizationName },
          ]}
        />
      )}
    </div>
  )
}
