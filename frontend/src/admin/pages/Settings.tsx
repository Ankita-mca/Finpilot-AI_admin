import React, { useState } from 'react'
import {
  Settings as SettingsIcon, ShieldAlert, Power, CheckCircle2,
  Mail, BellRing, UserPlus, AlertTriangle, Save, Sliders, ShieldCheck
} from 'lucide-react'
import AdminButton from '../components/AdminButton'
import AdminConfirmDialog from '../components/AdminConfirmDialog'
import { MOCK_SETTINGS, type PlatformSettingsState } from '../services/mockDataService'

export default function Settings() {
  const [settings, setSettings] = useState<PlatformSettingsState>(MOCK_SETTINGS)
  const [pendingSwitch, setPendingSwitch] = useState<{
    key: keyof PlatformSettingsState
    label: string
    currentValue: boolean
  } | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleConfirmSwitch = (reason?: string) => {
    if (!pendingSwitch) return
    const { key, label, currentValue } = pendingSwitch
    const nextVal = !currentValue
    setSettings((prev) => ({ ...prev, [key]: nextVal }))
    setPendingSwitch(null)
    setToastMsg(
      `Setting "${label}" updated to ${nextVal ? 'ENABLED' : 'DISABLED'}${reason ? ` (Reason: ${reason})` : ''}. (Demo action)`
    )
    setTimeout(() => setToastMsg(null), 5000)
  }

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setToastMsg('Platform configuration parameters updated successfully. (Demo action)')
      setTimeout(() => setToastMsg(null), 4000)
    }, 600)
  }

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Platform Global Controls & Configuration</h2>
          <p className="admin-page-subheading">
            System-wide operational switches, kill-switch circuit breakers, maintenance modes, and rate-limiting limits.
          </p>
        </div>
      </div>

      {toastMsg && (
        <div className="admin-alert admin-alert-info">
          <CheckCircle2 size={16} className="text-success" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Critical Switches Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">Critical Global Feature Switches</h3>
            <p className="admin-card-subtitle">Immediate platform-wide circuit breakers. Changes take effect across all tenancies.</p>
          </div>
          <span className="admin-data-pill">Emergency Controls</span>
        </div>

        <div className="admin-switches-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* AI Assistant Global Switch */}
          <div
            className="admin-switch-row"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Power size={16} className={settings.globalAiEnabled ? 'text-success' : 'text-danger'} />
                <span>Global Gemini AI Assistant</span>
                <span className={`admin-badge ${settings.globalAiEnabled ? 'admin-badge-active' : 'admin-badge-suspended'}`}>
                  {settings.globalAiEnabled ? 'Operational' : 'Halted'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                When disabled, all conversational finance assistant endpoints return HTTP 503.
              </div>
            </div>
            <AdminButton
              variant={settings.globalAiEnabled ? 'danger' : 'primary'}
              size="sm"
              onClick={() =>
                setPendingSwitch({
                  key: 'globalAiEnabled',
                  label: 'Global AI Assistant',
                  currentValue: settings.globalAiEnabled,
                })
              }
            >
              {settings.globalAiEnabled ? 'Disable AI Engine' : 'Enable AI Engine'}
            </AdminButton>
          </div>

          {/* Email Dispatch Global Switch */}
          <div
            className="admin-switch-row"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} className={settings.globalEmailEnabled ? 'text-success' : 'text-danger'} />
                <span>Global Email Dispatch Relay</span>
                <span className={`admin-badge ${settings.globalEmailEnabled ? 'admin-badge-active' : 'admin-badge-suspended'}`}>
                  {settings.globalEmailEnabled ? 'Active' : 'Paused'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                Halt transactional and notification outgoing emails via SES during mail server incident.
              </div>
            </div>
            <AdminButton
              variant={settings.globalEmailEnabled ? 'danger' : 'primary'}
              size="sm"
              onClick={() =>
                setPendingSwitch({
                  key: 'globalEmailEnabled',
                  label: 'Global Email Dispatch',
                  currentValue: settings.globalEmailEnabled,
                })
              }
            >
              {settings.globalEmailEnabled ? 'Pause Email Relay' : 'Resume Email Relay'}
            </AdminButton>
          </div>

          {/* Automated Reminders Switch */}
          <div
            className="admin-switch-row"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BellRing size={16} className={settings.automaticRemindersEnabled ? 'text-success' : 'text-danger'} />
                <span>Automatic Payment Recovery Sequences</span>
                <span className={`admin-badge ${settings.automaticRemindersEnabled ? 'admin-badge-active' : 'admin-badge-suspended'}`}>
                  {settings.automaticRemindersEnabled ? 'Cron Active' : 'Paused'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                Controls background automated WhatsApp, SMS, and email payment reminder scheduler.
              </div>
            </div>
            <AdminButton
              variant={settings.automaticRemindersEnabled ? 'danger' : 'primary'}
              size="sm"
              onClick={() =>
                setPendingSwitch({
                  key: 'automaticRemindersEnabled',
                  label: 'Automatic Reminders',
                  currentValue: settings.automaticRemindersEnabled,
                })
              }
            >
              {settings.automaticRemindersEnabled ? 'Pause Reminders' : 'Resume Reminders'}
            </AdminButton>
          </div>

          {/* New Signups Switch */}
          <div
            className="admin-switch-row"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={16} className={settings.newSignupsEnabled ? 'text-success' : 'text-danger'} />
                <span>New Tenant Business Registration</span>
                <span className={`admin-badge ${settings.newSignupsEnabled ? 'admin-badge-active' : 'admin-badge-closed'}`}>
                  {settings.newSignupsEnabled ? 'Open' : 'Closed'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                Close self-service registration to new business signups during high-traffic migrations.
              </div>
            </div>
            <AdminButton
              variant={settings.newSignupsEnabled ? 'danger' : 'primary'}
              size="sm"
              onClick={() =>
                setPendingSwitch({
                  key: 'newSignupsEnabled',
                  label: 'New Business Signups',
                  currentValue: settings.newSignupsEnabled,
                })
              }
            >
              {settings.newSignupsEnabled ? 'Close Signups' : 'Open Signups'}
            </AdminButton>
          </div>
        </div>
      </div>

      {/* Platform Configuration Parameters Form */}
      <form onSubmit={handleSaveConfig} className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">Default Operational Limits & Policies</h3>
            <p className="admin-card-subtitle">Platform-level quotas applied to newly provisioned tenancies</p>
          </div>
          <AdminButton
            type="submit"
            variant="primary"
            size="md"
            icon={<Save size={14} />}
            loading={isSaving}
            loadingText="Saving..."
          >
            Save Configuration
          </AdminButton>
        </div>

        <div className="admin-dashboard-content-grid">
          <div className="admin-form-group">
            <label className="admin-form-label">Default Free Trial Duration (Days)</label>
            <input
              type="number"
              value={settings.defaultTrialDays}
              onChange={(e) => setSettings((prev) => ({ ...prev, defaultTrialDays: Number(e.target.value) }))}
              className="admin-form-input"
              min={1}
              max={90}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">AI Daily Request Throttle (Per Org)</label>
            <input
              type="number"
              value={settings.aiDailyRateLimitPerOrg}
              onChange={(e) => setSettings((prev) => ({ ...prev, aiDailyRateLimitPerOrg: Number(e.target.value) }))}
              className="admin-form-input"
              min={100}
              max={100000}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Platform Session Timeout (Minutes)</label>
            <input
              type="number"
              value={settings.sessionTimeoutMinutes}
              onChange={(e) => setSettings((prev) => ({ ...prev, sessionTimeoutMinutes: Number(e.target.value) }))}
              className="admin-form-input"
              min={15}
              max={1440}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Global Maintenance Mode</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                id="maintenance-toggle"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings((prev) => ({ ...prev, maintenanceMode: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
              />
              <label htmlFor="maintenance-toggle" style={{ fontSize: '0.85rem', cursor: 'pointer', color: '#0f172a' }}>
                Enable Maintenance Banner across tenant applications
              </label>
            </div>
          </div>
        </div>

        {settings.maintenanceMode && (
          <div className="admin-form-group" style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            <label className="admin-form-label">Maintenance Notice Text</label>
            <input
              type="text"
              value={settings.maintenanceBannerText}
              onChange={(e) => setSettings((prev) => ({ ...prev, maintenanceBannerText: e.target.value }))}
              className="admin-form-input"
            />
          </div>
        )}
      </form>

      {/* Sensitive Switch Confirmation Modal */}
      {pendingSwitch && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setPendingSwitch(null)}
          title={`Confirm Global Switch: ${pendingSwitch.label}`}
          isDanger={pendingSwitch.currentValue}
          confirmLabel={pendingSwitch.currentValue ? 'Confirm Disable' : 'Confirm Enable'}
          description={`You are about to toggle "${pendingSwitch.label}" across ALL registered organizations. This change takes effect immediately.`}
          targetDetails={[
            { label: 'Platform Control', value: pendingSwitch.label },
            { label: 'Current State', value: pendingSwitch.currentValue ? 'Enabled' : 'Disabled' },
            { label: 'Target State', value: pendingSwitch.currentValue ? 'Disabled' : 'Enabled' },
          ]}
          requireReason={true}
          reasonLabel="Operational Reason (Required)"
          reasonPlaceholder="e.g. Scheduled maintenance, emergency mitigation, or test..."
          warningNote="Mutating global platform flags impacts active client sessions."
          onConfirm={handleConfirmSwitch}
        />
      )}
    </div>
  )
}
