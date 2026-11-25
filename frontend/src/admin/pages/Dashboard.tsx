import React, { useState, useEffect, useCallback } from 'react'
import {
  Building2, Users, CreditCard, BrainCircuit, AlertTriangle,
  Clock, ShieldAlert, Sparkles, TrendingUp, AlertCircle,
  CheckCircle2, ArrowRight, ArrowUpRight, ArrowDownRight,
  ChevronRight, RefreshCw, Layers, ShieldCheck, Activity,
  Server, BellRing, ScrollText, BarChart3, Bot, ExternalLink,
  Info, Cpu, Calendar
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import AdminStatCard from '../components/AdminStatCard'
import StatusBadge from '../components/StatusBadge'
import AdminButton from '../components/AdminButton'
import AdminSelect from '../components/AdminSelect'
import { OVERVIEW_DASHBOARD_DATA, type RecentOrgActivityItem } from '../services/mockDataService'
import { adminApi, type DashboardStats } from '../services/adminApi'
import type { AdminUser } from '../types/admin.types'

interface DashboardProps {
  user: AdminUser | null
  onNavigate?: (path: string) => void
}

type RangeOption = '7d' | '30d' | '90d'

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [chartRange, setChartRange] = useState<RangeOption>('7d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [liveStats, setLiveStats] = useState<DashboardStats | null>(null)
  const [isLive, setIsLive] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminApi.getDashboardStats()
      setLiveStats(data)
      setIsLive(true)
    } catch {
      setIsLive(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    } else {
      window.location.href = path
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchStats().finally(() => setIsRefreshing(false))
  }

  // Active chart dataset based on date range selection
  const chartData = OVERVIEW_DASHBOARD_DATA.activityTrends[chartRange]
  const subData = liveStats
    ? { active: liveStats.subscriptions.active, trial: liveStats.subscriptions.trial, pastDue: liveStats.subscriptions.past_due, total: liveStats.subscriptions.total }
    : OVERVIEW_DASHBOARD_DATA.subscriptionOverview
  const closedCount = Math.max(0, subData.total - (subData.active + subData.trial + subData.pastDue))
  const aiData = OVERVIEW_DASHBOARD_DATA.aiUsage
  const opsData = OVERVIEW_DASHBOARD_DATA.operationalHealth
  const alertsData = OVERVIEW_DASHBOARD_DATA.importantAlerts
  const recentActivities: RecentOrgActivityItem[] = liveStats && liveStats.recent_activity.length > 0
    ? liveStats.recent_activity.map((a, i) => ({
        id: a.id || String(i),
        organizationName: a.organization || 'Platform System',
        activity: a.summary || `${a.actor} performed ${a.action}`,
        timestamp: new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'active' as const,
        statusLabel: a.action,
        orgId: '',
      }))
    : OVERVIEW_DASHBOARD_DATA.recentActivity

  const rangeOptions = [
    { value: '7d' as RangeOption, label: 'Last 7 Days' },
    { value: '30d' as RangeOption, label: 'Last 30 Days' },
    { value: '90d' as RangeOption, label: 'Last 90 Days' },
  ]

  return (
    <div className="admin-page-container">
      {/* ── Top Page Bar: Heading & Horizontal Dashboard Toolbar ──────── */}
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1 className="admin-page-heading">Platform Overview</h1>
          <p className="admin-page-subheading">
            Live telemetry, system operations, and aggregate multi-tenant performance health.
          </p>
        </div>

        {/* Dashboard Toolbar: Kept separate from header profile dropdown */}
        <div className="admin-dashboard-toolbar">
          <div className="admin-data-source-pill" title={isLive ? 'Live database data' : 'Demo data'}>
            <span className={`source-dot ${isLive ? 'live' : 'mock'}`} />
            <span>{isLive ? 'Live Data' : 'Demo Data Active'}</span>
          </div>

          <AdminSelect<RangeOption>
            value={chartRange}
            onChange={(val) => setChartRange(val)}
            options={rangeOptions}
            size="sm"
            icon={<Calendar size={13} />}
          />

          <AdminButton
            variant="outline"
            size="sm"
            icon={<RefreshCw size={13} className={isRefreshing ? 'spin' : ''} />}
            onClick={handleRefresh}
            loading={isRefreshing}
            loadingText="Refreshing..."
            tooltip="Refresh telemetry aggregate data"
          >
            Refresh
          </AdminButton>
        </div>
      </div>

      {/* ── Section 4: Four Primary Summary KPI Cards in One Row ───────────── */}
      <section className="admin-stat-cards-grid" aria-label="Key Performance Indicators">
        {/* Card 1: Total Organizations */}
        <AdminStatCard
          label="Total Organizations"
          value={liveStats ? String(liveStats.organizations.total) : '—'}
          change={liveStats ? `${liveStats.organizations.active} active` : '+12.5%'}
          changeType="positive"
          icon={<Building2 size={20} />}
          description={isLive ? 'from database' : 'vs last month'}
          isDemo={!isLive}
        />

        {/* Card 2: Total Users */}
        <AdminStatCard
          label="Total Users"
          value={liveStats ? String(liveStats.users.total) : '—'}
          change={isLive ? 'active accounts' : '+8.2%'}
          changeType="positive"
          icon={<Users size={20} />}
          description={isLive ? 'from database' : 'vs last month'}
          isDemo={!isLive}
        />

        {/* Card 3: Active Subscriptions */}
        <AdminStatCard
          label="Active Subscriptions"
          value={liveStats ? String(liveStats.subscriptions.active) : '—'}
          change={liveStats ? `${liveStats.subscriptions.trial} on trial` : '+6.4%'}
          changeType="positive"
          icon={<CreditCard size={20} />}
          description={isLive ? 'from database' : 'vs last month'}
          isDemo={!isLive}
        />

        {/* Card 4: AI Requests */}
        <AdminStatCard
          label="AI Requests Today"
          value={liveStats ? String(liveStats.ai_requests.today) : '—'}
          change={liveStats ? `${liveStats.ai_requests.this_month} this month` : '+18.3%'}
          changeType="positive"
          icon={<BrainCircuit size={20} />}
          description={isLive ? 'from database' : 'vs last month'}
          isDemo={!isLive}
        />
      </section>

      {/* ── Main Two-Column Row: Subscription Overview & Platform Activity ─── */}
      <div className="admin-dashboard-two-col">
        {/* ── Section 5: Subscription Overview Card ────────────────────────── */}
        <section className="admin-card subscription-overview-card" aria-labelledby="sub-overview-title">
          <div className="admin-card-header">
            <div>
              <h3 id="sub-overview-title" className="admin-card-title">Subscription Overview</h3>
              <p className="admin-card-subtitle">
                Tenant billing status, active contracts, and trial conversion health
              </p>
            </div>
            <AdminButton
              variant="ghost"
              size="sm"
              icon={<ArrowRight size={14} />}
              iconPosition="right"
              onClick={() => handleNav('/admin/subscriptions')}
              tooltip="Navigate to Subscriptions page"
            >
              View Subscriptions
            </AdminButton>
          </div>

          {/* Counts & Status Metrics */}
          <div className="sub-overview-metrics-grid">
            <div className="sub-metric-box active">
              <div className="sub-metric-header">
                <span className="sub-metric-dot active" />
                <span className="sub-metric-name">Active Subscriptions</span>
              </div>
              <div className="sub-metric-count">{subData.active}</div>
              <div className="sub-metric-desc">Paid recurring tiers</div>
            </div>

            <div className="sub-metric-box trial">
              <div className="sub-metric-header">
                <span className="sub-metric-dot trial" />
                <span className="sub-metric-name">Trial Period</span>
              </div>
              <div className="sub-metric-count">{subData.trial}</div>
              <div className="sub-metric-desc">14-day free trials</div>
            </div>

            <div className="sub-metric-box past-due">
              <div className="sub-metric-header">
                <span className="sub-metric-dot past-due" />
                <span className="sub-metric-name">Past Due</span>
              </div>
              <div className="sub-metric-count">{subData.pastDue}</div>
              <div className="sub-metric-desc">Payment retry mode</div>
            </div>

            <div className="sub-metric-box closed">
              <div className="sub-metric-header">
                <span className="sub-metric-dot closed" />
                <span className="sub-metric-name">Cancelled / Closed</span>
              </div>
              <div className="sub-metric-count">{closedCount}</div>
              <div className="sub-metric-desc">Expired accounts</div>
            </div>
          </div>

          {/* Ratio Progress Bar */}
          <div className="admin-sub-bar-container">
            <div className="admin-sub-bar-labels">
              <span>Subscription Distribution</span>
              <span className="text-muted text-xs">
                {Math.round((subData.active / subData.total) * 100)}% Conversion
              </span>
            </div>
            <div className="admin-stacked-bar">
              <div
                className="bar-segment active"
                style={{ width: `${(subData.active / 1250) * 100}%` }}
                title={`Active: ${subData.active}`}
              />
              <div
                className="bar-segment trial"
                style={{ width: `${(subData.trial / 1250) * 100}%` }}
                title={`Trial: ${subData.trial}`}
              />
              <div
                className="bar-segment past-due"
                style={{ width: `${(subData.pastDue / 1250) * 100}%` }}
                title={`Past Due: ${subData.pastDue}`}
              />
              <div
                className="bar-segment closed"
                style={{ width: `${(closedCount / 1250) * 100}%` }}
                title={`Closed: ${closedCount}`}
              />
            </div>
          </div>

          <div className="admin-card-notice-row">
            <Info size={14} className="text-muted flex-shrink-0" />
            <span>
              All recurring subscriptions are recorded in integer paise and billed via external gateway.
            </span>
          </div>
        </section>

        {/* ── Section 6: Platform Activity Line Chart ─────────────────────── */}
        <section className="admin-card platform-activity-card" aria-labelledby="activity-chart-title">
          <div className="admin-card-header">
            <div>
              <h3 id="activity-chart-title" className="admin-card-title">Platform Activity Trends</h3>
              <p className="admin-card-subtitle">
                New organization onboarding pace vs. active platform organizations
              </p>
            </div>

            {/* Date Range Selector Pills */}
            <div className="admin-range-selector" role="group" aria-label="Select date range">
              {(['7d', '30d', '90d'] as RangeOption[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`range-pill ${chartRange === r ? 'active' : ''}`}
                  onClick={() => setChartRange(r)}
                >
                  {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Line Chart using Recharts */}
          <div className="admin-chart-container" style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 16, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={['dataMin - 20', 'dataMax + 20']}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="signups"
                  name="New Signups"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="active"
                  name="Active Organizations"
                  stroke="#0b132b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2, fill: '#0b132b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="admin-chart-legend-subtext">
            <span>Left scale: New Signups (Daily aggregate)</span>
            <span>Right scale: Active Organizations (Cumulative trend)</span>
          </div>
        </section>
      </div>

      {/* ── Second Two-Column Row: AI Usage Overview & Operational Health ─── */}
      <div className="admin-dashboard-two-col">
        {/* ── Section 7: AI Usage Overview ─────────────────────────────────── */}
        <section className="admin-card ai-usage-card" aria-labelledby="ai-usage-title">
          <div className="admin-card-header">
            <div className="flex items-center gap-2">
              <div>
                <h3 id="ai-usage-title" className="admin-card-title">AI Usage Overview</h3>
                <p className="admin-card-subtitle">
                  Gemini API requests, token metadata, provider distribution & telemetry
                </p>
              </div>
            </div>
            <AdminButton
              variant="ghost"
              size="sm"
              icon={<ArrowRight size={14} />}
              iconPosition="right"
              onClick={() => handleNav('/admin/ai-monitoring')}
              tooltip="Navigate to AI Monitoring"
            >
              AI Monitoring
            </AdminButton>
          </div>

          {/* AI Usage KPI Grid */}
          <div className="ai-usage-stats-grid">
            <div className="ai-stat-box">
              <span className="ai-stat-title">Total AI Requests</span>
              <span className="ai-stat-value">{aiData.totalRequests}</span>
              <span className="ai-stat-note">Across all tenant assistants</span>
            </div>

            <div className="ai-stat-box">
              <span className="ai-stat-title">Input Tokens</span>
              <span className="ai-stat-value">{aiData.inputTokens}</span>
              <span className="ai-stat-note">74.7% prompt caching efficiency</span>
            </div>

            <div className="ai-stat-box">
              <span className="ai-stat-title">Output Tokens</span>
              <span className="ai-stat-value">{aiData.outputTokens}</span>
              <span className="ai-stat-note">Structured JSON & analysis</span>
            </div>

            <div className="ai-stat-box">
              <span className="ai-stat-title">Failed AI Requests</span>
              <span className="ai-stat-value text-success">{aiData.failedRequests}</span>
              <span className="ai-stat-note text-success">{aiData.errorRate} rate (SLA &lt; 0.2%)</span>
            </div>
          </div>

          {/* Model / Provider Breakdown Summary */}
          <div className="ai-models-section">
            <div className="ai-models-header">
              <span className="section-small-title">Model & Provider Usage Summary</span>
              <span className="text-muted text-xs">Total: {aiData.totalTokens} Tokens</span>
            </div>

            <div className="ai-models-bar">
              {aiData.models.map((m) => (
                <div
                  key={m.name}
                  className="ai-model-segment"
                  style={{ width: `${m.sharePct}%`, backgroundColor: m.color }}
                  title={`${m.name}: ${m.sharePct}% (${m.requests} requests)`}
                />
              ))}
            </div>

            <div className="ai-models-list">
              {aiData.models.map((m) => (
                <div key={m.name} className="ai-model-item">
                  <div className="model-indicator-group">
                    <span className="model-color-dot" style={{ backgroundColor: m.color }} />
                    <span className="model-name">{m.name}</span>
                  </div>
                  <div className="model-metrics">
                    <span className="model-share">{m.sharePct}% volume</span>
                    <span className="model-tokens text-muted">({m.requests})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Zero-Trust Notice */}
          <div className="admin-privacy-banner">
            <ShieldCheck size={16} className="text-success flex-shrink-0" />
            <p className="privacy-text">
              <strong>Telemetry Metadata Only:</strong> In accordance with tenant privacy policy, prompts, conversation text, and customer financial transactions are strictly segregated and NEVER recorded or displayed.
            </p>
          </div>
        </section>

        {/* ── Section 8: Operational Health ─────────────────────────────────── */}
        <section className="admin-card operational-health-card" aria-labelledby="ops-health-title">
          <div className="admin-card-header">
            <div>
              <h3 id="ops-health-title" className="admin-card-title">Operational Health</h3>
              <p className="admin-card-subtitle">
                Background pipelines, automated reminders, and platform system integrity
              </p>
            </div>
            <AdminButton
              variant="ghost"
              size="sm"
              icon={<ArrowRight size={14} />}
              iconPosition="right"
              onClick={() => handleNav('/admin/operations')}
              tooltip="Navigate to Operations page"
            >
              Review Operations
            </AdminButton>
          </div>

          {/* Operational Health Items List */}
          <div className="ops-health-list">
            {opsData.map((op) => {
              const statusClass =
                op.status === 'healthy' ? 'is-healthy' :
                op.status === 'warning' ? 'is-warning' : 'is-critical'

              const statusBadgeLabel =
                op.status === 'healthy' ? 'Healthy' :
                op.status === 'warning' ? 'Warning' : 'Critical'

              return (
                <div
                  key={op.id}
                  className={`ops-health-row ${statusClass}`}
                  onClick={() => handleNav(op.targetPath)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNav(op.targetPath) }}
                >
                  <div className="ops-row-status-dot">
                    <span className={`status-indicator-dot ${op.status}`} />
                  </div>

                  <div className="ops-row-info">
                    <div className="ops-row-title-bar">
                      <span className="ops-title">{op.title}</span>
                      <span className={`ops-status-badge ${op.status}`}>
                        {statusBadgeLabel}
                      </span>
                    </div>
                    <div className="ops-row-metric">
                      <span className="ops-value">{op.value}</span>
                      <span className="ops-note">{op.note}</span>
                    </div>
                  </div>

                  <div className="ops-row-arrow">
                    <ChevronRight size={16} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="ops-quick-links-row">
            <button
              type="button"
              onClick={() => handleNav('/admin/operations')}
              className="ops-quick-link"
            >
              <Server size={14} />
              <span>Background Jobs Queue</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav('/admin/reminders')}
              className="ops-quick-link"
            >
              <BellRing size={14} />
              <span>Reminder Dispatch Engine</span>
            </button>
          </div>
        </section>
      </div>

      {/* ── Section 9: Important Alerts ──────────────────────────────────── */}
      <section className="admin-card important-alerts-section" aria-labelledby="alerts-section-title">
        <div className="admin-card-header">
          <div>
            <h3 id="alerts-section-title" className="admin-card-title">Important Alerts</h3>
            <p className="admin-card-subtitle">
              Prioritized operational alerts across billing, free trial lifecycle, and quotas
            </p>
          </div>
          <span className="admin-data-pill" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #d1fae5' }}>
            5 Active Alerts
          </span>
        </div>

        <div className="alerts-grid">
          {alertsData.map((alert) => {
            const severityClass =
              alert.severity === 'critical' ? 'alert-critical' :
              alert.severity === 'warning' ? 'alert-warning' : 'alert-info'

            const severityIcon =
              alert.severity === 'critical' ? <AlertCircle size={18} className="text-danger" /> :
              alert.severity === 'warning' ? <AlertTriangle size={18} className="text-warning" /> :
              <Info size={18} className="text-info" />

            return (
              <div key={alert.id} className={`admin-alert-card ${severityClass}`}>
                <div className="alert-card-top">
                  <div className="alert-icon-wrap">
                    {severityIcon}
                  </div>
                  <div className="alert-title-wrap">
                    <div className="alert-title">{alert.title}</div>
                    <div className="alert-entity">{alert.entityName}</div>
                  </div>
                  <span className={`alert-severity-badge ${alert.severity}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>

                <div className="alert-card-bottom">
                  <span className="alert-time">
                    <Clock size={12} />
                    <span>{alert.timestamp}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleNav(alert.linkPath)}
                    className="alert-action-btn"
                  >
                    <span>{alert.linkLabel}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 10: Recent Organization Activity Table ─────────────────── */}
      <section className="admin-card recent-org-activity-card" aria-labelledby="activity-table-title">
        <div className="admin-card-header">
          <div>
            <h3 id="activity-table-title" className="admin-card-title">Recent Organization Activity</h3>
            <p className="admin-card-subtitle">
              Administrative log of onboarding, plan switches, and tenant membership events
            </p>
          </div>

          <AdminButton
            variant="ghost"
            size="sm"
            icon={<ArrowRight size={14} />}
            iconPosition="right"
            onClick={() => handleNav('/admin/organizations')}
            tooltip="Navigate to Organizations"
          >
            View All Organizations
          </AdminButton>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="admin-table-responsive-wrapper">
          <table className="admin-dashboard-table">
            <thead>
              <tr>
                <th scope="col">Organization Name</th>
                <th scope="col">Activity</th>
                <th scope="col">Date / Time</th>
                <th scope="col">Status</th>
                <th scope="col" style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((entry) => (
                <tr key={entry.id}>
                  <td className="font-semibold text-navy">
                    <div className="org-name-cell">
                      <div className="org-mini-avatar">
                        <Building2 size={14} />
                      </div>
                      <span>{entry.organizationName}</span>
                    </div>
                  </td>
                  <td className="text-muted activity-cell">
                    {entry.activity}
                  </td>
                  <td className="text-muted text-xs whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {entry.timestamp}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={entry.status} label={entry.statusLabel} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <AdminButton
                      variant="ghost"
                      size="sm"
                      icon={<ArrowRight size={12} />}
                      iconPosition="right"
                      onClick={() => handleNav(`/admin/organizations?id=${entry.orgId}`)}
                      tooltip={`Inspect details for ${entry.organizationName}`}
                    >
                      View Org
                    </AdminButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-card-notice-row" style={{ marginTop: '1rem' }}>
          <ShieldAlert size={14} className="text-muted flex-shrink-0" />
          <span>
            Strict Privacy Standard: In accordance with platform governance, financial invoice line items and transaction bank details are omitted from platform telemetry.
          </span>
        </div>
      </section>

      {/* ── Section 11: Quick Navigation Shortcuts ────────────────────────── */}
      <section className="admin-card quick-nav-card" aria-labelledby="quick-nav-title">
        <div className="admin-card-header">
          <div>
            <h3 id="quick-nav-title" className="admin-card-title">Quick Navigation</h3>
            <p className="admin-card-subtitle">
              Jump directly to specific platform management, monitoring, and audit log modules
            </p>
          </div>
        </div>

        <div className="quick-nav-grid">
          <button
            type="button"
            className="quick-nav-btn"
            onClick={() => handleNav('/admin/organizations')}
          >
            <div className="quick-nav-icon"><Building2 size={18} /></div>
            <div className="quick-nav-text">
              <span className="quick-nav-label">Organizations</span>
              <span className="quick-nav-sub">Tenants & accounts</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-nav-btn"
            onClick={() => handleNav('/admin/users')}
          >
            <div className="quick-nav-icon"><Users size={18} /></div>
            <div className="quick-nav-text">
              <span className="quick-nav-label">Customers</span>
              <span className="quick-nav-sub">Customer accounts & status</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-nav-btn"
            onClick={() => handleNav('/admin/subscriptions')}
          >
            <div className="quick-nav-icon"><CreditCard size={18} /></div>
            <div className="quick-nav-text">
              <span className="quick-nav-label">Subscriptions</span>
              <span className="quick-nav-sub">Tier management</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-nav-btn"
            onClick={() => handleNav('/admin/usage')}
          >
            <div className="quick-nav-icon"><BarChart3 size={18} /></div>
            <div className="quick-nav-text">
              <span className="quick-nav-label">Usage</span>
              <span className="quick-nav-sub">Quotas & limits</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-nav-btn"
            onClick={() => handleNav('/admin/ai-monitoring')}
          >
            <div className="quick-nav-icon"><Bot size={18} /></div>
            <div className="quick-nav-text">
              <span className="quick-nav-label">AI Monitoring</span>
              <span className="quick-nav-sub">Gemini telemetry</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-nav-btn"
            onClick={() => handleNav('/admin/operations')}
          >
            <div className="quick-nav-icon"><Server size={18} /></div>
            <div className="quick-nav-text">
              <span className="quick-nav-label">Operations</span>
              <span className="quick-nav-sub">Background jobs</span>
            </div>
          </button>

          <button
            type="button"
            className="quick-nav-btn"
            onClick={() => handleNav('/admin/audit-logs')}
          >
            <div className="quick-nav-icon"><ScrollText size={18} /></div>
            <div className="quick-nav-text">
              <span className="quick-nav-label">Audit Logs</span>
              <span className="quick-nav-sub">Security & events</span>
            </div>
          </button>
        </div>
      </section>
    </div>
  )
}
