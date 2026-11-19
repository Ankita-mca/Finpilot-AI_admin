import React, { useState } from 'react'
import {
  Layers, Lock, Plus, Edit, Archive, CheckCircle2,
  AlertTriangle, Users, FileText, Zap, ShieldAlert
} from 'lucide-react'
import AdminStatCard from '../components/AdminStatCard'
import AdminButton from '../components/AdminButton'
import AdminConfirmDialog from '../components/AdminConfirmDialog'
import { MOCK_PLANS, type PlanRecord } from '../services/mockDataService'
import type { AdminUser, PlanTier } from '../types/admin.types'

interface PlansProps {
  user: AdminUser | null
}

export default function Plans({ user }: PlansProps) {
  const [plans, setPlans] = useState<PlanRecord[]>(MOCK_PLANS)
  const isSuperAdmin = user?.role === 'super_admin'

  const [editModalPlan, setEditModalPlan] = useState<PlanRecord | null>(null)
  const [newPlanModal, setNewPlanModal] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<PlanRecord | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Edit form state
  const [formPriceMonthly, setFormPriceMonthly] = useState(4999)
  const [formPriceAnnual, setFormPriceAnnual] = useState(49990)
  const [formMaxInvoices, setFormMaxInvoices] = useState(500)
  const [formMaxTokens, setFormMaxTokens] = useState(500000)

  const handleOpenEdit = (plan: PlanRecord) => {
    setEditModalPlan(plan)
    setFormPriceMonthly(plan.priceMonthlyInr)
    setFormPriceAnnual(plan.priceAnnualInr)
    setFormMaxInvoices(plan.maxInvoicesMonth)
    setFormMaxTokens(plan.maxAiTokensMonth)
  }

  const handleSaveEdit = (reason?: string) => {
    if (!editModalPlan) return
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === editModalPlan.id) {
          return {
            ...p,
            priceMonthlyInr: formPriceMonthly,
            priceAnnualInr: formPriceAnnual,
            maxInvoicesMonth: formMaxInvoices,
            maxAiTokensMonth: formMaxTokens,
          }
        }
        return p
      })
    )
    setToastMsg(
      `Plan "${editModalPlan.name}" updated${reason ? ` (${reason})` : ''}. Applies to all new subscriptions. (Demo action)`
    )
    setEditModalPlan(null)
    setTimeout(() => setToastMsg(null), 5000)
  }

  const handleArchive = (reason?: string) => {
    if (!archiveTarget) return
    setPlans((prev) =>
      prev.map((p) => (p.id === archiveTarget.id ? { ...p, status: 'archived' } : p))
    )
    setToastMsg(
      `Plan "${archiveTarget.name}" archived from catalog${reason ? ` (${reason})` : ''}. Existing subscribers preserved. (Demo action)`
    )
    setArchiveTarget(null)
    setTimeout(() => setToastMsg(null), 5000)
  }

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 className="admin-page-heading">Commercial Subscription Plans</h2>
            <span className="admin-badge admin-badge-pastDue" style={{ fontSize: '0.72rem' }}>
              <Lock size={12} /> Super Admin Only
            </span>
          </div>
          <p className="admin-page-subheading">
            Manage billing catalog tiers, resource ceilings, pricing schedules, and preview subscriber impact before modifying limits.
          </p>
        </div>
        <div className="admin-page-actions">
          {isSuperAdmin ? (
            <AdminButton
              variant="primary"
              size="md"
              icon={<Plus size={14} />}
              onClick={() => setNewPlanModal(true)}
            >
              Create New Tier
            </AdminButton>
          ) : (
            <div className="admin-data-source-pill">
              <Lock size={12} className="text-warning" />
              <span>Restricted: Read-Only Overview for Platform Admin</span>
            </div>
          )}
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="admin-privacy-banner">
          <Lock size={16} className="text-warning flex-shrink-0" />
          <div className="privacy-text">
            <strong>Super Admin Privilege Required:</strong> As a Platform Admin, you have read-only visibility into plan tiers and subscriber counts. Creating, editing prices, or altering usage limits requires Super Admin authorization.
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="admin-alert admin-alert-info">
          <CheckCircle2 size={16} className="text-success" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="admin-roles-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {plans.map((plan) => (
          <div key={plan.id} className="admin-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className={`admin-plan-badge tier-${plan.tier}`}>{plan.tier.toUpperCase()}</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 0.2rem 0' }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>{plan.description}</p>
              </div>
              <span className={`admin-badge ${plan.status === 'active' ? 'admin-badge-active' : 'admin-badge-closed'}`}>
                {plan.status}
              </span>
            </div>

            {/* Pricing Section */}
            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                ₹{plan.priceMonthlyInr.toLocaleString('en-IN')}<span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}> / month</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                ₹{plan.priceAnnualInr.toLocaleString('en-IN')} billed annually (Save 17%)
              </div>
            </div>

            {/* Quota Limits */}
            <div className="admin-info-definition-list" style={{ gap: '0.5rem', fontSize: '0.82rem' }}>
              <div className="admin-info-item" style={{ paddingBottom: '0.35rem' }}>
                <span className="info-label"><Users size={13} /> Max Customers</span>
                <span className="info-value">{plan.maxUsers} seats</span>
              </div>
              <div className="admin-info-item" style={{ paddingBottom: '0.35rem' }}>
                <span className="info-label"><FileText size={13} /> Monthly Invoices</span>
                <span className="info-value">{plan.maxInvoicesMonth.toLocaleString()} docs</span>
              </div>
              <div className="admin-info-item" style={{ paddingBottom: '0.35rem' }}>
                <span className="info-label"><Zap size={13} /> Gemini AI Tokens</span>
                <span className="info-value">{(plan.maxAiTokensMonth / 1000).toFixed(0)}k tokens</span>
              </div>
            </div>

            {/* Subscriber Count Footer */}
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Subscribers
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {plan.activeSubscribers} organizations
                </div>
              </div>

              {isSuperAdmin && (
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <AdminButton
                    variant="outline"
                    size="sm"
                    icon={<Edit size={13} />}
                    onClick={() => handleOpenEdit(plan)}
                    tooltip="Edit Plan Quotas"
                  >
                    Edit
                  </AdminButton>
                  {plan.status === 'active' && (
                    <AdminButton
                      variant="danger"
                      size="sm"
                      icon={<Archive size={13} />}
                      onClick={() => setArchiveTarget(plan)}
                      tooltip="Archive Plan"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Plan & Subscriber Impact Modal */}
      {editModalPlan && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setEditModalPlan(null)}
          title={`Edit Plan — ${editModalPlan.name}`}
          confirmLabel="Commit Changes"
          description={`Modifying plan quotas affects ${editModalPlan.activeSubscribers} active subscribers upon their next renewal cycle.`}
          targetDetails={[
            { label: 'Plan Tier', value: editModalPlan.tier.toUpperCase() },
            { label: 'Subscribers Impacted', value: `${editModalPlan.activeSubscribers} organizations` },
          ]}
          requireReason={true}
          reasonLabel="Pricing & Limit Change Justification"
          reasonPlaceholder="e.g. Annual indexing, adjusted model costs, or expanded quotas..."
          onConfirm={handleSaveEdit}
        >
          <div className="admin-form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="admin-form-label">Monthly Price (INR)</label>
            <input
              type="number"
              value={formPriceMonthly}
              onChange={(e) => setFormPriceMonthly(Number(e.target.value))}
              className="admin-form-input"
            />
          </div>

          <div className="admin-form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="admin-form-label">Annual Price (INR)</label>
            <input
              type="number"
              value={formPriceAnnual}
              onChange={(e) => setFormPriceAnnual(Number(e.target.value))}
              className="admin-form-input"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Monthly Invoice Document Limit</label>
            <input
              type="number"
              value={formMaxInvoices}
              onChange={(e) => setFormMaxInvoices(Number(e.target.value))}
              className="admin-form-input"
            />
          </div>
        </AdminConfirmDialog>
      )}

      {/* Archive Modal */}
      {archiveTarget && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setArchiveTarget(null)}
          title={`Archive Plan: ${archiveTarget.name}`}
          isDanger={true}
          confirmLabel="Archive Plan"
          description={`Archiving removes "${archiveTarget.name}" from new signups. Existing ${archiveTarget.activeSubscribers} active organizations remain unaffected.`}
          targetDetails={[
            { label: 'Plan Name', value: archiveTarget.name },
            { label: 'Current Subscribers', value: `${archiveTarget.activeSubscribers} orgs` },
          ]}
          requireReason={true}
          reasonLabel="Reason for Archiving Tier"
          reasonPlaceholder="e.g. Deprecated tier, replaced by newer plans..."
          onConfirm={handleArchive}
        />
      )}
    </div>
  )
}
