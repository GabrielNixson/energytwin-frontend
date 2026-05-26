import { Member, Role, ActivityLogEntry, Permission, MemberStatus } from '../types/admin.types';
import api from './api';

const MOCK_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Nalvazhuthi',
    email: 'nalvazhuthi@example.com',
    role: 'Admin',
    status: 'Active',
    joinedDate: '2024-01-15',
    lastActive: '2024-05-05 14:20',
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Operator',
    status: 'Active',
    joinedDate: '2024-02-10',
    lastActive: '2024-05-04 09:15',
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Viewer',
    status: 'Pending',
    joinedDate: '2024-05-01',
    lastActive: 'Never',
  },
];

const MOCK_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full access to all system settings and user management.',
    permissions: [
      { id: '1', name: 'View Dashboards', description: 'Can view all real-time data.', enabled: true },
      { id: '2', name: 'Edit Projects', description: 'Can create and modify digital twins.', enabled: true },
      { id: '3', name: 'Manage Members', description: 'Can invite and remove team members.', enabled: true },
      { id: '4', name: 'Manage Assets', description: 'Can add or remove IoT devices.', enabled: true },
      { id: '5', name: 'Access Billing', description: 'Can manage subscriptions and payments.', enabled: true },
      { id: '6', name: 'Manage API Keys', description: 'Can generate and revoke system API keys.', enabled: true },
      { id: '7', name: 'View Audit Logs', description: 'Can view detailed system activity history.', enabled: true },
      { id: '8', name: 'Export Data', description: 'Can export telemetry data to external formats.', enabled: true },
    ],
  },
  {
    id: 'operator',
    name: 'Operator',
    description: 'Can manage assets and view telemetry data.',
    permissions: [
      { id: '1', name: 'View Dashboards', description: 'Can view all real-time data.', enabled: true },
      { id: '2', name: 'Edit Projects', description: 'Can create and modify digital twins.', enabled: true },
      { id: '3', name: 'Manage Members', description: 'Can invite and remove team members.', enabled: false },
      { id: '4', name: 'Manage Assets', description: 'Can add or remove IoT devices.', enabled: true },
      { id: '5', name: 'Access Billing', description: 'Can manage subscriptions and payments.', enabled: false },
      { id: '6', name: 'Manage API Keys', description: 'Can generate and revoke system API keys.', enabled: false },
      { id: '7', name: 'View Audit Logs', description: 'Can view detailed system activity history.', enabled: false },
      { id: '8', name: 'Export Data', description: 'Can export telemetry data to external formats.', enabled: true },
    ],
  },
];

const MOCK_LOGS: ActivityLogEntry[] = [
  {
    id: 'l1',
    userId: '1',
    userName: 'Nalvazhuthi',
    action: 'INVITE_MEMBER',
    target: 'jane@example.com',
    timestamp: '2024-05-01T10:30:00Z',
  },
  {
    id: 'l2',
    userId: '1',
    userName: 'Nalvazhuthi',
    action: 'UPDATE_ROLE',
    target: 'Operator Permissions',
    timestamp: '2024-04-28T15:45:00Z',
  },
];

const DEFAULT_PERMISSIONS = [
  { id: '1', name: 'View Dashboards', description: 'Can view all real-time data.' },
  { id: '2', name: 'Edit Projects', description: 'Can create and modify digital twins.' },
  { id: '3', name: 'Manage Members', description: 'Can invite and remove team members.' },
  { id: '4', name: 'Manage Assets', description: 'Can add or remove IoT devices.' },
  { id: '5', name: 'Access Billing', description: 'Can manage subscriptions and payments.' },
  { id: '6', name: 'Manage API Keys', description: 'Can generate and revoke system API keys.' },
  { id: '7', name: 'View Audit Logs', description: 'Can view detailed system activity history.' },
  { id: '8', name: 'Export Data', description: 'Can export telemetry data to external formats.' },
];

