import { useState, useEffect } from 'react'
import {
  Building2, Users, FileText, CheckCircle2, BellRing,
  ArrowLeft, Copy, Check, Clock, ShieldCheck, ShieldAlert,
  Server, Calendar, MapPin, Globe, CreditCard
} from 'lucide-react'
import AdminBreadcrumb from '../components/AdminBreadcrumb'
import AdminStatCard from '../components/AdminStatCard'
import StatusBadge from '../components/StatusBadge'
import AdminButton from '../components/AdminButton'
import { adminApi } from '../services/adminApi'
import type { OrganizationRecord } from '../types/admin.types'

interface OrganizationDetailProps {
  id: string
  onBack: () => void
}

export default function OrganizationDetail({ id, onBack }: OrganizationDetailProps) {
  const [org, setOrg] = useState<OrganizationRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(false)

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true)
      try {
        const data = await adminApi.getOrganizationDetail(id)
        setOrg(data)
      } finally {
        setLoading(false)
      }
    }
    loadDetail()
  }, [id])

  const handleCopyId = () => {
    if (org?.id) {
      navigator.clipboard.writeText(org.id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="admin-page-container">
        <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="admin-spinner" style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>⟳</div>
          <div>Loading organization profile & telemetry...</div>
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="admin-page-container">
        <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Building2 size={40} className="empty-icon" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '1rem', color: '#0f172a' }}>
            Organization Not Found
          </h3>
          <p style={{ color: '#64748b', margin: '0.5rem 0 1.5rem 0' }}>
            The requested organization ID &quot;{id}&quot; does not exist or has been removed.
          </p>
          <AdminButton variant="primary" onClick={onBack} icon={<ArrowLeft size={15} />}>
            Back to Organizations
          </AdminButton>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page-container">
      {/* Breadcrumb Navigation */}
      <AdminBreadcrumb
        items={[
          { label: 'Organizations', onClick: onBack },
          { label: org.name, active: true },
        ]}
      />

      {/* Top Header Card */}
      <div className="admin-card admin-detail-header-card">
        <div className="admin-detail-header-left">
          <div className="admin-org-large-avatar">
            {org.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="admin-detail-title-row">
              <h2 className="admin-detail-title">{org.name}</h2>
              <StatusBadge status={org.status} />
              {org.isLiveApiData && <span className="org-live-tag">Live DB Record</span>}
            </div>
            <div className="admin-detail-subline">
              <span className="admin-uuid-tag" onClick={handleCopyId} title="Click to copy full ID">
                ID: {org.id}
                {copiedId ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              </span>
              <span className="separator">•</span>
              <span>Owner: <strong>{org.ownerName}</strong> ({org.ownerEmail})</span>
            </div>
          </div>
        </div>

        <div className="admin-detail-header-right">
          <AdminButton
            variant="outline"
            size="md"
            icon={<ArrowLeft size={15} />}
            onClick={onBack}
            tooltip="Return to organizations directory"
          >
            Back to Organizations
          </AdminButton>
        </div>
      </div>

      {/* Security Data Boundary Notice */}
      <div className="admin-privacy-banner">
        <ShieldCheck size={16} className="text-success flex-shrink-0" />
        <div className="privacy-text">
          <strong>Tenant Privacy Isolation Active:</strong> Platform operations view only displays tenant metadata and volume counters. In compliance with data isolation, financial values, invoice balances, and bank transactions remain restricted to tenant personnel.
        </div>
      </div>

      {/* Summary Volume Counters Row (Metadata Only) */}
      <div className="admin-stat-cards-grid">
        <AdminStatCard
          label="Total Customers"
          value={org.counts.customers}
          icon={<Users size={20} />}
          description="Registered buyer accounts"
        />
        <AdminStatCard
          label="Total Invoices"
          value={org.counts.invoices}
          icon={<FileText size={20} />}
          description="Generated invoice documents"
        />
        <AdminStatCard
          label="Payments Recorded"
          value={org.counts.payments}
          icon={<CheckCircle2 size={20} />}
          description="Settled reconciliation records"
        />
        <AdminStatCard
          label="Active Reminders"
          value={org.counts.activeReminders}
          icon={<BellRing size={20} />}
          description="Open automated sequences"
        />
      </div>

      {/* Main Grid: Profile + Subscription & Usage */}
      <div className="admin-dashboard-content-grid">
        {/* Left Column: Organization Profile & Basic Info */}
        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Profile & Basic Information</h3>
              <p className="admin-card-subtitle">Tenant business registration parameters</p>
            </div>
          </div>

          <div className="admin-info-definition-list">
            <div className="admin-info-item">
              <span className="info-label"><Building2 size={14} /> Legal Name</span>
              <span className="info-value">{org.legalName || org.name}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label"><Globe size={14} /> Business Email</span>
              <span className="info-value">{org.ownerEmail}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label"><MapPin size={14} /> Place of Supply (GST)</span>
              <span className="info-value">{org.state || '27 (Maharashtra)'}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label"><Server size={14} /> Default Currency</span>
              <span className="info-value font-mono">{org.currency}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label"><Clock size={14} /> Timezone</span>
              <span className="info-value">{org.timezone}</span>
            </div>
            <div className="admin-info-item">
              <span className="info-label"><Calendar size={14} /> Registered On</span>
              <span className="info-value">
                {new Date(org.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </section>

        {/* Right Column: Subscription & Usage Information */}
        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Subscription & Usage Limits</h3>
              <p className="admin-card-subtitle">Current plan quotas and consumption telemetry</p>
            </div>
            <span className={`admin-plan-badge tier-${org.planTier}`}>
              {org.plan}
            </span>
          </div>

          <div className="admin-subscription-details-box">
            <div className="sub-detail-row">
              <span>Billing Cadence:</span>
              <strong>{org.subscription?.billingCycle === 'annually' ? 'Annual Billing' : 'Monthly Billing'}</strong>
            </div>
            <div className="sub-detail-row">
              <span>Current Period Ends:</span>
              <strong>{org.subscription?.periodEnd || '2026-12-31'}</strong>
            </div>
            <div className="sub-detail-row">
              <span>Subscription Status:</span>
              <StatusBadge status={org.subscription?.status || org.status} />
            </div>
          </div>

          {/* Usage Quota Bars */}
          <div className="admin-usage-bars-list">
            <div className="usage-progress-item">
              <div className="usage-progress-header">
                <span>Customer Seats</span>
                <span>{org.usage?.usersUsed || 1} / {org.usage?.usersLimit || 5} seats</span>
              </div>
              <div className="admin-progress-track">
                <div
                  className="admin-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.round(((org.usage?.usersUsed || 1) / (org.usage?.usersLimit || 5)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="usage-progress-item">
              <div className="usage-progress-header">
                <span>Monthly Invoices</span>
                <span>{org.usage?.invoicesUsed || 0} / {org.usage?.invoicesLimit || 500} docs</span>
              </div>
              <div className="admin-progress-track">
                <div
                  className="admin-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.round(((org.usage?.invoicesUsed || 0) / (org.usage?.invoicesLimit || 500)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="usage-progress-item">
              <div className="usage-progress-header">
                <span>AI Assistant Tokens (Gemini)</span>
                <span>
                  {((org.usage?.aiTokensUsed || 0) / 1000).toFixed(0)}k / {((org.usage?.aiTokensLimit || 100000) / 1000).toFixed(0)}k tokens
                </span>
              </div>
              <div className="admin-progress-track">
                <div
                  className="admin-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.round(((org.usage?.aiTokensUsed || 0) / (org.usage?.aiTokensLimit || 100000)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Organization Members Section */}
      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">Authorized Organization Members</h3>
            <p className="admin-card-subtitle">Tenant customers and team members with role-based access to this workspace</p>
          </div>
          <span className="admin-data-pill">{org.members?.length || 1} Member(s)</span>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {org.members && org.members.length > 0 ? (
                org.members.map((m) => (
                  <tr key={m.id}>
                    <td className="font-semibold">
                      <div className="member-name-cell">
                        <span className="member-avatar">{m.name.slice(0, 1)}</span>
                        <span>{m.name}</span>
                      </div>
                    </td>
                    <td>{m.email}</td>
                    <td>
                      <span className={`admin-member-role-pill ${m.role === 'Business Owner' ? 'owner' : ''}`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="text-muted">{m.joinedAt}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="admin-table-empty">
                    No additional team members registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Platform Audit Activity */}
      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">Recent Platform Audit Activity</h3>
            <p className="admin-card-subtitle">Security trail and operational events logged for this tenancy</p>
          </div>
          <span className="admin-data-pill">Audit Log</span>
        </div>

        <div className="admin-activity-list">
          {org.auditLogs && org.auditLogs.length > 0 ? (
            org.auditLogs.map((log) => (
              <div key={log.id} className="admin-activity-item severity-info">
                <div className="admin-activity-icon-col">
                  <div className="admin-activity-avatar">
                    <Clock size={16} />
                  </div>
                </div>
                <div className="admin-activity-body">
                  <div className="admin-activity-row">
                    <span className="admin-activity-title font-mono text-sm">{log.action}</span>
                    <span className="admin-activity-time">{log.timestamp}</span>
                  </div>
                  <p className="admin-activity-desc">{log.summary} (Actor: {log.actor})</p>
                </div>
              </div>
            ))
          ) : (
            <div className="admin-table-empty" style={{ padding: '1.5rem' }}>
              No audit logs recorded for this tenant yet.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
