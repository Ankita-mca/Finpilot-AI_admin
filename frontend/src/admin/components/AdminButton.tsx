import React from 'react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'icon'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  children?: React.ReactNode
  tooltip?: string
}

export default function AdminButton({
  variant = 'secondary',
  size = 'md',
  loading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  tooltip,
  ...props
}: AdminButtonProps) {
  // Variant CSS mapping
  const variantClassMap: Record<ButtonVariant, string> = {
    primary: 'admin-btn-primary',
    secondary: 'admin-btn-secondary',
    outline: 'admin-btn-outline',
    ghost: 'admin-btn-ghost',
    danger: 'admin-btn-danger',
    icon: 'admin-btn-icon',
  }

  // Size CSS mapping
  const sizeClassMap: Record<ButtonSize, string> = {
    sm: 'admin-btn-sm',
    md: 'admin-btn-md',
    lg: 'admin-btn-lg',
  }

  const baseClasses = [
    'admin-btn',
    variantClassMap[variant],
    sizeClassMap[size],
    loading ? 'admin-btn-loading' : '',
    className,
  ].filter(Boolean).join(' ')

  const isDisabled = disabled || loading

  return (
    <button
      type={props.type || 'button'}
      className={baseClasses}
      disabled={isDisabled}
      title={tooltip || props.title}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={size === 'sm' ? 13 : 15} className="admin-btn-spinner" />
          {loadingText ? <span>{loadingText}</span> : children ? <span>{children}</span> : null}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="admin-btn-icon-slot">{icon}</span>}
          {children && <span className="admin-btn-label">{children}</span>}
          {icon && iconPosition === 'right' && <span className="admin-btn-icon-slot">{icon}</span>}
        </>
      )}
    </button>
  )
}