export const PERMISSION_MAPPING: Record<string, string> = {
  'View Dashboards': 'viewDashboards',
  'Edit Projects': 'editProjects',
  'Manage Members': 'manageMembers',
  'Manage Assets': 'manageAssets',
  'Access Billing': 'accessBilling',
  'Manage API Keys': 'manageApiKeys',
  'View Audit Logs': 'viewAuditLogs',
  'Export Data': 'exportData'
};

export const REVERSE_PERMISSION_MAPPING: Record<string, string> = {
  viewDashboards: 'View Dashboards',
  editProjects: 'Edit Projects',
  manageMembers: 'Manage Members',
  manageAssets: 'Manage Assets',
  accessBilling: 'Access Billing',
  manageApiKeys: 'Manage API Keys',
  viewAuditLogs: 'View Audit Logs',
  exportData: 'Export Data'
};

const mapBackendRoleToFrontend = (backendRole: any): Role => {
  const isObject = backendRole.permissions && !Array.isArray(backendRole.permissions);
  const permissionsArray: Permission[] = DEFAULT_PERMISSIONS.map(p => {
    let enabled = false;
    const backendKey = PERMISSION_MAPPING[p.name];
    if (isObject) {
      enabled = backendRole.permissions[backendKey] === true;
    } else if (Array.isArray(backendRole.permissions)) {
      const found = backendRole.permissions.find((bp: any) => bp.name === p.name || bp.name === backendKey);
      enabled = found ? found.enabled : false;
    }
    return { ...p, enabled };
  });

  return {
    id: backendRole.id || backendRole._id,
    name: backendRole.name,
    description: backendRole.description || '',
    permissions: permissionsArray,
    isSystemRole: backendRole.isSystemRole || false
  } as Role;
};

const mapFrontendRoleToBackend = (frontendRole: Partial<Role>) => {
  const data: any = {
    name: frontendRole.name,
    description: frontendRole.description,
  };
  if (frontendRole.permissions) {
    data.permissions = {};
    frontendRole.permissions.forEach(p => {
      const backendKey = PERMISSION_MAPPING[p.name] || p.name;
      data.permissions[backendKey] = p.enabled;
    });
  }
  return data;
};

const mapBackendUserToFrontend = (backendUser: any): Member => {
  let roleName = 'Viewer';
  if (backendUser.role) {
    if (typeof backendUser.role === 'object') {
      roleName = backendUser.role.name || 'Viewer';
    } else if (typeof backendUser.role === 'string') {
      roleName = backendUser.role;
    }
  } else if (backendUser.roleId) {
    roleName = backendUser.roleId;
  }

  let mappedStatus: MemberStatus = 'Active';
  if (backendUser.status) {
    const s = backendUser.status.toLowerCase();
    if (s === 'pending') mappedStatus = 'Pending';
    else if (s === 'suspended') mappedStatus = 'Suspended';
    else mappedStatus = 'Active';
  }

  return {
    id: backendUser.id || backendUser._id || String(backendUser.userId || ''),
    name: backendUser.userName || backendUser.name || '',
    email: backendUser.email || '',
    role: roleName,
    status: mappedStatus,
    joinedDate: backendUser.createdAt 
      ? new Date(backendUser.createdAt).toISOString().split('T')[0] 
      : (backendUser.joinedDate || new Date().toISOString().split('T')[0]),
    lastActive: backendUser.lastActive || 'Never'
  };
};

const mapBackendLogToFrontend = (backendLog: any): ActivityLogEntry => {
  return {
    id: backendLog.id || backendLog._id || String(Math.random()),
    userId: backendLog.userId || backendLog.user?.id || backendLog.user?._id || '',
    userName: backendLog.userName || backendLog.user?.userName || backendLog.user?.name || 'System',
    action: backendLog.action || '',
    target: backendLog.target || backendLog.targetName || '',
    timestamp: backendLog.timestamp || backendLog.createdAt || new Date().toISOString(),
    details: backendLog.details || ''
  };
};

