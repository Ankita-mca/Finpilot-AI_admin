import React, { useState, useEffect, useCallback } from 'react'
import {
  Bot, AlertTriangle, ShieldAlert, ShieldCheck, Power,
  Zap, DollarSign, Activity, CheckCircle2, AlertCircle, RefreshCw, Eye
} from 'lucide-react'
import AdminStatCard from '../components/AdminStatCard'
import AdminButton from '../components/AdminButton'
import AdminConfirmDialog from '../components/AdminConfirmDialog'
import AdminTableActionMenu from '../components/AdminTableActionMenu'
import { MOCK_AI_MONITORING, type AIMonitoringData } from '../services/mockDataService'
import { adminApi } from '../services/adminApi'

export default function AIMonitoring() {
  const [data, setData] = useState<AIMonitoringData>(MOCK_AI_MONITORING)
  const [killSwitchModal, setKillSwitchModal] = useState(false)
  const [targetOrgDisable, setTargetOrgDisable] = useState<{ id: string; name: string; current: boolean } | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLive, setIsLive] = useState(false)

  const fetchMonitoring = useCallback(async () => {
    try {
      const res = await adminApi.getAIMonitoring()
      if (res && res.organizationUsage) {
        setData(res)
        setIsLive(true)
      }
    } catch (err) {
      console.error('Failed to fetch AI monitoring telemetry:', err)
    }
  }, [])

  useEffect(() => {
    fetchMonitoring()
    const timer = setInterval(fetchMonitoring, 10000)
    return () => clearInterval(timer)
  }, [fetchMonitoring])

  const handleToggleKillSwitch = (reason?: string) => {
    const newState = !data.globalKillSwitchActive
    setData((prev) => ({ ...prev, globalKillSwitchActive: newState }))
    setKillSwitchModal(false)
    setToastMsg(
      newState
        ? `EMERGENCY: Global AI Kill Switch activated${reason ? ` (${reason})` : ''}. All tenant assistant requests are halted.`
        : 'Global AI engine restored. Assistant requests resumed across all tenancies.'
    )
    setTimeout(() => setToastMsg(null), 5000)
  }

  const handleToggleOrgAi = async (reason?: string) => {
    if (!targetOrgDisable) return
    const { id, name, current } = targetOrgDisable
    try {
      await adminApi.toggleOrgAI(id)
      await fetchMonitoring()
      setToastMsg(
        `AI access for ${name} has been ${current ? 'disabled' : 'enabled'}${reason ? ` (Reason: ${reason})` : ''}.`
      )
    } catch (err: any) {
      setToastMsg(`Failed to toggle AI for ${name}: ${err?.message || 'Server error'}`)
    } finally {
      setTargetOrgDisable(null)
      setTimeout(() => setToastMsg(null), 5000)
    }
  }

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">AI Engine Telemetry & Governance</h2>
          <p className="admin-page-subheading">
            Live monitoring of Google Gemini models, prompt/output token consumption, provider latency, and emergency kill switches.
          </p>
        </div>
        <div className="admin-page-actions">
          <AdminButton
            variant="outline"
            icon={<RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />}
            onClick={async () => {
              setIsRefreshing(true)
              await fetchMonitoring()
              setIsRefreshing(false)
            }}
            loading={isRefreshing}
            tooltip="Refresh live AI telemetry from database"
          >
            Refresh
          </AdminButton>
          <AdminButton
            variant={data.globalKillSwitchActive ? 'primary' : 'danger'}
            icon={<Power size={14} />}
            onClick={() => setKillSwitchModal(true)}
            tooltip="Emergency platform-wide AI kill switch"
          >
            {data.globalKillSwitchActive ? 'Restore Platform AI Engine' : 'Global AI Kill Switch'}
          </AdminButton>
        </div>
      </div>

      {/* Strict Privacy Guarantee Banner */}
      <div className="admin-privacy-banner" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
        <ShieldCheck size={18} className="text-success flex-shrink-0" />
        <div className="privacy-text">
          <strong>Privacy Boundary Guaranteed:</strong> Platform operators have access to token volume, model inference latency, and error codes ONLY. In strict compliance with tenant isolation, confidential financial prompts and conversation contents are never stored in or surfaced on this platform panel.
        </div>
      </div>

      {toastMsg && (
        <div className={`admin-alert ${data.globalKillSwitchActive ? 'admin-alert-danger' : 'admin-alert-info'}`}>
          <AlertCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="admin-stat-cards-grid">
        <AdminStatCard
          label="Total AI Requests (Today)"
          value={data.totalRequestsToday.toLocaleString()}
          change="+14% vs yesterday"
          changeType="positive"
          icon={<Bot size={20} />}
          description="Inference operations"
        />
        <AdminStatCard
          label="Total Tokens (Month)"
          value={`${(data.totalTokensMonth / 1000000).toFixed(1)}M`}
          change="Input/Output blended"
          changeType="neutral"
          icon={<Zap size={20} className="text-warning" />}
          description="Prompt & completion tokens"
        />
        <AdminStatCard
          label="Estimated Cost (MTD)"
          value={`$${data.estimatedCostUsd.toFixed(2)}`}
          change="Within budget"
          changeType="positive"
          icon={<DollarSign size={20} className="text-success" />}
          description="Google Cloud API usage"
        />
        <AdminStatCard
          label="Inference Error Rate"
          value={`${data.errorRatePercent}%`}
          changeType="positive"
          change="SLA 99.5%"
          icon={<Activity size={20} className="text-success" />}
          description="Timeout / 5xx error rate"
        />
      </div>

      {/* 2-Column: Model Breakdown + Daily Usage Chart */}
      <div className="admin-dashboard-content-grid">
        {/* Model & Provider Usage */}
        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Model & Provider Distribution</h3>
              <p className="admin-card-subtitle">Google Gemini inference routing breakdown</p>
            </div>
            <span className="admin-data-pill">Gemini 1.5</span>
          </div>

          <div className="admin-sub-metrics-row">
            {data.modelUsage.map((m) => (
              <div key={m.model} className="admin-sub-stat-box active">
                <div className="stat-box-label font-mono">{m.model}</div>
                <div className="stat-box-number">{m.sharePct}%</div>
                <div className="stat-box-pct">{(m.tokens / 1000).toFixed(0)}k tokens</div>
              </div>
            ))}
          </div>

          <div className="admin-sub-bar-container">
            <div className="admin-stacked-bar">
              <div className="bar-segment active" style={{ width: '67%' }} title="Gemini 1.5 Flash: 67%" />
              <div className="bar-segment trial" style={{ width: '29%' }} title="Gemini 1.5 Pro: 29%" />
              <div className="bar-segment past-due" style={{ width: '4%' }} title="Flash-Lite: 4%" />
            </div>
          </div>
        </section>

        {/* 7-Day Usage Trends */}
        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">7-Day Inference Volume Trends</h3>
              <p className="admin-card-subtitle">Daily requests and token telemetry</p>
            </div>
            <span className="admin-data-pill">Telemetry</span>
          </div>

          <div className="admin-chart-bar-list">
            {data.dailyTrends.map((d) => (
              <div key={d.date} className="chart-bar-item">
                <div className="chart-bar-label font-mono">{d.date}</div>
                <div className="chart-bar-visual">
                  <div className="chart-track">
                    <div
                      className="chart-fill signups"
                      style={{ width: `${(d.requests / 1600) * 100}%` }}
                      title={`Requests: ${d.requests}`}
                    />
                  </div>
                </div>
                <div className="chart-bar-values">
                  <span>{d.requests} reqs</span>
                  <span className="text-muted">({d.tokensK}k tokens)</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Organization-wise AI Usage Table */}
      <div className="admin-card admin-table-card">
        <div className="admin-card-header" style={{ padding: '1.25rem 1.5rem 0.5rem 1.5rem' }}>
          <div>
            <h3 className="admin-card-title">Tenant Organization AI Consumption</h3>
            <p className="admin-card-subtitle">Tenant-level inference volume and individual kill-switch controls</p>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Primary Model</th>
                <th>Requests (Today)</th>
                <th>Tokens Consumed</th>
                <th>Error Rate</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.organizationUsage.map((org) => (
                <tr key={org.organizationId}>
                  <td className="font-semibold">{org.organizationName}</td>
                  <td><span className="font-mono text-xs">{org.primaryModel}</span></td>
                  <td>{org.requestsToday.toLocaleString()}</td>
                  <td className="text-muted">—</td>
                  <td>
                    <span className={org.errorRate > 1 ? 'text-danger font-semibold' : 'text-success'}>
                      {org.errorRate}%
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${org.isAiDisabled ? 'admin-badge-suspended' : 'admin-badge-active'}`}>
                      {org.isAiDisabled ? 'Disabled' : 'Operational'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <AdminTableActionMenu
                      primaryAction={{
                        id: 'toggle-ai',
                        label: org.isAiDisabled ? 'Enable AI' : 'Disable AI',
                        icon: <Power size={13} />,
                        variant: org.isAiDisabled ? 'outline' : 'danger',
                        tooltip: org.isAiDisabled ? 'Re-enable AI assistant queries' : 'Emergency halt AI queries for this tenant',
                        showLabel: true,
                        onClick: () =>
                          setTargetOrgDisable({
                            id: org.organizationId,
                            name: org.organizationName,
                            current: org.isAiDisabled,
                          }),
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Kill Switch Confirmation Modal */}
      {killSwitchModal && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setKillSwitchModal(false)}
          title={data.globalKillSwitchActive ? 'Restore Platform AI Engine' : 'ACTIVATE GLOBAL AI KILL SWITCH'}
          isDanger={!data.globalKillSwitchActive}
          confirmLabel={data.globalKillSwitchActive ? 'Restore Engine Now' : 'CONFIRM EMERGENCY HALT'}
          description={
            data.globalKillSwitchActive
              ? 'Restoring the platform AI engine will resume Google Gemini API processing across all tenancies.'
              : 'Activating the global kill switch immediately rejects all incoming Gemini AI queries across all organizations with HTTP 503 Service Unavailable.'
          }
          targetDetails={[
            { label: 'Scope', value: 'Global Platform (All Tenancies)' },
            { label: 'Current State', value: data.globalKillSwitchActive ? 'Halted' : 'Operational' },
          ]}
          requireReason={!data.globalKillSwitchActive}
          reasonLabel="Incident / Outage Justification"
          reasonPlaceholder="e.g. Model hallucination surge, API quota exhaustion, or Google Cloud outage..."
          warningNote="Emergency Control: This halts all natural language conversational assistant tools immediately."
          onConfirm={handleToggleKillSwitch}
        />
      )}

      {/* Single Org Disable Modal */}
      {targetOrgDisable && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setTargetOrgDisable(null)}
          title={`${targetOrgDisable.current ? 'Enable' : 'Disable'} AI for ${targetOrgDisable.name}`}
          isDanger={!targetOrgDisable.current}
          confirmLabel={targetOrgDisable.current ? 'Enable AI Access' : 'Disable AI Access'}
          description={
            targetOrgDisable.current
              ? `Re-enabling AI assistant access for ${targetOrgDisable.name} allows members to execute conversational queries.`
              : `Disabling AI will block all assistant queries initiated by members of ${targetOrgDisable.name}.`
          }
          targetDetails={[
            { label: 'Organization', value: targetOrgDisable.name },
            { label: 'Organization ID', value: targetOrgDisable.id },
          ]}
          requireReason={!targetOrgDisable.current}
          reasonLabel="Reason for Tenant AI Suspension"
          reasonPlaceholder="e.g. Rate-limit abuse, token quota exceeded, or investigation..."
          onConfirm={handleToggleOrgAi}
        />
      )}
    </div>
  )
}
