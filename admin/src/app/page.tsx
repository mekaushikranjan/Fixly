'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  Building2,
  CheckCircle2,
  Clock3,
  HardHat,
  Layers3,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Trash2,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import { AnalyticsTab } from '../components/AnalyticsTab';
import { CampusMap } from '../components/CampusMap';
import { IssueEditorModal, type IssueFormData } from '../components/IssueEditorModal';
import { LoginPage } from '../components/LoginPage';
import { NotificationsPanel } from '../components/NotificationsPanel';
import { ReassignModal } from '../components/ReassignModal';
import { Sidebar, type NavTab } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { UserEditorModal } from '../components/UserEditorModal';
import { WorkerEditorModal, type WorkerFormData } from '../components/WorkerEditorModal';
import { AppSettingsModal } from '../components/AppSettingsModal';
import { api, type AnalyticsSummary, type AuditLog, type DepartmentMetrics, type Issue, type NotificationRecord, type ResolutionTrend, type ShiftRoster, type UserAccount, type Worker } from '../lib/api';

type Role = 'super_admin' | 'department_supervisor';

const tabCopy: Record<NavTab, { title: string; subtitle: string }> = {
  issues: { title: 'Issue queue', subtitle: 'Monitor and dispatch campus maintenance requests.' },
  escalations: { title: 'Escalations', subtitle: 'Prioritize critical incidents and SLA breaches.' },
  map: { title: 'Live campus map', subtitle: 'Inspect reported incidents and technician locations.' },
  workers: { title: 'Workers & shifts', subtitle: 'Manage technician availability and shift coverage.' },
  analytics: { title: 'Analytics & SLA', subtitle: 'Review service quality, workload, and department performance.' },
  audit: { title: 'Audit trail', subtitle: 'Review administrative actions and operational changes.' },
  users: { title: 'User management', subtitle: 'Review campus accounts, roles, and department access.' },
  notifications: { title: 'Notifications', subtitle: 'Send operational updates and review your notification inbox.' },
};

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