export const adminService = {
  getMembers: async (): Promise<Member[]> => {
    try {
      const response = await api.get('/api/users');
      const users = response.data?.data || response.data;
      if (Array.isArray(users)) {
        const roles = await adminService.getRoles();
        return users.map(user => {
          const mapped = mapBackendUserToFrontend(user);
          const matchingRole = roles.find(r => r.id === mapped.role || r.name === mapped.role);
          if (matchingRole) {
            mapped.role = matchingRole.name;
          }
          return mapped;
        });
      }
      return [];
    } catch (error) {
      console.error('Failed to get members', error);
      return [...MOCK_MEMBERS]; // fallback for development
    }
  },
  getRoles: async (): Promise<Role[]> => {
    try {
      const response = await api.get('/api/roles');
      const roles = response.data?.data || response.data;
      if (Array.isArray(roles)) {
        return roles.map(mapBackendRoleToFrontend);
      }
      return [];
    } catch (error) {
      console.error('Failed to get roles', error);
      return [...MOCK_ROLES]; // fallback for development
    }
  },
  getRoleById: async (id: string): Promise<Role> => {
    try {
      const response = await api.get(`/api/roles/${id}`);
      const role = response.data?.data || response.data;
      return mapBackendRoleToFrontend(role);
    } catch (error) {
      console.error(`Failed to get role ${id}`, error);
      const fallback = MOCK_ROLES.find(r => r.id === id);
      if (fallback) return fallback;
      throw error;
    }
  },
  getActivityLogs: async (): Promise<ActivityLogEntry[]> => {
    try {
      const response = await api.get('/api/activity-logs');
      const logs = response.data?.data || response.data;
      if (Array.isArray(logs)) {
        return logs.map(mapBackendLogToFrontend);
      }
      return [];
    } catch (error) {
      console.error('Failed to get activity logs', error);
      return [...MOCK_LOGS]; // fallback for development
    }
  },
  addMember: async (member: Omit<Member, 'id' | 'joinedDate' | 'lastActive'> & { password?: string }): Promise<Member> => {
    try {
      const roles = await adminService.getRoles();
      const selectedRole = roles.find(r => r.name === member.role);
      const roleId = selectedRole ? selectedRole.id : undefined;

      const payload = {
        userName: member.name,
        email: member.email,
        password: member.password,
        roleId,
        status: member.status ? member.status.toLowerCase() : undefined,
      };

      const response = await api.post('/api/users', payload);
      const newUser = response.data?.data || response.data;
      return mapBackendUserToFrontend(newUser);
    } catch (error) {
      console.error('Failed to create user', error);
      throw error;
    }
  },
  updateMember: async (id: string, updates: Partial<Member>): Promise<Member> => {
    try {
      const roles = await adminService.getRoles();
      const selectedRole = roles.find(r => r.name === updates.role);
      const roleId = selectedRole ? selectedRole.id : undefined;

      const payload: any = {};
      if (roleId !== undefined) payload.roleId = roleId;
      if (updates.status !== undefined) payload.status = updates.status.toLowerCase();

      const response = await api.put(`/api/users/${id}`, payload);
      const updatedUser = response.data?.data || response.data;
      return mapBackendUserToFrontend(updatedUser);
    } catch (error) {
      console.error('Failed to update user', error);
      throw error;
    }
  },
  updateRole: async (id: string, updates: Partial<Role>): Promise<Role> => {
    try {
      const payload = mapFrontendRoleToBackend(updates);
      const response = await api.put(`/api/roles/${id}`, payload);
      const updatedRole = response.data?.data || response.data;
      return mapBackendRoleToFrontend(updatedRole);
    } catch (error) {
      console.error('Failed to update role', error);
      throw error;
    }
  },
  createRole: async (role: Omit<Role, 'id'>): Promise<Role> => {
    try {
      const payload = mapFrontendRoleToBackend(role);
      const response = await api.post('/api/roles', payload);
      const newRole = response.data?.data || response.data;
      return mapBackendRoleToFrontend(newRole);
    } catch (error) {
      console.error('Failed to create role', error);
      throw error;
    }
  },
  deleteMember: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/users/${id}`);
    } catch (error) {
      console.error('Failed to delete user', error);
      throw error;
    }
  },
  deleteRole: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/roles/${id}`);
    } catch (error) {
      console.error('Failed to delete role', error);
      throw error;
    }
  },
};

