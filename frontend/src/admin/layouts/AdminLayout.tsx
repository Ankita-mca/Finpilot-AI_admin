import React, { useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'
import AdminModal from '../components/AdminModal'
import { ShieldAlert } from 'lucide-react'
import type { AdminUser } from '../types/admin.types'

interface AdminLayoutProps {
  user: AdminUser | null
  currentPath: string
  onNavigate: (path: string) => void
  onLogout: () => void
  children: React.ReactNode
  title?: string
  subtitle?: string
  breadcrumb?: string
}

export default function AdminLayout({
  user,
  currentPath,
  onNavigate,
  onLogout,
  children,
  title = 'Platform Control Center',
  subtitle = 'Welcome to your platform control center.',
  breadcrumb,
}: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('finpilot_admin_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [restrictedModalModule, setRestrictedModalModule] = useState<string | null>(null)

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('finpilot_admin_sidebar_collapsed', String(next))
      } catch {
        // no-op
      }
      return next
    })
  }

  const handleRestrictedAttempt = (moduleName: string) => {
    setRestrictedModalModule(moduleName)
  }

  const getBreadcrumb = () => {
    if (breadcrumb && breadcrumb !== 'Overview / Dashboard') {
      return breadcrumb
    }
    const path = currentPath.split('?')[0]
    switch (path) {
      case '/admin/dashboard':
        return 'Platform Admin / Overview / Dashboard'
      case '/admin/organizations':
        return 'Platform Admin / Management / Organizations'
      case '/admin/users':
        return 'Platform Admin / Management / Customers'
      case '/admin/subscriptions':
        return 'Platform Admin / Management / Subscriptions'
      case '/admin/usage':
        return 'Platform Admin / Management / Usage'
      case '/admin/ai-monitoring':
        return 'Platform Admin / Monitoring / AI Monitoring'
      case '/admin/reminders':
        return 'Platform Admin / Monitoring / Reminders'
      case '/admin/operations':
        return 'Platform Admin / Monitoring / Operations'
      case '/admin/audit-logs':
        return 'Platform Admin / Monitoring / Audit Logs'
      case '/admin/notifications':
        return 'Platform Admin / Control / Notifications'
      case '/admin/settings':
        return 'Platform Admin / Control / Settings'
      case '/admin/support-access':
        return 'Platform Admin / Control / Support Access'
      case '/admin/plans':
        return 'Platform Admin / Super Admin Restricted / Plans'
      case '/admin/staff':
        return 'Platform Admin / Super Admin Restricted / Staff Management'
      default:
        return 'Platform Admin / Overview / Dashboard'
    }
  }

  return (
    <div className={`admin-app-root ${isCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {/* Sidebar with dark navy theme and soft green active accent */}
      <AdminSidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        user={user}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onRestrictedAttempt={handleRestrictedAttempt}
      />

      {/* Main Content Wrapper */}
      <div className="admin-main-wrapper">
        <AdminHeader
          user={user}
          onLogout={onLogout}
          currentTitle={title}
          subtitle={subtitle}
          breadcrumb={getBreadcrumb()}
          unreadCount={3}
          onToggleMobileMenu={() => setIsMobileOpen((prev) => !prev)}
          onNavigate={onNavigate}
        />

        <main className="admin-content-area" id="admin-main-content">
          {children}
        </main>
      </div>

      {/* Restricted Access Modal for Platform Admin */}
      <AdminModal
        isOpen={!!restrictedModalModule}
        onClose={() => setRestrictedModalModule(null)}
        title="Super Admin Access Required"
        subtitle={`Module: ${restrictedModalModule}`}
        isDanger={true}
        cancelLabel="Close"
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: '#fee2e2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#0f172a' }}>
              Access Denied: Restricted Module
            </p>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
              The <strong>{restrictedModalModule}</strong> module governs platform tier definitions, billing plan configuration, and platform staff permissions. This section is strictly restricted to <strong>Super Admin</strong> credentials and is not accessible with Platform Admin role.
            </p>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '0.65rem 0.85rem',
              fontSize: '0.8rem',
              color: '#475569'
            }}>
              Active Role: <strong>Platform Admin</strong> (Policy: Least Privilege Enforcement)
            </div>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}
