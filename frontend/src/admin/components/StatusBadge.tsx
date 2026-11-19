import React from 'react'

interface StatusBadgeProps {
  status: 'active' | 'trial' | 'pastDue' | 'past_due' | 'suspended' | 'closed' | 'info' | 'warning' | 'alert' | 'success'
  label?: string
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const normalizedStatus = status === 'past_due' ? 'pastDue' : status
  const displayLabel = label || (status === 'past_due' ? 'Past Due' : (status === 'pastDue' ? 'Past Due' : status.charAt(0).toUpperCase() + status.slice(1)))
  return (
    <span className={`admin-badge admin-badge-${normalizedStatus}`}>
      <span className="admin-badge-dot" />
      {displayLabel}
    </span>
  )
}
