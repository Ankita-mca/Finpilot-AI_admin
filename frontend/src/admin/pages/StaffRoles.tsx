import React, { useState } from 'react'
import {
  UserCog, Lock, Plus, ShieldCheck, UserCheck, UserX,
  KeyRound, CheckCircle2, AlertTriangle, ShieldAlert, Edit
} from 'lucide-react'
import AdminStatCard from '../components/AdminStatCard'
import StatusBadge from '../components/StatusBadge'
import AdminButton from '../components/AdminButton'
import AdminSelect from '../components/AdminSelect'
import AdminConfirmDialog from '../components/AdminConfirmDialog'
import { MOCK_STAFF, type PlatformStaffRecord } from '../services/mockDataService'
import type { AdminUser, AdminRole } from '../types/admin.types'

interface StaffRolesProps {
  user: AdminUser | null
}

export default function StaffRoles({ user }: StaffRolesProps) {
  const [staffList, setStaffList] = useState<PlatformStaffRecord[]>(MOCK_STAFF)
  const isSuperAdmin = user?.role === 'super_admin'

  const [addStaffModal, setAddStaffModal] = useState(false)
  const [roleChangeModal, setRoleChangeModal] = useState<PlatformStaffRecord | null>(null)
  const [selectedNewRole, setSelectedNewRole] = useState<AdminRole>('platform_admin')
  const [statusTarget, setStatusTarget] = useState<PlatformStaffRecord | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // New staff form state
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<AdminRole>('platform_admin')

  const totalStaff = staffList.length
  const activeStaff = staffList.filter((s) => s.status === 'active').length
  const superAdminCount = staffList.filter((s) => s.role === 'super_admin').length
  const platformAdminCount = staffList.filter((s) => s.role === 'platform_admin').length

  const handleAddStaff = (reason?: string) => {
    if (!newName.trim() || !newEmail.trim()) return
    const newRecord: PlatformStaffRecord = {
      id: `stf-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      status: 'active',
      twoFactorEnabled: true,
      lastLogin: 'Never',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setStaffList((prev) => [...prev, newRecord])
    setAddStaffModal(false)
    setNewName('')
    setNewEmail('')
    setToastMsg(
      `Platform staff account created for ${newRecord.name} (${newRecord.email})${reason ? ` (${reason})` : ''}. (Demo action)`
    )
    setTimeout(() => setToastMsg(null), 5000)
  }

  const handleSaveRoleChange = (reason?: string) => {
    if (!roleChangeModal) return
    setStaffList((prev) =>
      prev.map((s) => (s.id === roleChangeModal.id ? { ...s, role: selectedNewRole } : s))
    )
    setToastMsg(
      `Role for ${roleChangeModal.name} updated to ${selectedNewRole.replace('_', ' ').toUpperCase()}${reason ? ` (${reason})` : ''}. (Demo action)`
    )
    setRoleChangeModal(null)
    setTimeout(() => setToastMsg(null), 5000)
  }

  const handleToggleStaffStatus = (reason?: string) => {
    if (!statusTarget) return
    const nextStatus = statusTarget.status === 'active' ? 'suspended' : 'active'
    setStaffList((prev) =>
      prev.map((s) => (s.id === statusTarget.id ? { ...s, status: nextStatus } : s))
    )
    setToastMsg(
      `Staff account ${statusTarget.email} ${nextStatus}${reason ? ` (Reason: ${reason})` : ''}. (Demo action)`
    )
    setStatusTarget(null)
    setTimeout(() => setToastMsg(null), 5000)
  }

  const roleOptions: { value: AdminRole; label: string }[] = [
    { value: 'super_admin', label: 'Super Admin (Full Authority)' },
    { value: 'platform_admin', label: 'Platform Admin (Operations)' },
  ]

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 className="admin-page-heading">Platform Staff & Role Governance</h2>
            <span className="admin-badge admin-badge-pastDue" style={{ fontSize: '0.72rem' }}>
              <Lock size={12} /> Super Admin Only
            </span>
          </div>
          <p className="admin-page-subheading">
            Internal operators roster across Super Admin and Platform Admin roles.
          </p>
        </div>
        <div className="admin-page-actions">
          {isSuperAdmin ? (
            <AdminButton
              variant="primary"
              size="md"
              icon={<Plus size={14} />}
              onClick={() => setAddStaffModal(true)}
            >
              Add Platform Staff
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
            <strong>Super Admin Privilege Required:</strong> As a Platform Admin, you can view the active platform operator roster. Provisioning staff credentials or modifying internal roles requires Super Admin authorization.
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="admin-alert admin-alert-info">
          <CheckCircle2 size={16} className="text-success" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="admin-stat-cards-grid">
        <AdminStatCard
          label="Total Internal Staff"
          value={totalStaff}
          icon={<UserCog size={20} />}
          description="Provisioned staff credentials"
        />
        <AdminStatCard
          label="Super Admins"
          value={superAdminCount}
          icon={<ShieldCheck size={20} className="text-danger" />}
          description="Full governance authority"
        />
        <AdminStatCard
          label="Platform Admins"
          value={platformAdminCount}
          icon={<ShieldCheck size={20} className="text-success" />}
          description="Tenant operations oversight"
        />
        <AdminStatCard
          label="Active Accounts"
          value={activeStaff}
          changeType="positive"
          change={`${Math.round((activeStaff / totalStaff) * 100)}%`}
          icon={<UserCheck size={20} className="text-success" />}
          description="2FA verified sessions"
        />
      </div>

      {/* Staff Roster Table Card */}
      <div className="admin-card admin-table-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Platform Role</th>
                <th>Account Status</th>
                <th>2FA Security</th>
                <th>Last Active</th>
                <th>Member Since</th>
                {isSuperAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr key={staff.id}>
                  <td className="font-semibold">
                    <div className="admin-org-name-cell">
                      <span className="admin-org-avatar" style={{ background: '#1e293b' }}>
                        {staff.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <div className="org-name-text">{staff.name}</div>
                        <div className="text-muted text-xs">{staff.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`admin-plan-badge tier-${
                        staff.role === 'super_admin'
                          ? 'enterprise'
                          : staff.role === 'platform_admin'
                          ? 'growth'
                          : 'business'
                      }`}
                    >
                      {staff.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={staff.status} />
                  </td>
                  <td>
                    <span
                      className={`admin-badge ${
                        staff.twoFactorEnabled ? 'admin-badge-active' : 'admin-badge-pastDue'
                      }`}
                    >
                      {staff.twoFactorEnabled ? 'Enforced' : 'Missing'}
                    </span>
                  </td>
                  <td className="text-muted text-xs">{staff.lastLogin}</td>
                  <td className="text-muted text-xs">{staff.createdAt}</td>
                  {isSuperAdmin && (
                    <td style={{ textAlign: 'right' }}>
                      <div className="admin-table-actions-group">
                        <AdminButton
                          variant="outline"
                          size="sm"
                          icon={<Edit size={13} />}
                          onClick={() => {
                            setSelectedNewRole(staff.role)
                            setRoleChangeModal(staff)
                          }}
                          tooltip="Modify Assigned Role"
                        >
                          Role
                        </AdminButton>
                        <AdminButton
                          variant={staff.status === 'active' ? 'danger' : 'outline'}
                          size="sm"
                          icon={staff.status === 'active' ? <UserX size={13} /> : <UserCheck size={13} />}
                          onClick={() => setStatusTarget(staff)}
                          tooltip={staff.status === 'active' ? 'Suspend Staff Account' : 'Reactivate Account'}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {addStaffModal && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setAddStaffModal(false)}
          title="Add Platform Staff Account"
          confirmLabel="Create Staff Account"
          description="Provision a new platform operator credential with role-based administrative authority."
          requireReason={true}
          reasonLabel="Staff Provisioning Justification"
          reasonPlaceholder="e.g. New hiring, support agent onboarding, etc."
          onConfirm={handleAddStaff}
        >
          <div className="admin-form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="admin-form-label">Full Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Aisha Sharma"
              className="admin-form-input"
            />
          </div>

          <div className="admin-form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="admin-form-label">Company Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. aisha@finpilot.ai"
              className="admin-form-input"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Platform Security Role</label>
            <AdminSelect<AdminRole>
              value={newRole}
              onChange={(val) => setNewRole(val)}
              options={roleOptions}
              size="md"
            />
          </div>
        </AdminConfirmDialog>
      )}

      {/* Role Change Modal */}
      {roleChangeModal && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setRoleChangeModal(null)}
          title={`Modify Platform Role: ${roleChangeModal.name}`}
          confirmLabel="Save Role Assignment"
          description="Adjust the internal administrative authorization level for this staff member."
          targetDetails={[
            { label: 'Staff Member', value: roleChangeModal.name },
            { label: 'Email', value: roleChangeModal.email },
            { label: 'Current Role', value: roleChangeModal.role.replace('_', ' ').toUpperCase() },
          ]}
          requireReason={true}
          reasonLabel="Role Change Authorization Note"
          reasonPlaceholder="e.g. Promoted to Platform Admin, scope reduction, etc."
          onConfirm={handleSaveRoleChange}
        >
          <div className="admin-form-group">
            <label className="admin-form-label">Select New Platform Role</label>
            <AdminSelect<AdminRole>
              value={selectedNewRole}
              onChange={(val) => setSelectedNewRole(val)}
              options={roleOptions}
              size="md"
            />
          </div>
        </AdminConfirmDialog>
      )}

      {/* Status Toggle Modal */}
      {statusTarget && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setStatusTarget(null)}
          title={`${statusTarget.status === 'active' ? 'Suspend' : 'Reactivate'} Staff Account`}
          isDanger={statusTarget.status === 'active'}
          confirmLabel={statusTarget.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
          description={
            statusTarget.status === 'active'
              ? `Suspending ${statusTarget.name} (${statusTarget.email}) immediately revokes platform control center access.`
              : `Reactivating ${statusTarget.name} restores access to the platform control center.`
          }
          targetDetails={[
            { label: 'Staff Name', value: statusTarget.name },
            { label: 'Email', value: statusTarget.email },
            { label: 'Assigned Role', value: statusTarget.role.replace('_', ' ').toUpperCase() },
          ]}
          requireReason={statusTarget.status === 'active'}
          reasonLabel="Account Suspension Justification"
          reasonPlaceholder="e.g. Leave of absence, departure, or security check..."
          onConfirm={handleToggleStaffStatus}
        />
      )}
    </div>
  )
}
