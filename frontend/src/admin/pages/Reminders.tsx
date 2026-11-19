import React, { useState } from 'react'
import {
  BellRing, CheckCircle2, AlertTriangle, Clock, XCircle,
  MessageSquare, Mail, Smartphone, Pause, Play, Power, ShieldAlert
} from 'lucide-react'
import AdminStatCard from '../components/AdminStatCard'
import StatusBadge from '../components/StatusBadge'
import AdminButton from '../components/AdminButton'
import AdminTableActionMenu from '../components/AdminTableActionMenu'
import AdminConfirmDialog from '../components/AdminConfirmDialog'
import { MOCK_REMINDERS_DATA, type ReminderOverview } from '../services/mockDataService'

export default function Reminders() {
  const [data, setData] = useState<ReminderOverview>(MOCK_REMINDERS_DATA)
  const [toggleAutoModal, setToggleAutoModal] = useState(false)
  const [targetOrgToggle, setTargetOrgToggle] = useState<{ id: string; name: string; current: 'active' | 'paused' } | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const handleToggleAuto = (reason?: string) => {
    const newState = !data.automaticRemindersActive
    setData((prev) => ({ ...prev, automaticRemindersActive: newState }))
    setToggleAutoModal(false)
    setToastMsg(
      newState
        ? 'Automatic payment reminder cron dispatch has been RESUMED.'
        : `Automatic payment reminder cron dispatch has been PAUSED globally${reason ? ` (${reason})` : ''}.`
    )
    setTimeout(() => setToastMsg(null), 5000)
  }

  const handleToggleOrgReminders = (reason?: string) => {
    if (!targetOrgToggle) return
    const { id, name, current } = targetOrgToggle
    const nextStatus = current === 'active' ? 'paused' : 'active'
    setData((prev) => ({
      ...prev,
      orgActivity: prev.orgActivity.map((o) =>
        o.organizationId === id ? { ...o, status: nextStatus } : o
      ),
    }))
    setTargetOrgToggle(null)
    setToastMsg(
      `Reminder sequence for "${name}" has been ${nextStatus}${reason ? ` (Reason: ${reason})` : ''}. (Demo action)`
    )
    setTimeout(() => setToastMsg(null), 5000)
  }

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Payment Reminders Operations</h2>
          <p className="admin-page-subheading">
            Dispatch health, delivery channels (WhatsApp, Email, SMS), automated recovery sequences, and global pause switches.
          </p>
        </div>
        <div className="admin-page-actions">
          <AdminButton
            variant={data.automaticRemindersActive ? 'danger' : 'primary'}
            icon={data.automaticRemindersActive ? <Pause size={14} /> : <Play size={14} />}
            onClick={() => setToggleAutoModal(true)}
            tooltip="Global pause switch for all scheduled cron reminder dispatch jobs"
          >
            {data.automaticRemindersActive ? 'Pause Automatic Reminders' : 'Resume Automatic Reminders'}
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
          label="Total Reminder Jobs"
          value={data.totalJobs.toLocaleString()}
          icon={<BellRing size={20} />}
          description="Total sequences dispatched"
        />
        <AdminStatCard
          label="Successfully Delivered"
          value={data.sentCount.toLocaleString()}
          changeType="positive"
          change={`${Math.round((data.sentCount / data.totalJobs) * 100)}%`}
          icon={<CheckCircle2 size={20} className="text-success" />}
          description="Confirmed delivery receipts"
        />
        <AdminStatCard
          label="Delivery Failures"
          value={data.failedCount}
          changeType="negative"
          icon={<AlertTriangle size={20} className="text-danger" />}
          description="Bounces / invalid numbers"
        />
        <AdminStatCard
          label="Opt-Out / Blocked"
          value={data.blockedCount}
          icon={<XCircle size={20} className="text-muted" />}
          description="Customer DND or opt-out"
        />
      </div>

      {/* 2-Column: Channels Breakdown + Policy Overview */}
      <div className="admin-dashboard-content-grid">
        {/* Channel Breakdown */}
        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Delivery Channels Telemetry</h3>
              <p className="admin-card-subtitle">Dispatch volume across notification gateways</p>
            </div>
            <span className="admin-data-pill">Gateways</span>
          </div>

          <div className="admin-sub-metrics-row">
            {data.channelBreakdown.map((c) => {
              let iconNode = <MessageSquare size={16} />
              if (c.channel === 'Email') iconNode = <Mail size={16} />
              if (c.channel === 'SMS') iconNode = <Smartphone size={16} />

              return (
                <div key={c.channel} className="admin-sub-stat-box active">
                  <div className="stat-box-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {iconNode} {c.channel}
                  </div>
                  <div className="stat-box-number">{c.sent.toLocaleString()}</div>
                  <div className="stat-box-pct text-muted">{c.failed} failures</div>
                </div>
              )
            })}
          </div>

          <div className="admin-sub-bar-container">
            <div className="admin-sub-bar-labels">
              <span>Channel Volume Share</span>
              <span>WhatsApp Primary (74%)</span>
            </div>
            <div className="admin-stacked-bar">
              <div className="bar-segment active" style={{ width: '74%' }} title="WhatsApp: 74%" />
              <div className="bar-segment trial" style={{ width: '23%' }} title="Email: 23%" />
              <div className="bar-segment past-due" style={{ width: '3%' }} title="SMS: 3%" />
            </div>
          </div>
        </section>

        {/* Global Policy & Operating Parameters */}
        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Reminder Policy & Gateways</h3>
              <p className="admin-card-subtitle">Platform-level cadence guidelines & rate limits</p>
            </div>
            <span className={`admin-badge ${data.automaticRemindersActive ? 'admin-badge-active' : 'admin-badge-suspended'}`}>
              {data.automaticRemindersActive ? 'Cron Active' : 'Cron Paused'}
            </span>
          </div>

          <div className="admin-info-definition-list">
            <div className="admin-info-item">
              <span className="info-label">WhatsApp Business API Gateway</span>
              <span className="info-value font-semibold text-success">Connected (Meta Official)</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Email SMTP Dispatch Relay</span>
              <span className="info-value font-semibold text-success">Operational (Amazon SES)</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Daily Window Restrictions</span>
              <span className="info-value">09:00 AM — 07:00 PM IST (TRAI Compliant)</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label">Max Automated Retries</span>
              <span className="info-value">3 attempts over 72 hours</span>
            </div>
          </div>
        </section>
      </div>

      {/* Organization-wise Reminder Activity Table */}
      <div className="admin-card admin-table-card">
        <div className="admin-card-header" style={{ padding: '1.25rem 1.5rem 0.5rem 1.5rem' }}>
          <div>
            <h3 className="admin-card-title">Organization Reminder Dispatch Activity</h3>
            <p className="admin-card-subtitle">Active tenant schedules, monthly volume, and tenant-level pause toggles</p>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Active Schedules</th>
                <th>Dispatched (MTD)</th>
                <th>Delivery Success Rate</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.orgActivity.map((org) => {
                const isActive = org.status === 'active'
                return (
                  <tr key={org.organizationId}>
                    <td className="font-semibold">{org.organizationName}</td>
                    <td>{org.activeSchedules} schedule(s)</td>
                    <td>{org.dispatchedThisMonth.toLocaleString()} reminders</td>
                    <td>
                      <span className={org.successRate >= 95 ? 'text-success font-semibold' : 'text-warning font-semibold'}>
                        {org.successRate > 0 ? `${org.successRate}%` : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${isActive ? 'admin-badge-active' : 'admin-badge-suspended'}`}>
                        {isActive ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <AdminTableActionMenu
                        primaryAction={{
                          id: 'toggle-org-reminder',
                          label: isActive ? 'Pause Reminders' : 'Resume Reminders',
                          icon: isActive ? <Pause size={13} /> : <Play size={13} />,
                          variant: isActive ? 'danger' : 'outline',
                          showLabel: true,
                          tooltip: isActive ? 'Pause reminder sequences for this organization' : 'Resume reminder sequences',
                          onClick: () =>
                            setTargetOrgToggle({
                              id: org.organizationId,
                              name: org.organizationName,
                              current: org.status,
                            }),
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

      {/* Global Automatic Reminders Modal */}
      {toggleAutoModal && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setToggleAutoModal(false)}
          title={data.automaticRemindersActive ? 'PAUSE ALL AUTOMATED PAYMENT REMINDERS' : 'RESUME AUTOMATED REMINDERS'}
          isDanger={data.automaticRemindersActive}
          confirmLabel={data.automaticRemindersActive ? 'Pause Automated Cron' : 'Resume Automated Cron'}
          description={
            data.automaticRemindersActive
              ? 'Pausing automatic reminders halts all scheduled WhatsApp, Email, and SMS payment reminder crons across all organizations immediately. Outbox queues will be safely preserved.'
              : 'Resuming automatic reminders restarts scheduled cron runs for all eligible invoices past their due dates.'
          }
          targetDetails={[
            { label: 'Scope', value: 'Platform-wide Cron Engine' },
            { label: 'Gateways Affected', value: 'WhatsApp Meta API, Amazon SES, SMS' },
          ]}
          requireReason={data.automaticRemindersActive}
          reasonLabel="Reason for Halting Automated Dispatch"
          reasonPlaceholder="e.g. Gateway maintenance, incident investigation, or carrier downtime..."
          warningNote={
            data.automaticRemindersActive
              ? 'Tenants will not send recovery reminders until this switch is re-enabled.'
              : undefined
          }
          onConfirm={handleToggleAuto}
        />
      )}

      {/* Target Org Pause Modal */}
      {targetOrgToggle && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setTargetOrgToggle(null)}
          title={`${targetOrgToggle.current === 'active' ? 'Pause' : 'Resume'} Reminders for ${targetOrgToggle.name}`}
          isDanger={targetOrgToggle.current === 'active'}
          confirmLabel={targetOrgToggle.current === 'active' ? 'Pause Reminders' : 'Resume Reminders'}
          description={
            targetOrgToggle.current === 'active'
              ? `Pausing reminder sequences for ${targetOrgToggle.name} temporarily halts scheduled customer notifications for this workspace.`
              : `Resuming reminder sequences restores automatic customer dispatches for ${targetOrgToggle.name}.`
          }
          targetDetails={[
            { label: 'Organization', value: targetOrgToggle.name },
            { label: 'Current Status', value: targetOrgToggle.current === 'active' ? 'Active' : 'Paused' },
          ]}
          requireReason={targetOrgToggle.current === 'active'}
          reasonLabel="Operational Reason"
          reasonPlaceholder="e.g. Tenant customer complaint, reconciliation review, etc."
          onConfirm={handleToggleOrgReminders}
        />
      )}
    </div>
  )
}
