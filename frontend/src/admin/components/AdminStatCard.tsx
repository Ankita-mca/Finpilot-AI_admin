import React from 'react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

interface AdminStatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
  description?: string
  isDemo?: boolean
}

export default function AdminStatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  description,
  isDemo = false,
}: AdminStatCardProps) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-header">
        <span className="admin-stat-label">{label}</span>
        {icon && <div className="admin-stat-icon-wrapper">{icon}</div>}
      </div>
      <div className="admin-stat-value">{value}</div>
      <div className="admin-stat-footer">
        {change && (
          <span className={`admin-stat-change ${changeType}`}>
            {changeType === 'positive' && <ArrowUpRight size={14} />}
            {changeType === 'negative' && <ArrowDownRight size={14} />}
            {changeType === 'neutral' && <Minus size={14} />}
            <span>{change}</span>
          </span>
        )}
        {description && <span className="admin-stat-desc">{description}</span>}
      </div>
      {isDemo && (
        <div className="admin-stat-demo-tag" title="Demonstration telemetry metric">
          Demo
        </div>
      )}
    </div>
  )
}
