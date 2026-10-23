export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'department_supervisor' | 'worker' | 'user';
  department?: string;
  avatar?: string;
  isActive: boolean;
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
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
  status: 'queued' | 'assigned' | 'in_progress' | 'resolved' | 'escalated';
  priority: 'Critical' | 'High' | 'Normal' | 'Low';
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
  coordinates?: { lat: number; lng: number };
  reworkCount?: number;
  feedback?: { rating: number; comment: string; submittedAt: string };
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
  reworkRate: number;
  shift: string;
  currentBuilding: string;
  coordinates: { lat: number; lng: number };
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
  adminRole: string;
  action: string;
  targetType: string;
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
  slaComplianceRate: number;
  reworkRate: number;
  activeWorkers: number;
}

export interface AnalyticsSummary {
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  escalatedIssues: number;
  activeWorkers: number;
  avgSlaCompliance: number;
  avgReworkRate: number;
  avgResolutionTimeMins: number;
}

export interface ResolutionTrend {
  date: string;
  resolved: number;
  escalated: number;
  avgMins: number;
}

const API_BASE = '/api/proxy';
const SESSION_TOKEN_KEY = 'fixly.admin.token';

type ApiSession = { token: string; user: UserAccount };

export class AdminApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') this.token = window.localStorage.getItem(SESSION_TOKEN_KEY);
  }

  private headers(extra?: HeadersInit): Headers {
    const headers = new Headers(extra);
    if (!headers.has('Content-Type') && !(extra instanceof FormData)) headers.set('Content-Type', 'application/json');
    if (this.token) headers.set('Authorization', `Bearer ${this.token}`);
    return headers;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = this.headers(init.headers);
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = data as { message?: string; error?: string };
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }
    return data as T;
  }

  async checkHealth(): Promise<boolean> {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  }

  async login(email: string, password: string): Promise<ApiSession> {
    const session = await this.request<ApiSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.token = session.token;
    window.localStorage.setItem(SESSION_TOKEN_KEY, session.token);
    return session;
  }

  async loginWithGoogle(idToken: string): Promise<ApiSession> {
    const session = await this.request<ApiSession>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    this.token = session.token;
    window.localStorage.setItem(SESSION_TOKEN_KEY, session.token);
    return session;
  }

  async restoreSession(): Promise<UserAccount | null> {
    if (!this.token) return null;
    try {
      const data = await this.request<{ user: UserAccount }>('/auth/me');
      return data.user;
    } catch {
      this.logout();
      return null;
    }
  }

  logout(): void {
    this.token = null;
    window.localStorage.removeItem(SESSION_TOKEN_KEY);
  }

  getUsers(): Promise<{ users: UserAccount[] }> {
    return this.request('/users');
  }

  createUser(user: { name: string; email: string; role: UserAccount['role']; department?: string; password: string }): Promise<{ user: UserAccount }> {
    return this.request('/users', { method: 'POST', body: JSON.stringify(user) });
  }

  updateUser(id: string, user: { name: string; email: string; role: UserAccount['role']; department?: string; password?: string; isActive: boolean }): Promise<{ user: UserAccount }> {
    return this.request(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(user) });
  }

  deleteUser(id: string): Promise<{ success: boolean }> {
    return this.request(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  getNotifications(): Promise<{ notifications: NotificationRecord[]; unreadCount: number }> {
    return this.request('/notifications');
  }

  markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
  }

  markAllNotificationsRead(): Promise<{ success: boolean; updated: number }> {
    return this.request('/notifications/read-all', { method: 'PATCH' });
  }

  sendNotification(input: { title: string; body: string; audience: string; type: string }): Promise<{
    success: boolean;
    recipientCount: number;
    push: { attempted: number; sent: number; failed: number; error?: string };
  }> {
    return this.request('/notifications', { method: 'POST', body: JSON.stringify(input) });
  }

  getIssues(departmentFilter?: string): Promise<{ issues: Issue[]; scopedRole: string; department: string }> {
    const query = departmentFilter && departmentFilter !== 'all' ? `?department=${encodeURIComponent(departmentFilter)}` : '';
    return this.request(`/issues${query}`);
  }

  getEscalations(): Promise<{ escalations: Issue[] }> {
    return this.request('/issues/escalations');
  }

  createIssue(issue: Partial<Issue>): Promise<{ issue: Issue }> {
    return this.request('/issues', { method: 'POST', body: JSON.stringify(issue) });
  }

  updateIssue(id: string, issue: Partial<Issue>): Promise<{ issue: Issue }> {
    return this.request(`/issues/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(issue) });
  }

  deleteIssue(id: string): Promise<{ success: boolean }> {
    return this.request(`/issues/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  getWorkers(departmentFilter?: string): Promise<{ workers: Worker[] }> {
    const query = departmentFilter && departmentFilter !== 'all' ? `?department=${encodeURIComponent(departmentFilter)}` : '';
    return this.request(`/workers${query}`);
  }

  createWorker(worker: Omit<Worker, 'id' | 'rating' | 'jobsCompleted' | 'reworkRate'> & { password: string }): Promise<{ worker: Worker }> {
    return this.request('/workers', { method: 'POST', body: JSON.stringify(worker) });
  }

  updateWorker(id: string, worker: Partial<Worker>): Promise<{ worker: Worker }> {
    return this.request(`/workers/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(worker) });
  }

  deleteWorker(id: string): Promise<{ success: boolean }> {
    return this.request(`/workers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  getShifts(): Promise<{ shifts: ShiftRoster[] }> {
    return this.request('/shifts');
  }

  getAnalytics(departmentFilter?: string): Promise<{ summary: AnalyticsSummary; departments: DepartmentMetrics[]; trends: ResolutionTrend[] }> {
    const query = departmentFilter && departmentFilter !== 'all' ? `?department=${encodeURIComponent(departmentFilter)}` : '';
    return this.request(`/analytics${query}`);
  }

  getAuditLogs(): Promise<{ logs: AuditLog[] }> {
    return this.request('/audit');
  }

  reassignIssue(issueId: string, workerId: string): Promise<{ success: boolean; message: string; issue?: Issue }> {
    return this.request(`/issues/${encodeURIComponent(issueId)}/reassign`, {
      method: 'PATCH',
      body: JSON.stringify({ workerId }),
    });
  }

  updateWorkerShift(workerId: string, shift: string, status: Worker['status']): Promise<{ success: boolean; worker?: Worker }> {
    return this.request(`/workers/${encodeURIComponent(workerId)}/shift`, {
      method: 'PATCH',
      body: JSON.stringify({ shift, status }),
    });
  }

  updateIssueStatus(issueId: string, status: Issue['status']): Promise<{ success: boolean; issue?: Issue }> {
    return this.request(`/issues/${encodeURIComponent(issueId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  getAppConfig(): Promise<{ appName: string; version: string; university: string; updatedAt?: string }> {
    return this.request('/app/config');
  }

  updateAppConfig(data: { appName: string; version: string; university?: string }): Promise<{ success: boolean; appName: string; version: string; university: string; updatedAt?: string }> {
    return this.request('/app/config', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const api = new AdminApiClient();