function statusClass(status: string) {
  return `badge badge-${status}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ElementType;
  tone?: 'primary' | 'danger' | 'success' | 'warning';
}) {
  return (
    <article className="kpi-card">
      <div className="kpi-card-top">
        <span className="kpi-label">{label}</span>
        <span className={`kpi-icon ${tone}`}><Icon size={18} /></span>
      </div>
      <div className="kpi-value">{value}</div>
      <p className="kpi-detail">{detail}</p>
    </article>
  );
}

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const currentRole: Role = currentUser?.role === 'department_supervisor' ? 'department_supervisor' : 'super_admin';
  const currentDepartment = currentUser?.department || '';
  const [activeTab, setActiveTab] = useState<NavTab>('issues');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [escalations, setEscalations] = useState<Issue[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [shifts, setShifts] = useState<ShiftRoster[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [analytics, setAnalytics] = useState<{ summary: AnalyticsSummary; departments: DepartmentMetrics[]; trends: ResolutionTrend[] } | null>(null);
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [universityName, setUniversityName] = useState('Lovely Professional University');

  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastTone, setToastTone] = useState<'success' | 'error'>('success');
  const [reassignIssue, setReassignIssue] = useState<Issue | null>(null);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [creatingWorker, setCreatingWorker] = useState(false);

  const notify = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastTone(tone);
    window.setTimeout(() => setToastMessage(''), 4000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const online = await api.checkHealth();
      setBackendOnline(online);
      const [issuesResponse, escalationResponse, workerResponse, shiftsResponse, auditResponse, analyticsResponse, usersResponse, notificationsResponse] = await Promise.all([
        api.getIssues(),
        api.getEscalations(),
        api.getWorkers(),
        api.getShifts(),
        api.getAuditLogs(),
        api.getAnalytics(),
        currentRole === 'super_admin' ? api.getUsers() : Promise.resolve({ users: [] }),
        api.getNotifications(),
      ]);
      setIssues(issuesResponse.issues);
      setEscalations(escalationResponse.escalations);
      setWorkers(workerResponse.workers);
      setShifts(shiftsResponse.shifts);
      setAuditLogs(auditResponse.logs);
      setAnalytics(analyticsResponse);
      setUsers(usersResponse.users);
      setNotifications(notificationsResponse.notifications);
      setNotificationCount(notificationsResponse.unreadCount);

      // Load live mobile app version & university setting
      api.getAppConfig().then((cfg) => {
        if (cfg.version) setAppVersion(cfg.version);
        if (cfg.university) setUniversityName(cfg.university);
      }).catch(() => {});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load dashboard data.';
      console.error('Failed to load dashboard data:', error);
      setLoadError(message);
      notify(`Dashboard data could not be refreshed: ${message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentRole, notify]);

  useEffect(() => {
    let active = true;
    void api.restoreSession().then((user) => {
      if (!active) return;
      if (user && (user.role === 'super_admin' || user.role === 'department_supervisor')) {
        setCurrentUser(user);
      } else if (user) {
        api.logout();
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem('fixly.admin.sidebar-collapsed') === 'true');
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      window.localStorage.setItem('fixly.admin.sidebar-collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!currentUser) return;
    const initialLoad = window.setTimeout(() => void loadData(), 0);
    const refreshTimer = window.setInterval(() => void loadData(), 30_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(refreshTimer);
    };
  }, [currentUser, loadData]);

  const handleReassign = async (issueId: string, workerId: string) => {
    const result = await api.reassignIssue(issueId, workerId);
    notify(result.message || 'Technician assignment updated.');
    await loadData();
  };

  const handleIssueSave = async (data: IssueFormData) => {
    if (editingIssue) {
      await api.updateIssue(editingIssue.id, data);
      notify('Issue changes saved.');
    } else {
      await api.createIssue(data);
      notify('Issue created.');
    }
    setEditingIssue(null);
    setCreatingIssue(false);
    await loadData();
  };

  const handleUserSave = async (data: { name: string; email: string; role: UserAccount['role']; department: string; password: string; isActive: boolean }) => {
    if (editingUser) {
      await api.updateUser(editingUser.id, { ...data, password: data.password || undefined });
      notify('Account changes saved.');
    } else {
      await api.createUser({ ...data, department: data.department || undefined });
      notify('Account created.');
    }
    setEditingUser(null);
    setCreatingUser(false);
    await loadData();
  };

  const handleWorkerSave = async (data: WorkerFormData) => {
    const details = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      department: data.department.trim(),
      shift: data.shift.trim(),
      currentBuilding: data.currentBuilding.trim(),
      status: data.status,
      rating: Number(data.rating),
      jobsCompleted: Number(data.jobsCompleted),
      reworkRate: Number(data.reworkRate),
      coordinates: { lat: Number(data.latitude), lng: Number(data.longitude) },
    };
    if (editingWorker) {
      await api.updateWorker(editingWorker.id, details);
      notify('Technician changes saved.');
    } else {
      await api.createWorker({ ...details, password: data.password });
      notify('Technician and worker account created.');
    }
    setEditingWorker(null);
    setCreatingWorker(false);
    await loadData();
  };

  const handleDeleteIssue = async (issue: Issue) => {
    if (!window.confirm(`Permanently delete issue #${issue.ticketId}?`)) return;
    try {
      await api.deleteIssue(issue.id);
      notify(`Issue #${issue.ticketId} deleted.`);
      await loadData();
    } catch (error) {
      notify(`Could not delete issue: ${error instanceof Error ? error.message : 'Unexpected error'}`, 'error');
    }
  };

  const handleDeleteWorker = async (worker: Worker) => {
    if (!window.confirm(`Delete technician ${worker.name}? Workers assigned to open issues cannot be deleted.`)) return;
    try {
      await api.deleteWorker(worker.id);
      notify(`Technician ${worker.name} deleted.`);
      await loadData();
    } catch (error) {
      notify(`Could not delete technician: ${error instanceof Error ? error.message : 'Unexpected error'}`, 'error');
    }
  };

  const handleDeleteUser = async (user: UserAccount) => {
    if (!window.confirm(`Permanently delete account ${user.email}?`)) return;
    try {
      await api.deleteUser(user.id);
      notify(`Account ${user.email} deleted.`);
      await loadData();
    } catch (error) {
      notify(`Could not delete account: ${error instanceof Error ? error.message : 'Unexpected error'}`, 'error');
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredIssues = useMemo(() => issues.filter((issue) => [
    issue.title, issue.ticketId, issue.building, issue.reportedBy, issue.department, issue.status,
  ].some((value) => value.toLowerCase().includes(query))), [issues, query]);
  const filteredEscalations = useMemo(() => escalations.filter((issue) => [
    issue.title, issue.ticketId, issue.building, issue.reportedBy, issue.department,
  ].some((value) => value.toLowerCase().includes(query))), [escalations, query]);
  const filteredWorkers = useMemo(() => workers.filter((worker) => [
    worker.name, worker.department, worker.currentBuilding, worker.status,
  ].some((value) => value.toLowerCase().includes(query))), [workers, query]);
  const filteredUsers = useMemo(() => users.filter((user) => [
    user.name, user.email, user.role, user.department || '',
  ].some((value) => value.toLowerCase().includes(query))), [users, query]);
  const activeWorkers = workers.filter((worker) => worker.status !== 'off_duty').length;
  const availableWorkers = workers.filter((worker) => worker.status === 'available').length;
  const busyWorkers = workers.filter((worker) => worker.status === 'busy').length;
  const averageWorkerRating = workers.length
    ? (workers.reduce((total, worker) => total + worker.rating, 0) / workers.length).toFixed(1)
    : '—';
  const activeIssues = issues.filter((issue) => issue.status !== 'resolved');
  const uniqueAdmins = new Set(auditLogs.map((entry) => entry.adminId)).size;
  const uniqueAuditActions = new Set(auditLogs.map((entry) => entry.action)).size;
  const sectionMetrics: Partial<Record<NavTab, { label: string; value: string | number; detail: string; icon: React.ElementType; tone?: 'primary' | 'danger' | 'success' | 'warning' }[]>> = {
    issues: [
      {
        label: currentRole === 'super_admin' ? 'Campus queue' : `${currentDepartment} queue`,
        value: issues.length,
        detail: `${issues.filter((issue) => issue.status === 'in_progress').length} currently in progress`,
        icon: Layers3,
      },
      {
        label: 'Escalations',
        value: escalations.length,
        detail: escalations.length > 0 ? 'Requires immediate attention' : 'No urgent incidents',
        icon: AlertTriangle,
        tone: escalations.length > 0 ? 'danger' : 'success',
      },
      {
        label: 'Active workers',
        value: `${activeWorkers} / ${workers.length}`,
        detail: `${availableWorkers} available for dispatch`,
        icon: HardHat,
        tone: 'warning',
      },
      {
        label: 'SLA compliance',
        value: `${analytics?.summary.avgSlaCompliance ?? '—'}${analytics ? '%' : ''}`,
        detail: analytics ? `Average resolution: ${analytics.summary.avgResolutionTimeMins} min` : 'Waiting for analytics data',
        icon: TrendingUp,
        tone: 'success',
      },
    ],
    escalations: [
      { label: 'Open escalations', value: escalations.length, detail: 'Incidents requiring follow-up', icon: AlertTriangle, tone: 'danger' },
      { label: 'Critical priority', value: escalations.filter((issue) => issue.priority === 'Critical').length, detail: 'Highest-priority escalations', icon: ShieldCheck, tone: 'danger' },
      { label: 'In progress', value: escalations.filter((issue) => issue.status === 'in_progress').length, detail: 'Escalations with active work', icon: Clock3, tone: 'warning' },
      { label: 'Awaiting assignment', value: escalations.filter((issue) => !issue.assignedWorkerId).length, detail: 'No technician assigned', icon: UserRoundCheck },
    ],
    map: [
      { label: 'Active issues', value: activeIssues.length, detail: 'Shown on the campus map', icon: AlertTriangle, tone: 'warning' },
      { label: 'Technicians', value: workers.length, detail: `${availableWorkers} currently available`, icon: HardHat, tone: 'success' },
      { label: 'Affected buildings', value: new Set(activeIssues.map((issue) => issue.building)).size, detail: 'With active reports', icon: Building2 },
    ],
    workers: [
      { label: 'Technicians', value: workers.length, detail: 'In the campus roster', icon: HardHat },
      { label: 'Available', value: availableWorkers, detail: 'Ready for dispatch', icon: CheckCircle2, tone: 'success' },
      { label: 'On a job', value: busyWorkers, detail: 'Currently assigned', icon: Clock3, tone: 'warning' },
      { label: 'Average rating', value: averageWorkerRating, detail: 'Across all technicians', icon: TrendingUp },
    ],
    audit: [
      { label: 'Audit events', value: auditLogs.length, detail: 'Recorded administrative actions', icon: Layers3 },
      { label: 'Action types', value: uniqueAuditActions, detail: 'Distinct recorded actions', icon: Clock3, tone: 'warning' },
      { label: 'Administrators', value: uniqueAdmins, detail: 'With recorded activity', icon: Users },
      { label: 'Departments', value: new Set(auditLogs.map((entry) => entry.department).filter(Boolean)).size, detail: 'Represented in the audit trail', icon: Building2 },
    ],
    users: [
      { label: 'Total accounts', value: users.length, detail: 'Campus accounts in directory', icon: Users },
      { label: 'Students & users', value: users.filter((user) => user.role === 'user').length, detail: 'Standard user accounts', icon: UserRoundCheck },
      { label: 'Supervisors', value: users.filter((user) => user.role === 'department_supervisor').length, detail: 'Department access accounts', icon: ShieldCheck, tone: 'warning' },
      { label: 'Workers', value: users.filter((user) => user.role === 'worker').length, detail: 'Worker accounts', icon: HardHat },
    ],
  };
  const pageInfo = tabCopy[activeTab];
  const showSearch = ['issues', 'escalations', 'workers', 'audit', 'users'].includes(activeTab);

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  return (
    <div className="admin-app">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        isBackendOnline={backendOnline}
        issueCount={issues.length}
        escalationCount={escalations.length}
        workerCount={workers.length}
        userCount={users.length}
        notificationCount={notificationCount}
        onLogout={() => {
          api.logout();
          setCurrentUser(null);
        }}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
      />

      <div className={`admin-main${sidebarCollapsed ? ' admin-main-collapsed' : ''}`}>
        <Topbar
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onOpenMobile={() => setSidebarOpen(true)}
          onRefresh={() => void loadData()}
          loading={loading}
          notificationCount={notificationCount}
          onOpenNotifications={() => setActiveTab('notifications')}
          onOpenSettings={() => setAppSettingsOpen(true)}
          appVersion={appVersion}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          showSearch={showSearch}
        />

        <main className="dashboard-content">
          <div className="page-intro">
            <div>
              <span className="eyebrow"><ShieldCheck size={14} /> FIXLY CAMPUS OPERATIONS</span>
              <h1>{pageInfo.title}</h1>
              <p>{currentRole === 'super_admin' ? 'Campus-wide overview' : `${currentDepartment} department overview`} · Updated automatically every 30 seconds</p>
            </div>
            <div className="page-intro-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setAppSettingsOpen(true)}
                title="Edit mobile app version & university setting"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              >
                <span>Mobile App: <strong>v{appVersion}</strong></span>
              </button>
              <span className={`connection-pill ${backendOnline ? 'online' : 'offline'}`}>
                <span className="connection-dot" />
                {backendOnline ? 'Service connected' : 'Service unavailable'}
              </span>
              <button className="btn btn-secondary refresh-button" onClick={() => void loadData()} disabled={loading}>
                <RefreshCw size={15} className={loading ? 'is-spinning' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {loadError && (
            <div className="inline-notice error-notice" role="status">
              <AlertTriangle size={17} />
              <span>Showing the most recently loaded data. Refresh failed: {loadError}</span>
              <button className="notice-retry" onClick={() => void loadData()}>Try again</button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <NotificationsPanel
              notifications={notifications}
              unreadCount={notificationCount}
              canSend={currentRole === 'super_admin'}
              onRefresh={() => void loadData()}
            />
          )}

          {sectionMetrics[activeTab] && (
            <section className="kpi-grid" aria-label={`${pageInfo.title} summary`}>
              {sectionMetrics[activeTab]?.map((metric) => (
                <KpiCard key={metric.label} {...metric} />
              ))}
            </section>
          )}

          {activeTab === 'issues' && (
            <section className="content-section">
              <div className="section-heading">
                <div><h2>Active issues</h2><p>{filteredIssues.length} matching maintenance requests</p></div>
                <button className="btn btn-primary" onClick={() => setCreatingIssue(true)}><Plus size={15} />New issue</button>
              </div>
              {loading && issues.length === 0 ? <LoadingState /> : filteredIssues.length ? (
                <div className="issue-list">
                  {filteredIssues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} onAssign={() => setReassignIssue(issue)} onEdit={() => setEditingIssue(issue)} onDelete={() => void handleDeleteIssue(issue)} />
                  ))}
                </div>
              ) : <EmptyState title="No issues found" detail="Try changing the search or department filter." />}
            </section>
          )}

          {activeTab === 'escalations' && (
            <section className="content-section">
              <div className="section-heading">
                <div><h2>Escalated incidents</h2><p>Resolve urgent campus issues before their SLA deadline.</p></div>
              </div>
              {loading && escalations.length === 0 ? <LoadingState /> : filteredEscalations.length ? (
                <div className="issue-list">
                  {filteredEscalations.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} onAssign={() => setReassignIssue(issue)} onEdit={() => setEditingIssue(issue)} onDelete={() => void handleDeleteIssue(issue)} urgent />
                  ))}
                </div>
              ) : <EmptyState title="No escalations" detail="There are no escalated issues matching the current filters." />}
            </section>
          )}

          {activeTab === 'map' && (
            <CampusMap
              issues={issues}
              workers={workers}
              onSelectIssue={setReassignIssue}
              onSelectWorker={setEditingWorker}
            />
          )}

          {activeTab === 'workers' && (
            <section className="content-section">
              {shifts.length > 0 && (
                <div className="card table-card">
                  <div className="section-heading table-heading"><div><h2>Today&apos;s shift roster</h2><p>{shifts.length} scheduled shifts</p></div></div>
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead><tr><th>Worker</th><th>Department</th><th>Shift</th><th>Building</th><th>Status</th></tr></thead>
                      <tbody>{shifts.map((shift) => (
                        <tr key={shift.id}>
                          <td className="table-primary">{shift.workerName}</td><td>{shift.department}</td><td>{shift.shift}</td><td>{shift.buildingAssigned}</td>
                          <td><span className={statusClass(shift.status === 'active' ? 'resolved' : shift.status === 'scheduled' ? 'assigned' : 'queued')}>{shift.status}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="section-heading">
                <div><h2>Technician roster</h2><p>{filteredWorkers.length} workers match your search</p></div>
                {currentRole === 'super_admin' && <button className="btn btn-primary" onClick={() => setCreatingWorker(true)}><Plus size={15} />Add technician</button>}
              </div>
              {loading && workers.length === 0 ? <LoadingState /> : filteredWorkers.length ? (
                <div className="worker-grid">
                  {filteredWorkers.map((worker) => (
                    <article className="worker-card card" key={worker.id}>
                      <div className="worker-card-header">
                        <div className="worker-identity">
                          <div className="worker-avatar">{initials(worker.name)}</div>
                          <div className="worker-name-wrap"><h3>{worker.name}</h3><p>{worker.department} technician</p></div>
                        </div>
                        <span className={statusClass(worker.status === 'available' ? 'resolved' : worker.status === 'busy' ? 'pending' : 'queued')}>{statusLabel(worker.status)}</span>
                      </div>
                      <div className="worker-stats">
                        <div><strong>{worker.rating}★</strong><span>Rating</span></div>
                        <div><strong>{worker.jobsCompleted}</strong><span>Resolved</span></div>
                        <div><strong>{worker.reworkRate}%</strong><span>Rework</span></div>
                      </div>
                      <div className="worker-details"><span><MapPin size={14} />{worker.currentBuilding}</span><span><Clock3 size={14} />{worker.shift}</span></div>
                      <div className="worker-card-actions">
                        <button className="btn btn-secondary" onClick={() => setEditingWorker(worker)}><Pencil size={14} />Manage technician</button>
                        {currentRole === 'super_admin' && <button className="icon-button danger-action" onClick={() => void handleDeleteWorker(worker)} aria-label={`Delete ${worker.name}`} title="Delete technician"><Trash2 size={15} /></button>}
                      </div>
                    </article>
                  ))}
                </div>
              ) : <EmptyState title="No workers found" detail="Try changing the search or department filter." />}
            </section>
          )}

          {activeTab === 'analytics' && (
            analytics ? <AnalyticsTab summary={analytics.summary} departments={analytics.departments} trends={analytics.trends} /> : (
              loading ? <LoadingState /> : <EmptyState title="Analytics unavailable" detail="The service did not return analytics data." />
            )
          )}

          {activeTab === 'audit' && (
            <section className="content-section card table-card">
              <div className="section-heading table-heading"><div><h2>Administrative activity</h2><p>{auditLogs.length} recorded events</p></div></div>
              <div className="table-scroll">
                <table className="data-table audit-table">
                  <thead><tr><th>Action</th><th>Administrator</th><th>Target</th><th>Department</th><th>Date &amp; time</th></tr></thead>
                  <tbody>
                    {auditLogs.filter((entry) => [entry.action, entry.adminName, entry.targetType, entry.targetId, entry.details, entry.department || ''].some((value) => value.toLowerCase().includes(query))).map((entry) => (
                      <tr key={entry.id}>
                        <td><strong className="audit-action">{entry.action}</strong><span className="audit-details">{entry.details}</span></td>
                        <td>{entry.adminName}<span className="audit-details">{entry.adminRole}</span></td>
                        <td>{entry.targetType}<span className="audit-details">{entry.targetId}</span></td>
                        <td>{entry.department || 'Campus-wide'}</td>
                        <td>{formatDate(entry.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!auditLogs.length && <EmptyState title="No activity recorded" detail="Administrative events will appear here." />}
              </div>
            </section>
          )}

          {activeTab === 'users' && currentRole === 'super_admin' && (
            <section className="content-section card table-card">
              <div className="section-heading table-heading user-directory-heading">
                <div>
                  <h2>Campus accounts</h2>
                  <p>{filteredUsers.length} of {users.length} accounts match your search</p>
                </div>
                <div className="user-directory-actions">
                  <span className="user-directory-count"><Users size={15} />{users.length} accounts</span>
                  <button className="btn btn-primary" onClick={() => setCreatingUser(true)}><Plus size={15} />Add account</button>
                </div>
              </div>
              {loading && users.length === 0 ? <LoadingState /> : filteredUsers.length ? (
                <div className="table-scroll">
                  <table className="data-table users-table">
                    <thead><tr><th>User</th><th>Email address</th><th>Role</th><th>Department</th><th>Account status</th><th>Actions</th></tr></thead>
                    <tbody>{filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="table-primary user-name-cell"><span className="user-table-avatar">{initials(user.name)}</span>{user.name}</td>
                        <td>{user.email}</td>
                        <td><span className={`user-role-badge ${user.role}`}>{statusLabel(user.role)}</span></td>
                        <td>{user.department || 'Campus-wide'}</td>
                        <td><span className={`user-role-badge ${user.isActive ? 'active' : 'inactive'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td className="record-actions">
                          <button className="icon-button" onClick={() => setEditingUser(user)} aria-label={`Edit ${user.name}`} title="Edit account"><Pencil size={14} /></button>
                          <button className="icon-button danger-action" onClick={() => {
                            const worker = workers.find((item) => item.email.toLowerCase() === user.email.toLowerCase());
                            if (worker) void handleDeleteWorker(worker);
                            else void handleDeleteUser(user);
                          }} aria-label={`Delete ${user.name}`} title={user.role === 'worker' ? 'Delete technician' : 'Delete account'}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <EmptyState title="No accounts found" detail="Try a different name, email, role, or department." />}
            </section>
          )}
        </main>
      </div>

      {toastMessage && <div className={`toast ${toastTone}`} role={toastTone === 'error' ? 'alert' : 'status'}>
        {toastTone === 'error' ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}{toastMessage}
      </div>}
      <ReassignModal
        key={`${reassignIssue?.id || 'closed'}-${Boolean(reassignIssue)}`}
        isOpen={Boolean(reassignIssue)}
        onClose={() => setReassignIssue(null)}
        issue={reassignIssue}
        workers={workers}
        currentRole={currentRole}
        currentDepartment={currentDepartment}
        onConfirm={handleReassign}
      />
      {(editingIssue || creatingIssue) && (
        <IssueEditorModal
        key={editingIssue?.id || 'new-issue'}
        issue={editingIssue}
        defaultDepartment={currentDepartment}
        onClose={() => { setEditingIssue(null); setCreatingIssue(false); }}
        onSave={handleIssueSave}
      />
      )}
      {(editingUser || creatingUser) && (
        <UserEditorModal
        key={editingUser?.id || 'new-user'}
        user={editingUser}
        onClose={() => { setEditingUser(null); setCreatingUser(false); }}
        onSave={handleUserSave}
      />
      )}
      {(editingWorker || creatingWorker) && (
        <WorkerEditorModal
        key={editingWorker?.id || 'new-worker'}
        worker={editingWorker}
        onClose={() => { setEditingWorker(null); setCreatingWorker(false); }}
        onSave={handleWorkerSave}
      />
      )}
      {appSettingsOpen && (
        <AppSettingsModal
          initialVersion={appVersion}
          initialUniversity={universityName}
          onClose={() => setAppSettingsOpen(false)}
          onUpdated={(newVer, newUniv) => {
            setAppVersion(newVer);
            setUniversityName(newUniv);
            notify(`App version updated to v${newVer}`, 'success');
          }}
        />
      )}
    </div>
  );
}

function IssueCard({ issue, onAssign, onEdit, onDelete, urgent = false }: {
  issue: Issue;
  onAssign: () => void;
  onEdit: () => void;
  onDelete: () => void;
  urgent?: boolean;
}) {
  return (
    <article className={`issue-card card${urgent ? ' urgent' : ''}`}>
      <span className={`issue-priority ${issue.priority.toLowerCase()}`} />
      <div className="issue-main">
        <div className="issue-tags">
          <span className="ticket-id">#{issue.ticketId}</span>
          <span className="department-tag">{issue.department}</span>
          <span className={statusClass(issue.status)}>{statusLabel(issue.status)}</span>
          {issue.priority === 'Critical' && <span className="critical-tag"><AlertTriangle size={12} />Critical</span>}
        </div>
        <h3>{issue.title}</h3>
        <p className="issue-description">{issue.description}</p>
        <div className="issue-meta">
          <span><MapPin size={14} />{issue.building} · {issue.floor}, {issue.room}</span>
          <span><UserRoundCheck size={14} />{issue.assignedWorkerName || 'Unassigned'}</span>
          <span><Clock3 size={14} />{formatDate(issue.reportedAt)}</span>
        </div>
      </div>
      <div className="issue-card-actions">
        <button className="btn btn-primary issue-action" onClick={onAssign}>
          <UserRoundCheck size={15} />{issue.assignedWorkerName ? 'Reassign' : 'Assign'}
        </button>
        <button className="icon-button" onClick={onEdit} aria-label={`Edit issue ${issue.ticketId}`} title="Edit issue"><Pencil size={14} /></button>
        <button className="icon-button danger-action" onClick={onDelete} aria-label={`Delete issue ${issue.ticketId}`} title="Delete issue"><Trash2 size={14} /></button>
      </div>
    </article>
  );
}

function LoadingState() {
  return <div className="loading-state" aria-label="Loading"><span /><span /><span /></div>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><span className="empty-icon"><ArrowDownRight size={20} /></span><h3>{title}</h3><p>{detail}</p></div>;
}
