export type UserRole = 'user' | 'worker' | 'department_supervisor' | 'super_admin';

export type Department = 'Electrical' | 'Plumbing' | 'HVAC' | 'Civil' | 'IT & Network';

export type IssueStatus = 'queued' | 'assigned' | 'in_progress' | 'resolved' | 'escalated';

export type Priority = 'Critical' | 'High' | 'Normal' | 'Low';
export type ResidenceType = 'hostel' | 'day_scholar';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  phone?: string;
  residenceType?: ResidenceType;
  address?: string;
  city?: string;
  building?: string;
  room?: string;
  isActive: boolean;
}

export interface FeedbackData {
  rating: number;
  comment: string;
  submittedAt: string;
}

export interface Issue {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  category: string;
  department: string;
  building: string;
  floor: string;
  room: string;
  status: IssueStatus;
  priority: Priority;
  reportedBy: string;
  reportedByUserId: string;
  reportedAt: string;
  resolvedAt?: string;
  slaMinutes: number;
  slaDeadline: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  photoUrl?: string;
  resolutionPhoto?: string;
  feedback?: FeedbackData;
  coordinates?: { lat: number; lng: number };
  reworkCount?: number;
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  status: 'available' | 'busy' | 'off_duty';
  rating: number;
  activeJobId?: string;
  jobsCompleted: number;
  reworkRate: number; // in percentage e.g. 1.2
  shift: string;
  currentBuilding: string;
  coordinates: { lat: number; lng: number };
}

export interface WorkerPerformance {
  rating: number;
  ratingsCount: number;
  jobsCompleted: number;
  resolvedIssues: number;
  activeIssues: number;
  reworkRate: number;
  averageResolutionMinutes: number | null;
}

export interface ShiftRoster {
  id: string;
  workerId: string;
  workerName: string;
  department: string;
  shift: string;
  date: string;
  status: 'active' | 'scheduled' | 'leave';
  buildingAssigned: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: UserRole;
  action: string;
  targetType: 'issue' | 'worker' | 'shift' | 'user' | 'system';
  targetId: string;
  details: string;
  timestamp: string;
  department?: string;
}

export interface DepartmentMetrics {
  department: string;
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  escalatedIssues: number;
  avgResolutionTimeMins: number;
  slaComplianceRate: number; // percentage
  reworkRate: number; // percentage
  activeWorkers: number;
}
