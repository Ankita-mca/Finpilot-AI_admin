import React, { useState } from 'react'
import { ShieldCheck, ServerCog, Headphones, LineChart, ArrowRight, ShieldAlert } from 'lucide-react'
import { ADMIN_ROLES } from '../../permissions/adminRoles'
import type { AdminRole } from '../../permissions/adminRoles'

interface RoleSelectionProps {
  onSelectRole: (role: AdminRole) => void
}

export default function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  const [notice, setNotice] = useState<string | null>(null)

  const rolesConfig: { id: AdminRole; icon: React.ReactNode; isReady: boolean }[] = [
    {
      id: 'super_admin',
      icon: <ShieldCheck size={28} className="role-card-icon super-admin" />,
      isReady: true,
    },
    {
      id: 'support_agent',
      icon: <Headphones size={28} className="role-card-icon support-agent" />,
      isReady: false,
    },
    {
      id: 'analyst',
      icon: <LineChart size={28} className="role-card-icon analyst" />,
      isReady: false,
    },
  ]

  const handleCardClick = (roleId: AdminRole, isReady: boolean) => {
    if (roleId === 'super_admin' || isReady) {
      setNotice(null)
      onSelectRole(roleId)
    } else {
      setNotice(`The ${ADMIN_ROLES[roleId].name} portal is restricted in this release. Please select Super Admin.`)
    }
  }

  return (
    <div className="admin-auth-container">
      <div className="admin-role-selection-wrapper">
        {/* Header / Brand */}
        <div className="admin-selection-header">
          <div className="admin-logo-pill">
            <span className="admin-logo-symbol">FP</span>
            <span className="admin-logo-text">FinPilot AI</span>
          </div>
          <h1 className="admin-selection-title">Platform Control Center</h1>
          <p className="admin-selection-subtitle">
            Select your staff operational role to proceed to the dedicated sign-in portal.
          </p>
          <div className="admin-selection-notice-badge">
            <ShieldAlert size={14} />
            <span>Role selection determines your login gateway. Permissions are verified server-side upon authentication.</span>
          </div>
        </div>

        {notice && (
          <div className="admin-alert admin-alert-warning">
            {notice}
          </div>
        )}

        {/* 4 Role Cards Grid */}
        <div className="admin-roles-grid">
          {rolesConfig.map(({ id, icon, isReady }) => {
            const role = ADMIN_ROLES[id]
            const isSuperAdmin = id === 'super_admin'
            return (
              <div
                key={id}
                onClick={() => handleCardClick(id, isReady)}
                className={`admin-role-card ${isSuperAdmin ? 'featured' : 'disabled-role'}`}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleCardClick(id, isReady)
                }}
              >
                <div className="admin-role-card-top">
                  <div className="role-icon-box">{icon}</div>
                  {isSuperAdmin ? (
                    <span className="admin-role-status-pill ready">Active Portal</span>
                  ) : (
                    <span className="admin-role-status-pill upcoming">Upcoming</span>
                  )}
                </div>

                <h3 className="admin-role-card-name">{role.name}</h3>
                <p className="admin-role-card-tagline">{role.tagline}</p>
                <p className="admin-role-card-desc">{role.description}</p>

                <div className="admin-role-card-footer">
                  <span className="role-action-text">
                    {isSuperAdmin ? 'Access Super Admin' : 'Portal restricted'}
                  </span>
                  <ArrowRight size={16} className="role-arrow" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Back to Tenant App Link */}
        <div className="admin-selection-footer">
          <a href="/" className="admin-back-link">
            &larr; Return to FinPilot AI Tenant Workspace
          </a>
        </div>
      </div>
    </div>
  )
}
