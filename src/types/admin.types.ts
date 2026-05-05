export type MemberRole = 'Admin' | 'Viewer' | 'Operator' | 'Editor';

export type MemberStatus = 'Active' | 'Pending' | 'Suspended';

export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  avatar?: string;
  joinedDate: string;
  lastActive: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface Role {
  id: string;
  name: MemberRole;
  description: string;
  permissions: Permission[];
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: string;
  details?: string;
}
