import React, { useState, useMemo } from 'react'
import {
  Bell, AlertTriangle, CheckCircle2, Clock, Check,
  CreditCard, Bot, Server, ShieldAlert, ExternalLink, Filter
} from 'lucide-react'
import AdminStatCard from '../components/AdminStatCard'
import AdminButton from '../components/AdminButton'
import AdminSelect from '../components/AdminSelect'
import { MOCK_NOTIFICATIONS, type NotificationRecord } from '../services/mockDataService'

interface NotificationsProps {
  onNavigate?: (path: string) => void
}

export default function Notifications({ onNavigate }: NotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>(MOCK_NOTIFICATIONS)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'subscription' | 'usage' | 'ai_error' | 'failed_job' | 'support_access'>('all')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')

  const unreadCount = notifications.filter((n) => !n.read).length
  const totalCount = notifications.length

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    )
  }

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (categoryFilter !== 'all' && n.category !== categoryFilter) return false
      if (readFilter === 'unread' && n.read) return false
      if (readFilter === 'read' && !n.read) return false
      return true
    })
  }, [notifications, categoryFilter, readFilter])

  const handleItemClick = (n: NotificationRecord) => {
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      )
    }
    if (n.actionUrl && onNavigate) {
      onNavigate(n.actionUrl)
    }
  }

  const categoryOptions = [
    { value: 'all' as const, label: `All Alerts (${totalCount})` },
    { value: 'subscription' as const, label: 'Subscription & Billing' },
    { value: 'usage' as const, label: 'Usage Quotas' },
    { value: 'ai_error' as const, label: 'AI Engine Anomalies' },
    { value: 'failed_job' as const, label: 'Failed Background Jobs' },
    { value: 'support_access' as const, label: 'Support Access Requests' },
  ]

  const readOptions = [
    { value: 'all' as const, label: 'All Statuses' },
    { value: 'unread' as const, label: `Unread (${unreadCount})` },
    { value: 'read' as const, label: 'Read' },
  ]

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Platform Notifications & System Alerts</h2>
          <p className="admin-page-subheading">
            Urgent operational alerts, subscription failures, usage quota warnings, and pending support authorizations.
          </p>
        </div>
        <div className="admin-page-actions">
          {unreadCount > 0 && (
            <AdminButton
              variant="outline"
              size="sm"
              icon={<Check size={14} />}
              onClick={handleMarkAllRead}
              tooltip="Mark all alerts in platform outbox as read"
            >
              Mark All as Read
            </AdminButton>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-stat-cards-grid">
        <AdminStatCard
          label="Unread Alerts"
          value={unreadCount}
          changeType={unreadCount > 0 ? 'negative' : 'positive'}
          icon={<Bell size={20} className={unreadCount > 0 ? 'text-danger' : 'text-success'} />}
          description="Require operator action"
        />
        <AdminStatCard
          label="Total Notifications"
          value={totalCount}
          icon={<Clock size={20} />}
          description="Platform notification outbox"
        />
      </div>

      {/* Toolbar Filter */}
      <div className="admin-toolbar-card">
        <div className="admin-filter-controls-row">
          <AdminSelect<'all' | 'subscription' | 'usage' | 'ai_error' | 'failed_job' | 'support_access'>
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
            options={categoryOptions}
            size="md"
            icon={<Filter size={14} />}
            label="Category"
          />

          <AdminSelect<'all' | 'unread' | 'read'>
            value={readFilter}
            onChange={(val) => setReadFilter(val)}
            options={readOptions}
            size="md"
            label="Read State"
          />

          {(categoryFilter !== 'all' || readFilter !== 'all') && (
            <AdminButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategoryFilter('all')
                setReadFilter('all')
              }}
            >
              Reset Filters
            </AdminButton>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="admin-card" style={{ padding: '0.5rem 1.25rem' }}>
        {filtered.length === 0 ? (
          <div className="admin-table-empty">
            <CheckCircle2 size={36} className="empty-icon text-success" />
            <div className="empty-title">All caught up</div>
            <div className="empty-desc">No notifications matching the selected filters.</div>
          </div>
        ) : (
          <div className="admin-activity-list" style={{ gap: '0.5rem' }}>
            {filtered.map((n) => {
              let iconNode = <AlertTriangle size={18} className="text-warning" />
              if (n.category === 'subscription') iconNode = <CreditCard size={18} className="text-danger" />
              if (n.category === 'ai_error') iconNode = <Bot size={18} className="text-danger" />
              if (n.category === 'failed_job') iconNode = <Server size={18} className="text-danger" />
              if (n.category === 'support_access') iconNode = <ShieldAlert size={18} className="text-info" />

              return (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`admin-activity-item ${n.read ? 'read-item' : 'unread-item'}`}
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    background: n.read ? '#ffffff' : '#f8fafc',
                    border: n.read ? '1px solid #f1f5f9' : '1px solid #e2e8f0',
                    borderLeft: n.read ? '1px solid #f1f5f9' : '4px solid #10b981',
                  }}
                >
                  <div className="admin-activity-avatar" style={{ background: '#ffffff' }}>
                    {iconNode}
                  </div>
                  <div className="admin-activity-body">
                    <div className="admin-activity-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="admin-activity-title font-semibold">{n.title}</span>
                        {!n.read && (
                          <span className="admin-badge admin-badge-active" style={{ fontSize: '0.65rem' }}>New</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="admin-activity-time text-xs"><Clock size={12} /> {n.timestamp}</span>
                        <button
                          type="button"
                          onClick={(e) => handleToggleRead(n.id, e)}
                          className="admin-copy-btn"
                          title={n.read ? 'Mark as Unread' : 'Mark as Read'}
                        >
                          <Check size={12} className={n.read ? 'text-muted' : 'text-success'} />
                        </button>
                      </div>
                    </div>
                    <p className="admin-activity-desc" style={{ marginTop: '0.25rem' }}>
                      {n.message}
                    </p>
                    {n.actionUrl && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>Open Related Module</span>
                        <ExternalLink size={12} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
