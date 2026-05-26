import React, { useEffect, useState } from 'react';
import { Role, Permission, MemberRole } from '../../../types/admin.types';
import { adminService } from '../../../services/adminService';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../../components/Modal/Modal';
import Loading from '../../../components/Loading/Loading';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';

const DEFAULT_PERMISSIONS: Permission[] = [
  { id: '1', name: 'View Dashboards', description: 'Can view all real-time data.', enabled: false },
  { id: '2', name: 'Edit Projects', description: 'Can create and modify digital twins.', enabled: false },
  { id: '3', name: 'Manage Members', description: 'Can invite and remove team members.', enabled: false },
  { id: '4', name: 'Manage Assets', description: 'Can add or remove IoT devices.', enabled: false },
  { id: '5', name: 'Access Billing', description: 'Can manage subscriptions and payments.', enabled: false },
  { id: '6', name: 'Manage API Keys', description: 'Can generate and revoke system API keys.', enabled: false },
  { id: '7', name: 'View Audit Logs', description: 'Can view detailed system activity history.', enabled: false },
  { id: '8', name: 'Export Data', description: 'Can export telemetry data to external formats.', enabled: false },
];

const HoverableMore = ({ remaining }: { remaining: Permission[] }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'help' }}
      >
        +{remaining.length} more
      </span>
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '0',
              marginBottom: '10px',
              padding: '0.85rem',
              background: 'var(--surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-soft)',
              zIndex: 100,
              width: 'max-content',
              minWidth: '180px',
              pointerEvents: 'none'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {remaining.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#7c5dfa' }} />
                  {p.name}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleData, setRoleData] = useState({
    name: '' as MemberRole,
    description: '',
    permissions: [] as Permission[],
  });

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await adminService.getRoles();
      setRoles(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setRoleData({
      name: '' as any,
      description: '',
      permissions: DEFAULT_PERMISSIONS.map(p => ({ ...p })),
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setEditingRole(role);
    setRoleData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions.map(p => ({ ...p }))],
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (roleToDelete) {
      await adminService.deleteRole(roleToDelete.id);
      fetchRoles();
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setRoleData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p => 
        p.id === permissionId ? { ...p, enabled: !p.enabled } : p
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      await adminService.updateRole(editingRole.id, roleData);
    } else {
      await adminService.createRole(roleData);
    }
    setIsModalOpen(false);
    fetchRoles();
  };

  if (loading && roles.length === 0) {
    return <Loading message="Syncing roles..." />;
  }

  return (
    <div className="role-management" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="management-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        padding: '1rem 0',
        borderBottom: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, margin: 0 }}>Roles & Permissions</h2>
        <button className="primary-btn" onClick={handleOpenCreateModal} style={{ 
          padding: '8px 16px', 
          fontSize: 'var(--fs-sm)',
          whiteSpace: 'nowrap'
        }}>+ Create Role</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '1rem 0' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem',
          minWidth: '700px'
        }}>
          {/* List Header */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '220px 1fr 120px', 
            gap: '1.5rem',
            padding: '0.5rem 1.25rem',
            border: '1px solid transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div>Role Info</div>
            <div>Active Permissions</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {roles.map((role) => (
            <motion.div 
              key={role.id}
              style={{ 
                background: 'var(--secondary)', 
                borderRadius: '12px', 
                padding: '1rem 1.25rem',
                border: '1px solid var(--border-color)',
                display: 'grid',
                gridTemplateColumns: '220px 1fr 120px',
                alignItems: 'center',
                gap: '1.5rem',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(124, 93, 250, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Column 1: Role Name & Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#7c5dfa', margin: 0 }}>
                  {role.name}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.3' }}>
                  {role.description}
                </p>
              </div>

              {/* Column 2: Permissions Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                {role.permissions.filter(p => p.enabled).slice(0, 5).map((perm) => (
                  <span 
                    key={perm.id} 
                    style={{ 
                      fontSize: '0.7rem', 
                      padding: '0.25rem 0.6rem', 
                      background: 'rgba(124, 93, 250, 0.1)', 
                      color: '#7c5dfa', 
                      borderRadius: '100px',
                      border: '1px solid rgba(124, 93, 250, 0.15)',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {perm.name}
                  </span>
                ))}
                {role.permissions.filter(p => p.enabled).length > 5 && (
                  <HoverableMore remaining={role.permissions.filter(p => p.enabled).slice(5)} />
                )}
                {role.permissions.filter(p => p.enabled).length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', opacity: 0.6 }}>
                    No active permissions
                  </div>
                )}
              </div>

              {/* Column 3: Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                {role.isSystemRole ? (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap'
                  }}>
                    System Role
                  </span>
                ) : (
                  <>
                    <button 
                      className="action-btn" 
                      onClick={() => handleOpenEditModal(role)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        padding: '6px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        color: 'var(--text-primary)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(124, 93, 250, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(124, 93, 250, 0.3)';
                        e.currentTarget.style.color = '#7c5dfa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button 
                      className="action-btn" 
                      onClick={() => handleDeleteClick(role)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        padding: '6px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        color: '#ef4444'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingRole ? "Edit Role Permissions" : "Create New Role"}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="roleName">Role Name</label>
            <input 
              type="text" 
              id="roleName" 
              value={roleData.name} 
              onChange={(e) => setRoleData({...roleData, name: e.target.value as any})}
              placeholder="e.g. System Maintainer"
              required
              disabled={!!editingRole}
            />
          </div>
          <div className="form-group">
            <label htmlFor="roleDesc">Description</label>
            <textarea 
              id="roleDesc" 
              value={roleData.description} 
              onChange={(e) => setRoleData({...roleData, description: e.target.value})}
              rows={2}
              placeholder="Briefly describe what this role can do..."
              style={{ background: 'var(--background)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', width: '100%', outline: 'none' }}
            />
          </div>
          
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Permissions
            </label>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem', 
              maxHeight: window.innerWidth <= 768 ? '250px' : '400px', 
              overflowY: 'auto', 
              paddingRight: '0.5rem' 
            }}>
              {roleData.permissions.map((perm) => (
                <div 
                  key={perm.id} 
                  onClick={() => handlePermissionToggle(perm.id)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.6rem 0.85rem',
                    background: 'var(--secondary)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.2s',
                    opacity: perm.enabled ? 1 : 0.8
                  }}
                  onMouseEnter={(e) => {
                    if (window.innerWidth > 768) {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.background = 'var(--accent-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (window.innerWidth > 768) {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.background = 'var(--secondary)';
                    }
                  }}
                >
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{perm.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{perm.description}</div>
                  </div>
                  <div style={{ 
                    width: '36px', 
                    height: '18px', 
                    borderRadius: '20px', 
                    background: perm.enabled ? 'var(--accent)' : 'var(--border-color)',
                    position: 'relative',
                    transition: 'background 0.3s',
                    flexShrink: 0
                  }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      background: 'white',
                      position: 'absolute',
                      top: '3px',
                      left: perm.enabled ? '21px' : '3px',
                      transition: 'left 0.3s'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>
            <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="primary-btn">
              {editingRole ? "Update Role" : "Create Role"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Role"
        message={`Are you sure you want to delete the "${roleToDelete?.name}" role? This will affect all members assigned to this role.`}
        confirmText="Delete Role"
        type="danger"
      />
    </div>
  );
};

export default RoleManagement;
