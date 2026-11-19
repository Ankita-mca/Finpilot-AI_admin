import React, { useState } from 'react'
import {
  LayoutDashboard, Building2, Users, CreditCard, BarChart3,
  Bot, BellRing, Server, ScrollText, Bell, Settings, ShieldCheck,
  Lock, Layers, UserCog, ChevronLeft, ChevronRight, X, ExternalLink
} from 'lucide-react'
import type { AdminUser } from '../types/admin.types'

interface AdminSidebarProps {
  currentPath: string
  onNavigate: (path: string) => void
  user: AdminUser | null
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
  onRestrictedAttempt?: (moduleName: string) => void
}

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  path: string
  restricted?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

export default function AdminSidebar({
  currentPath,
  onNavigate,
  user,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  onRestrictedAttempt,
}: AdminSidebarProps) {
  const isSuperAdmin = user?.role === 'super_admin'
  const [restrictedNotice, setRestrictedNotice] = useState<string | null>(null)

  const sections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/admin/dashboard' },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'organizations', label: 'Organizations', icon: <Building2 size={18} />, path: '/admin/organizations' },
        { id: 'users', label: 'Customers', icon: <Users size={18} />, path: '/admin/users' },
        { id: 'subscriptions', label: 'Subscriptions', icon: <CreditCard size={18} />, path: '/admin/subscriptions' },
        { id: 'usage', label: 'Usage', icon: <BarChart3 size={18} />, path: '/admin/usage' },
      ],
    },
    {
      title: 'MONITORING',
      items: [
        { id: 'ai-monitoring', label: 'AI Monitoring', icon: <Bot size={18} />, path: '/admin/ai-monitoring' },
        { id: 'reminders', label: 'Reminders', icon: <BellRing size={18} />, path: '/admin/reminders' },
        { id: 'operations', label: 'Operations', icon: <Server size={18} />, path: '/admin/operations' },
        { id: 'audit-logs', label: 'Audit Logs', icon: <ScrollText size={18} />, path: '/admin/audit-logs' },
      ],
    },
    {
      title: 'CONTROL',
      items: [
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, path: '/admin/notifications' },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} />, path: '/admin/settings' },
        { id: 'support-access', label: 'Support Access', icon: <ShieldCheck size={18} />, path: '/admin/support-access' },
      ],
    },
    {
      title: 'SUPER ADMIN RESTRICTED',
      items: [
        { id: 'plans', label: 'Plans', icon: <Layers size={18} />, path: '/admin/plans', restricted: !isSuperAdmin },
        { id: 'staff', label: 'Staff Management', icon: <UserCog size={18} />, path: '/admin/staff', restricted: !isSuperAdmin },
      ],
    },
  ]

  const handleItemClick = (item: NavItem) => {
    if (item.restricted) {
      const msg = `Super Admin Restricted: "${item.label}" is inaccessible to Platform Admin role.`
      setRestrictedNotice(msg)
      if (onRestrictedAttempt) {
        onRestrictedAttempt(item.label)
      }
      setTimeout(() => setRestrictedNotice(null), 4000)
      return
    }

    onNavigate(item.path)
    if (isMobileOpen && onCloseMobile) {
      onCloseMobile()
    }
  }

  const roleLabel = 'SUPER ADMIN'

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="admin-sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand & Portal Label */}
        <div className="admin-sidebar-brand">
          <div className="admin-brand-logo">
            <span className="admin-brand-icon" title="FinPilot AI">FP</span>
            {!isCollapsed && (
              <div className="admin-brand-info">
                <div className="admin-brand-title">FinPilot AI</div>
                <div className="admin-brand-subtitle">Platform Control Center</div>
              </div>
            )}
          </div>
          {/* Mobile close button */}
          {isMobileOpen && (
            <button
              type="button"
              className="admin-sidebar-mobile-close"
              onClick={onCloseMobile}
              title="Close Navigation"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Restricted Notice Toast inside sidebar */}
        {restrictedNotice && (
          <div className="admin-sidebar-alert" role="alert">
            <Lock size={14} className="flex-shrink-0" />
            <span>{restrictedNotice}</span>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="admin-sidebar-nav" aria-label="Platform Admin Navigation">
          {sections.map((section) => (
            <div key={section.title} className="admin-nav-section">
              {!isCollapsed && (
                <div className="admin-nav-section-title">{section.title}</div>
              )}
              {isCollapsed && (
                <div className="admin-nav-section-divider" title={section.title} />
              )}
              <ul className="admin-nav-list">
                {section.items.map((item) => {
                  const isActive = currentPath.split('?')[0] === item.path
                  return (
                    <li key={item.id} className="admin-nav-item">
                      <button
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className={`admin-nav-btn ${isActive ? 'active' : ''} ${item.restricted ? 'is-restricted' : ''}`}
                        title={isCollapsed ? `${item.label}${item.restricted ? ' (Super Admin Only)' : ''}` : undefined}
                      >
                        <span className="admin-nav-icon">{item.icon}</span>
                        {!isCollapsed && (
                          <span className="admin-nav-label">{item.label}</span>
                        )}
                        {!isCollapsed && item.restricted && (
                          <span title="Super Admin Restricted" className="admin-restricted-lock">
                            <Lock size={12} />
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Profile & Role Badge at the Bottom */}
        <div className="admin-sidebar-bottom">
          {/* Collapse Toggle Button (Desktop) */}
          {onToggleCollapse && (
            <div className="admin-sidebar-collapse-wrapper">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="admin-collapse-toggle-btn"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                {!isCollapsed && <span className="collapse-text">Collapse Sidebar</span>}
              </button>
            </div>
          )}

          {/* User Profile Card */}
          <div className="admin-sidebar-user-profile">
            <div className="admin-sidebar-user-avatar" title={user?.full_name || 'Platform Admin'}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
            </div>
            {!isCollapsed && (
              <div className="admin-sidebar-user-details">
                <div className="admin-sidebar-user-name" title={user?.full_name || 'Platform Admin'}>
                  {user?.full_name || 'Platform Admin'}
                </div>
                <div className="admin-sidebar-user-email" title={user?.email || 'admin@finpilot.ai'}>
                  {user?.email || 'admin@finpilot.ai'}
                </div>
                <div className="admin-sidebar-role-badge">
                  <span className="role-dot" />
                  <span>{roleLabel}</span>
                </div>
              </div>
            )}
          </div>

          {/* Switch / Return to Tenant App */}
          {!isCollapsed && (
            <div className="admin-sidebar-switch-tenant">
              <button
                type="button"
                onClick={() => { window.location.href = '/' }}
                className="admin-switch-tenant-btn"
                title="Return to Business/Tenant Application"
              >
                <span>Return to Tenant App</span>
                <ExternalLink size={13} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
