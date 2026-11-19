import { useState, useEffect } from 'react'
import App from '../App'
import { useAdminAuth } from '../admin/hooks/useAdminAuth'
import RoleSelection from '../admin/pages/auth/RoleSelection'
import AdminLogin from '../admin/pages/auth/AdminLogin'
import Dashboard from '../admin/pages/Dashboard'
import Organizations from '../admin/pages/Organizations'
import OrganizationDetail from '../admin/pages/OrganizationDetail'
import Users from '../admin/pages/Users'
import Subscriptions from '../admin/pages/Subscriptions'
import Usage from '../admin/pages/Usage'
import AIMonitoring from '../admin/pages/AIMonitoring'
import Reminders from '../admin/pages/Reminders'
import Operations from '../admin/pages/Operations'
import AuditLogs from '../admin/pages/AuditLogs'
import Notifications from '../admin/pages/Notifications'
import Settings from '../admin/pages/Settings'
import SupportAccess from '../admin/pages/SupportAccess'
import Plans from '../admin/pages/Plans'
import StaffRoles from '../admin/pages/StaffRoles'
import AdminLayout from '../admin/layouts/AdminLayout'
import type { AdminRole } from '../admin/types/admin.types'
import '../admin/styles/admin.css'

function AdminPortal() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname.startsWith('/admin') ? (window.location.pathname + window.location.search) : '/admin'
  })

  const { adminUser, loading, error, login, logout, clearError } = useAdminAuth('platform_admin')

  // Listen to browser popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
  }

  const handleRoleSelected = (role: AdminRole) => {
    if (role === 'platform_admin') {
      navigate('/admin/login')
    }
  }

  const handleLoginSuccess = async (email: string, pass: string) => {
    await login(email, pass)
    navigate('/admin/dashboard')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/admin')
  }

  // Parse path and query parameters
  const pathname = currentPath.split('?')[0]
  const queryString = currentPath.split('?')[1] || ''
  const searchParams = new URLSearchParams(queryString)
  const selectedOrgId = searchParams.get('id')

  // 1. Initial Session Loading
  if (loading && pathname === '/admin/dashboard') {
    return (
      <div className="admin-auth-container">
        <div style={{ textAlign: 'center', color: '#0f172a' }}>
          <div className="admin-spinner" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⟳</div>
          <div>Verifying platform session...</div>
        </div>
      </div>
    )
  }

  // Helper for rendering login if not authenticated
  const requireAuth = (content: React.ReactNode) => {
    if (!adminUser) {
      return (
        <AdminLogin
          onLogin={handleLoginSuccess}
          onBackToRoles={() => navigate('/admin')}
          onClearError={clearError}
          error={error}
          loading={loading}
        />
      )
    }
    return content
  }

  // 2. Unauthenticated Routes
  if (pathname === '/admin' || pathname === '/admin/') {
    return <RoleSelection onSelectRole={handleRoleSelected} />
  }

  if (pathname === '/admin/login') {
    if (adminUser) {
      navigate('/admin/dashboard')
    }
    return (
      <AdminLogin
        onLogin={handleLoginSuccess}
        onBackToRoles={() => navigate('/admin')}
        onClearError={clearError}
        error={error}
        loading={loading}
      />
    )
  }

  // 3. Protected Module Routes
  // Overview
  if (pathname === '/admin/dashboard') {
    return requireAuth(
      <AdminLayout
        user={adminUser!}
        currentPath="/admin/dashboard"
        onNavigate={navigate}
        onLogout={handleLogout}
        breadcrumb="Platform Admin / Overview / Dashboard"
      >
        <Dashboard user={adminUser!} onNavigate={navigate} />
      </AdminLayout>
    )
  }

  // Management: Organizations
  if (pathname === '/admin/organizations') {
    return requireAuth(
      selectedOrgId ? (
        <AdminLayout
          user={adminUser!}
          currentPath="/admin/organizations"
          onNavigate={navigate}
          onLogout={handleLogout}
          title="Organization Details"
        >
          <OrganizationDetail
            id={selectedOrgId}
            onBack={() => navigate('/admin/organizations')}
          />
        </AdminLayout>
      ) : (
        <AdminLayout
          user={adminUser!}
          currentPath="/admin/organizations"
          onNavigate={navigate}
          onLogout={handleLogout}
          title="Organizations"
        >
          <Organizations
            onSelectOrg={(orgId) => navigate(`/admin/organizations?id=${orgId}`)}
          />
        </AdminLayout>
      )
    )
  }

  // Management: Customers
  if (pathname === '/admin/users') {
    return requireAuth(
      <AdminLayout
        user={adminUser!}
        currentPath="/admin/users"
        onNavigate={navigate}
        onLogout={handleLogout}
        title="Customers Management"
      >
        <Users />
      </AdminLayout>
    )
  }

  // Management: Subscriptions
  if (pathname === '/admin/subscriptions') {
    return requireAuth(
      <AdminLayout
        user={adminUser!}
        currentPath="/admin/subscriptions"
        onNavigate={navigate}
        onLogout={handleLogout}
        title="Subscriptions"
      >
        <Subscriptions />
      </AdminLayout>
    )
  }

  // Management: Usage
  if (pathname === '/admin/usage') {
    return requireAuth(
      <AdminLayout
        user={adminUser!}
        currentPath="/admin/usage"
        onNavigate={navigate}
        onLogout={handleLogout}
        title="Platform Usage"
      >
        <Usage />
      </AdminLayout>
    )
  }

  // Monitoring: AI Monitoring
  if (pathname === '/admin/ai-monitoring') {
    return requireAuth(
      <AdminLayout
        user={adminUser!}
        currentPath="/admin/ai-monitoring"
        onNavigate={navigate}
        onLogout={handleLogout}
        title="AI Monitoring"
      >
        <AIMonitoring />
      </AdminLayout>
    )
  }

  // Monitoring: Reminders
  if (pathname === '/admin/reminders') {
    return requireAuth(
      <AdminLayout
        user={adminUser!}
        currentPath="/admin/reminders"
        onNavigate={navigate}
        onLogout={handleLogout}
        title="Payment Reminders Engine"
      >
        <Reminders />
      </AdminLayout>
    )
  }

  // Monitoring: Operations
  if (pathname === '/admin/operations') {
    return requireAuth(
      <AdminLayout
        user={adminUser!}
        currentPath="/admin/operations"
        onNavigate={navigate}
        onLogout={handleLogout}
        title="Background Operations"
      >
        <Operations />
      </AdminLayout>
    )
  }

  // Monitoring: Audit Logs
  if (pathname === '/admin/audit-logs') {
    return requireAuth(
      <AdminLayout
        user={adminUser!}
        currentPath="/admin/audit-logs"
        onNavigate={navigate}
        onLogout={handleLogout}
        title="Audit Logs"
      >
        <AuditLogs />
      </AdminLayout>
    )
  }

  // Control: Notifications
  if (pathname === '/admin/notifications') {
    return requireAuth(
      <AdminLayout
        user={adminUser!}
        currentPath="/admin/notifications"
        onNavigate={navigate}
        onLogout={handleLogout}
        title="Platform Notifications"
      >
        <Notifications onNavigate={navigate} />
      </AdminLayout>
    )
  }

  // Control: Settings
  if (pathname === '/admin/settings') {
    return requireAuth(
      <AdminLayout
        user={adminUser!}
        currentPath="/admin/settings"
        onNavigate={navigate}
        onLogout={handleLogout}
        title="Global Settings"
      >
        <Settings />
      </AdminLayout>
    )
  }

  // Control: Support Access
  if (pathname === '/admin/support-access') {
    return requireAuth(
      <AdminLayout
        user={adminUser!}
        currentPath="/admin/support-access"
        onNavigate={navigate}
        onLogout={handleLogout}
        title="Support Access (Zero-Trust)"
      >
        <SupportAccess />
      </AdminLayout>
    )
  }

  // Super Admin Restricted: Plans
  if (pathname === '/admin/plans') {
    if (adminUser && adminUser.role !== 'super_admin') {
      navigate('/admin/dashboard')
    }
    return requireAuth(
      <AdminLayout
        user={adminUser!}
        currentPath="/admin/plans"
        onNavigate={navigate}
        onLogout={handleLogout}
        title="Subscription Plans"
        breadcrumb="Control / Plans"
      >
        <Plans user={adminUser!} />
      </AdminLayout>
    )
  }

  // Super Admin Restricted: Staff
  if (pathname === '/admin/staff') {
    if (adminUser && adminUser.role !== 'super_admin') {
      navigate('/admin/dashboard')
    }
    return requireAuth(
      <AdminLayout
        user={adminUser!}
        currentPath="/admin/staff"
        onNavigate={navigate}
        onLogout={handleLogout}
        title="Staff & Role Management"
        breadcrumb="Control / Staff Management"
      >
        <StaffRoles user={adminUser!} />
      </AdminLayout>
    )
  }

  // Fallback for unmatched /admin routes -> redirect or show role selection
  return <RoleSelection onSelectRole={handleRoleSelected} />
}

export default function AppRouter() {
  const [isAdmin, setIsAdmin] = useState(() => window.location.pathname.startsWith('/admin'))

  useEffect(() => {
    const handlePopState = () => {
      setIsAdmin(window.location.pathname.startsWith('/admin'))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (isAdmin) {
    return <AdminPortal />
  }

  return <App />
}
