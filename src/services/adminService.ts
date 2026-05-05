import { Member, Role, ActivityLogEntry } from '../types/admin.types';

const MOCK_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Sowmy',
    email: 'sowmy@example.com',
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
    userName: 'Sowmy',
    action: 'INVITE_MEMBER',
    target: 'jane@example.com',
    timestamp: '2024-05-01T10:30:00Z',
  },
  {
    id: 'l2',
    userId: '1',
    userName: 'Sowmy',
    action: 'UPDATE_ROLE',
    target: 'Operator Permissions',
    timestamp: '2024-04-28T15:45:00Z',
  },
];

export const adminService = {
  getMembers: async (): Promise<Member[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...MOCK_MEMBERS]), 500));
  },
  getRoles: async (): Promise<Role[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...MOCK_ROLES]), 500));
  },
  getActivityLogs: async (): Promise<ActivityLogEntry[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...MOCK_LOGS]), 500));
  },
  addMember: async (member: Omit<Member, 'id' | 'joinedDate' | 'lastActive'>): Promise<Member> => {
    const newMember: Member = {
      ...member,
      id: Math.random().toString(36).substr(2, 9),
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: 'Never',
    };
    MOCK_MEMBERS.push(newMember);
    return new Promise((resolve) => setTimeout(() => resolve(newMember), 500));
  },
  updateMember: async (id: string, updates: Partial<Member>): Promise<Member> => {
    const index = MOCK_MEMBERS.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Member not found');
    MOCK_MEMBERS[index] = { ...MOCK_MEMBERS[index], ...updates };
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_MEMBERS[index]), 500));
  },
  updateRole: async (id: string, updates: Partial<Role>): Promise<Role> => {
    const index = MOCK_ROLES.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Role not found');
    MOCK_ROLES[index] = { ...MOCK_ROLES[index], ...updates };
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_ROLES[index]), 500));
  },
  createRole: async (role: Omit<Role, 'id'>): Promise<Role> => {
    const newRole: Role = {
      ...role,
      id: role.name.toLowerCase().replace(/\s+/g, '-'),
    };
    MOCK_ROLES.push(newRole);
    return new Promise((resolve) => setTimeout(() => resolve(newRole), 500));
  },
  deleteMember: async (id: string): Promise<void> => {
    const index = MOCK_MEMBERS.findIndex(m => m.id === id);
    if (index !== -1) MOCK_MEMBERS.splice(index, 1);
    return new Promise((resolve) => setTimeout(resolve, 500));
  },
  deleteRole: async (id: string): Promise<void> => {
    const index = MOCK_ROLES.findIndex(r => r.id === id);
    if (index !== -1) MOCK_ROLES.splice(index, 1);
    return new Promise((resolve) => setTimeout(resolve, 500));
  },
};
