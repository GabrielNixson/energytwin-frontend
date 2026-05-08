import React, { useEffect, useState } from 'react';
import { Member, MemberRole, MemberStatus, Role } from '../../../types/admin.types';
import { adminService } from '../../../services/adminService';
import { motion } from 'framer-motion';
import Modal from '../../../components/Modal/Modal';
import CustomDropdown from '../../../components/CustomDropdown/CustomDropdown';
import Loading from '../../../components/Loading/Loading';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';

const statusOptions = [
  { id: 'Active', label: 'Active' },
  { id: 'Pending', label: 'Pending' },
  { id: 'Suspended', label: 'Suspended' },
];

const MemberManagement = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Viewer' as MemberRole,
    status: 'Active' as MemberStatus,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersData, rolesData] = await Promise.all([
        adminService.getMembers(),
        adminService.getRoles()
      ]);
      setMembers(membersData);
      setRoles(rolesData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const roleOptions = roles.map(role => ({
    id: role.name,
    label: role.name,
    description: role.description
  }));

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormData({ name: '', email: '', role: 'Viewer' as MemberRole, status: 'Active' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (member: Member) => {
    setMemberToDelete(member);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (memberToDelete) {
      await adminService.deleteMember(memberToDelete.id);
      fetchData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      await adminService.updateMember(editingMember.id, formData);
    } else {
      await adminService.addMember(formData);
    }
    setIsModalOpen(false);
    fetchData();
  };

  if (loading && members.length === 0) {
    return <Loading message="Retrieving members..." />;
  }

  return (
    <div className="member-management" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        padding: '1.5rem 0 1rem 0',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Team Members</h2>
        <button className="primary-btn" onClick={handleOpenAddModal}>+ Invite Member</button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <motion.tr 
                key={member.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: 'rgba(124, 93, 250, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#7c5dfa'
                    }}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{member.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{member.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="role-badge">{member.role}</span>
                </td>
                <td>
                  <span className={`status-badge ${member.status.toLowerCase()}`}>
                    {member.status}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{member.lastActive}</td>
                <td>{member.joinedDate}</td>
                <td>
                  <button className="action-btn" title="Edit" onClick={() => handleOpenEditModal(member)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                  </button>
                  <button className="action-btn" title="Remove" style={{ color: '#ef4444' }} onClick={() => handleDeleteClick(member)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingMember ? "Edit Member" : "Invite New Member"}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. John Doe"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="e.g. john@example.com"
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <CustomDropdown 
              label="Role"
              options={roleOptions}
              value={formData.role}
              onChange={(id) => setFormData({...formData, role: id as MemberRole})}
            />
            <CustomDropdown 
              label="Status"
              options={statusOptions}
              value={formData.status}
              onChange={(id) => setFormData({...formData, status: id as MemberStatus})}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="primary-btn">
              {editingMember ? "Save Changes" : "Send Invitation"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToDelete?.name}? This action cannot be undone.`}
        confirmText="Remove Member"
        type="danger"
      />
    </div>
  );
};

export default MemberManagement;
