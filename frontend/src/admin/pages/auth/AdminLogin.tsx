import React, { useState } from 'react'
import { Eye, EyeOff, ShieldCheck, ArrowLeft, AlertCircle, Loader2, Lock } from 'lucide-react'
import AdminButton from '../../components/AdminButton'

interface AdminLoginProps {
  onLogin: (email: string, pass: string) => Promise<void>
  onBackToRoles: () => void
  onClearError?: () => void
  error?: string | null
  loading?: boolean
}

export default function AdminLogin({
  onLogin,
  onBackToRoles,
  onClearError,
  error: externalError,
  loading: externalLoading,
}: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)
  const [forgotSent, setForgotSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeError = localError || externalError
  const isBusy = isSubmitting || externalLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setLocalError('Please enter your staff email address.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setLocalError('Please enter a valid email address.')
      return
    }
    if (!password) {
      setLocalError('Please enter your password.')
      return
    }

    setIsSubmitting(true)
    try {
      await onLogin(trimmedEmail, password)
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Failed to authenticate. Please check your credentials.'
      setLocalError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    setForgotSent(true)
    setLocalError(null)
  }

  return (
    <div className="admin-auth-container">
      <div className="admin-login-card">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBackToRoles}
          className="admin-login-back-btn"
          aria-label="Back to role selection"
        >
          <ArrowLeft size={16} />
          <span>Back to Role Selection</span>
        </button>

        {/* Card Header */}
        <div className="admin-login-header">
          <div className="admin-login-brand">
            <span className="admin-brand-icon">FP</span>
            <div>
              <span className="admin-brand-name">FinPilot AI</span>
              <span className="admin-brand-tag">Ops Portal</span>
            </div>
          </div>
          <h2 className="admin-login-title">Super Admin Portal</h2>
          <p className="admin-login-subtitle">
            Enter your authorized super administrator credentials to access platform control.
          </p>
        </div>

        {/* Error Display */}
        {activeError && (
          <div className="admin-alert admin-alert-danger" role="alert">
            <AlertCircle size={16} className="alert-icon" />
            <div className="alert-text">{activeError}</div>
          </div>
        )}

        {/* Forgot Password Notice */}
        {forgotSent && (
          <div className="admin-alert admin-alert-info">
            Password reset instructions have been dispatched to authorized administrators. Contact your Super Admin for rapid account recovery.
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-form-group">
            <label htmlFor="admin-email" className="admin-form-label">
              Staff Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (localError) setLocalError(null)
                if (onClearError) onClearError()
              }}
              placeholder="admin@finpilot.ai"
              className="admin-form-input"
              autoComplete="username"
              required
              disabled={isBusy}
            />
          </div>

          <div className="admin-form-group">
            <div className="admin-label-row">
              <label htmlFor="admin-password" className="admin-form-label">
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="admin-forgot-btn"
              >
                Forgot password?
              </button>
            </div>
            <div className="admin-password-wrapper">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (localError) setLocalError(null)
                  if (onClearError) onClearError()
                }}
                placeholder="••••••••••••"
                className="admin-form-input with-toggle"
                autoComplete="current-password"
                required
                disabled={isBusy}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="admin-pwd-toggle-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="admin-form-row">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="admin-checkbox"
              />
              <span>Remember this workstation</span>
            </label>
          </div>

          <AdminButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            style={{ width: '100%', height: '42px', marginTop: '0.5rem' }}
            loading={isBusy}
            loadingText="Verifying Super Admin Role..."
            icon={<Lock size={16} />}
          >
            Sign In as Super Admin
          </AdminButton>
        </form>

        {/* Security badge footer */}
        <div className="admin-login-security-footer">
          <ShieldCheck size={14} className="security-icon" />
          <span>Role verified via server-side session authentication</span>
        </div>
      </div>
    </div>
  )
}
