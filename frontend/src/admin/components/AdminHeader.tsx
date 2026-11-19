import React, { useState, useEffect, useRef } from 'react'
import {
  LogOut, Bell, Search, Shield, ChevronDown,
  Menu, ExternalLink, SlidersHorizontal, Check, X,
  Building2, Users, CreditCard, Bot, Server, BellRing, ScrollText,
  AlertTriangle, ShieldCheck
} from 'lucide-react'
import type { AdminUser } from '../types/admin.types'

interface AdminHeaderProps {
  user: AdminUser | null
  onLogout: () => void
  breadcrumb?: string
  unreadCount?: number
  onToggleMobileMenu?: () => void
  onNavigate?: (path: string) => void
  currentTitle?: string
  subtitle?: string
}

interface SearchSuggestion {
  id: string
  title: string
  subtitle: string
  path: string
  icon: React.ReactNode
  category: string
}

export default function AdminHeader({
  user,
  onLogout,
  breadcrumb = 'Platform Admin / Overview / Dashboard',
  unreadCount = 3,
  onToggleMobileMenu,
  onNavigate,
}: AdminHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Navigation items for search suggestions
  const searchSuggestions: SearchSuggestion[] = [
    { id: 'dash', title: 'Platform Overview', subtitle: 'Live telemetry & system health', path: '/admin/dashboard', icon: <Server size={14} />, category: 'Overview' },
    { id: 'orgs', title: 'Organizations', subtitle: 'Manage registered businesses & tenancies', path: '/admin/organizations', icon: <Building2 size={14} />, category: 'Management' },
    { id: 'users', title: 'Customers Directory', subtitle: 'Customer accounts, roles & active sessions', path: '/admin/users', icon: <Users size={14} />, category: 'Management' },
    { id: 'subs', title: 'Subscriptions', subtitle: 'Commercial plans, renewals & trials', path: '/admin/subscriptions', icon: <CreditCard size={14} />, category: 'Management' },
    { id: 'ai', title: 'AI Monitoring', subtitle: 'Google Gemini token telemetry & kill switch', path: '/admin/ai-monitoring', icon: <Bot size={14} />, category: 'Monitoring' },
    { id: 'rem', title: 'Payment Reminders', subtitle: 'WhatsApp, SMS & email delivery health', path: '/admin/reminders', icon: <BellRing size={14} />, category: 'Monitoring' },
    { id: 'ops', title: 'Background Operations', subtitle: 'Celery queues, imports & sync tasks', path: '/admin/operations', icon: <Server size={14} />, category: 'Monitoring' },
    { id: 'audit', title: 'Audit Trail', subtitle: 'Immutable administrative security log', path: '/admin/audit-logs', icon: <ScrollText size={14} />, category: 'Monitoring' },
    { id: 'settings', title: 'Global Settings', subtitle: 'Platform switches & default limits', path: '/admin/settings', icon: <SlidersHorizontal size={14} />, category: 'Control' },
    { id: 'support', title: 'Support Access', subtitle: 'Time-limited ticket diagnostics', path: '/admin/support-access', icon: <ShieldCheck size={14} />, category: 'Control' },
  ]

  // Filter suggestions
  const filteredSuggestions = searchSuggestions.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
  })

  // Notifications preview items
  const recentAlerts = [
    {
      id: 'n1',
      title: 'Payment renewal failed for Apex Logistics',
      category: 'Billing',
      time: '12m ago',
      isWarning: true,
      path: '/admin/subscriptions',
    },
    {
      id: 'n2',
      title: 'AI quota threshold (84%) reached: Horizon Ventures',
      category: 'AI Telemetry',
      time: '45m ago',
      isWarning: true,
      path: '/admin/ai-monitoring',
    },
    {
      id: 'n3',
      title: 'New support access request: Ticket #FP-8921',
      category: 'Support',
      time: '2h ago',
      isWarning: false,
      path: '/admin/support-access',
    },
  ]

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false)
        setNotifOpen(false)
        setSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleNav = (path: string) => {
    setProfileOpen(false)
    setNotifOpen(false)
    setSearchOpen(false)
    if (onNavigate) {
      onNavigate(path)
    } else {
      window.location.href = path
    }
  }

  const roleText = user?.role === 'super_admin' ? 'Super Admin' : 'Platform Admin'
  const userDisplayName = user?.full_name || 'Platform Admin'
  const userDisplayEmail = user?.email || 'admin@finpilot.ai'

  // Parse breadcrumb trail
  const breadcrumbSegments = breadcrumb.includes('/')
    ? breadcrumb.split('/').map((s) => s.trim()).filter(Boolean)
    : ['Platform Admin', 'Overview', 'Dashboard']

  return (
    <header className="admin-header">
      {/* ── Left: Mobile Hamburger & Breadcrumb Trail ────────────────── */}
      <div className="admin-header-left">
        {onToggleMobileMenu && (
          <button
            type="button"
            className="admin-header-mobile-toggle admin-btn-icon admin-btn-sm"
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
            title="Open navigation menu"
          >
            <Menu size={18} />
          </button>
        )}

        <nav className="admin-header-breadcrumb" aria-label="Breadcrumb">
          {breadcrumbSegments.map((segment, index) => {
            const isLast = index === breadcrumbSegments.length - 1
            return (
              <React.Fragment key={index}>
                {index > 0 && <span className="crumb-separator">/</span>}
                <span className={isLast ? 'crumb-current' : 'crumb-segment'}>
                  {segment}
                </span>
              </React.Fragment>
            )
          })}
        </nav>
      </div>

      {/* ── Right: Global Search, Notifications, Profile Dropdown ─────── */}
      <div className="admin-header-right">
        {/* 1. Global Search Field with Suggestions Dropdown */}
        <div className="admin-header-search" ref={searchRef}>
          <Search size={15} className="admin-search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search platform modules, records..."
            className="admin-search-input"
            value={searchQuery}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (!searchOpen) setSearchOpen(true)
            }}
            aria-label="Search platform records"
          />
          {searchQuery && (
            <button
              type="button"
              className="admin-search-clear-btn"
              onClick={() => {
                setSearchQuery('')
                setSearchOpen(false)
              }}
              title="Clear search query"
            >
              <X size={13} />
            </button>
          )}

          {/* Search Suggestions Dropdown */}
          {searchOpen && (
            <div className="admin-search-suggestions-dropdown" role="menu">
              <div className="search-suggestions-header">
                <span>{searchQuery.trim() ? 'Matching Modules' : 'Quick Jump'}</span>
                <span className="search-shortcut-hint">ESC to close</span>
              </div>
              <div className="search-suggestions-list">
                {filteredSuggestions.length === 0 ? (
                  <div className="search-no-results">No platform modules match &quot;{searchQuery}&quot;</div>
                ) : (
                  filteredSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="search-suggestion-item"
                      onClick={() => handleNav(item.path)}
                    >
                      <div className="suggestion-icon-wrap">{item.icon}</div>
                      <div className="suggestion-content">
                        <div className="suggestion-title-row">
                          <span className="suggestion-title">{item.title}</span>
                          <span className="suggestion-category">{item.category}</span>
                        </div>
                        <span className="suggestion-sub">{item.subtitle}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Notifications Icon Button with Dropdown Preview */}
        <div className="admin-header-notif-wrapper" ref={notifRef}>
          <button
            type="button"
            className={`admin-header-icon-btn ${notifOpen ? 'active' : ''}`}
            title={`${unreadCount} Unread Notifications`}
            onClick={() => {
              setNotifOpen((prev) => !prev)
              setProfileOpen(false)
              setSearchOpen(false)
            }}
            aria-label={`${unreadCount} Unread Platform Notifications`}
            aria-expanded={notifOpen}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="admin-header-notif-pill" aria-label={`${unreadCount} unread`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Quick Preview Dropdown */}
          {notifOpen && (
            <div className="admin-notif-dropdown" role="menu">
              <div className="notif-dropdown-header">
                <div className="notif-header-title">
                  <span>Notifications</span>
                  {unreadCount > 0 && <span className="notif-count-badge">{unreadCount} new</span>}
                </div>
                <button
                  type="button"
                  className="notif-header-action"
                  onClick={() => handleNav('/admin/notifications')}
                >
                  View All
                </button>
              </div>

              <div className="notif-dropdown-list">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="notif-dropdown-item"
                    onClick={() => handleNav(alert.path)}
                    role="menuitem"
                  >
                    <div className="notif-item-icon">
                      {alert.isWarning ? (
                        <AlertTriangle size={15} className="text-warning" />
                      ) : (
                        <Bell size={15} className="text-info" />
                      )}
                    </div>
                    <div className="notif-item-content">
                      <div className="notif-item-title">{alert.title}</div>
                      <div className="notif-item-meta">
                        <span className="notif-item-cat">{alert.category}</span>
                        <span className="notif-dot">•</span>
                        <span className="notif-item-time">{alert.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="notif-dropdown-footer">
                <button
                  type="button"
                  className="notif-footer-link"
                  onClick={() => handleNav('/admin/notifications')}
                >
                  Open Platform Alerts Center →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Platform Admin Profile Dropdown Trigger & Card */}
        <div className="admin-user-menu-wrapper" ref={profileRef}>
          <button
            type="button"
            className={`admin-user-profile-btn ${profileOpen ? 'active' : ''}`}
            onClick={() => {
              setProfileOpen((prev) => !prev)
              setNotifOpen(false)
              setSearchOpen(false)
            }}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            aria-label="Platform Admin profile and account options"
          >
            <div className="admin-avatar">
              <Shield size={15} />
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{userDisplayName}</span>
              <span className="admin-user-role">{roleText}</span>
            </div>
            <ChevronDown size={14} className={`admin-menu-arrow ${profileOpen ? 'open' : ''}`} />
          </button>

          {/* Professionally Styled Profile Dropdown Card */}
          {profileOpen && (
            <div
              className="admin-profile-dropdown"
              role="menu"
              aria-orientation="vertical"
              aria-label="User Account Menu"
            >
              {/* Profile Header Section */}
              <div className="admin-dropdown-profile-section">
                <div className="dropdown-profile-row">
                  <div className="dropdown-avatar" aria-hidden="true">
                    <Shield size={18} />
                  </div>
                  <div className="dropdown-user-meta">
                    <div className="dropdown-user-name" title={userDisplayName}>
                      {userDisplayName}
                    </div>
                    <div className="dropdown-user-email" title={userDisplayEmail}>
                      {userDisplayEmail}
                    </div>
                  </div>
                </div>

                <div className="dropdown-role-badge-row">
                  <span className="dropdown-role-badge">
                    <span className="role-dot" />
                    <span>{roleText.toUpperCase()}</span>
                  </span>
                </div>
              </div>

              <div className="admin-dropdown-divider" />

              {/* Menu Actions */}
              <div className="admin-dropdown-actions" role="none">
                <button
                  type="button"
                  className="admin-dropdown-item"
                  onClick={() => handleNav('/admin/settings')}
                  role="menuitem"
                >
                  <SlidersHorizontal size={15} className="dropdown-item-icon" />
                  <span className="dropdown-item-text">Account Settings</span>
                </button>

                <button
                  type="button"
                  className="admin-dropdown-item"
                  onClick={() => {
                    setProfileOpen(false)
                    window.location.href = '/'
                  }}
                  role="menuitem"
                >
                  <ExternalLink size={15} className="dropdown-item-icon" />
                  <span className="dropdown-item-text">Return to Tenant App</span>
                </button>
              </div>

              <div className="admin-dropdown-divider" />

              {/* Sign Out Action */}
              <div className="admin-dropdown-actions" role="none">
                <button
                  type="button"
                  className="admin-dropdown-item text-danger is-danger"
                  onClick={() => {
                    setProfileOpen(false)
                    onLogout()
                  }}
                  role="menuitem"
                >
                  <LogOut size={15} className="dropdown-item-icon text-danger" />
                  <span className="dropdown-item-text">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
