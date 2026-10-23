'use client';

import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Map,
  HardHat,
  BarChart3,
  ClipboardList,
  LogOut,
  Users,
  Bell,
  Wifi,
  WifiOff,
  X,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { UserAccount } from '../lib/api';

export type NavTab = 'issues' | 'escalations' | 'map' | 'workers' | 'analytics' | 'audit' | 'users' | 'notifications';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentUser: UserAccount;
  isBackendOnline: boolean;
  issueCount: number;
  escalationCount: number;
  workerCount: number;
  userCount: number;
  onLogout: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  notificationCount: number;
}

const navItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
  { id: 'issues', label: 'Issue queue', icon: LayoutDashboard },
  { id: 'escalations', label: 'Escalations', icon: AlertTriangle },
  { id: 'map', label: 'Live campus map', icon: Map },
  { id: 'workers', label: 'Workers & shifts', icon: HardHat },
  { id: 'analytics', label: 'Analytics & SLA', icon: BarChart3 },
  { id: 'audit', label: 'Audit trail', icon: ClipboardList },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  isBackendOnline,
  issueCount,
  escalationCount,
  workerCount,
  userCount,
  onLogout,
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapsed,
  notificationCount,
}) => {
  const isSuper = currentUser.role === 'super_admin';
  const visibleNavItems = isSuper ? navItems : navItems.filter((item) => item.id !== 'users');
  const roleLabel = currentUser.role
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');

  return (
    <>
      {mobileOpen && <button className="sidebar-backdrop" onClick={onMobileClose} aria-label="Close navigation" />}
      <aside className={`sidebar${mobileOpen ? ' open' : ''}${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fixly-icon.png" alt="" />
          </div>
          <div className="sidebar-brand-copy">
            <div className="sidebar-brand-name">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fixly-wordmark-white.png" alt="Fixly" />
              <span className="sidebar-admin-badge">ADMIN</span>
            </div>
            <div className="sidebar-caption">Super Admin Console</div>
          </div>
          <button
            type="button"
            className="sidebar-collapse"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar to icons'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar to icons'}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
          <button
            type="button"
            className="sidebar-close"
            onClick={onMobileClose}
            aria-label="Close navigation"
            title="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-status-wrap">
          <div className={`sidebar-status${isBackendOnline ? ' online' : ' offline'}`}>
            {isBackendOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>Backend: {isBackendOnline ? 'Online' : 'Offline'}</span>
            {isBackendOnline && <span className="sidebar-status-pulse" />}
          </div>
        </div>

        <div className="sidebar-role">
          <div className="sidebar-section-label">Account role</div>
          <div className="sidebar-active-role">
            <ShieldCheck size={14} />
            <span>{roleLabel}</span>
          </div>
          {!isSuper && <div className="sidebar-scope-note">Scoped: {currentUser.department || 'No department assigned'}</div>}
        </div>

        <div className="sidebar-divider" />
        <nav className="sidebar-nav" aria-label="Admin navigation">
          <div className="sidebar-section-label sidebar-nav-label">Navigation</div>
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            const count = item.id === 'issues' ? issueCount : item.id === 'escalations' ? escalationCount : item.id === 'workers' ? workerCount : item.id === 'users' ? userCount : item.id === 'notifications' ? notificationCount : 0;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onMobileClose();
                }}
                className={`sidebar-nav-item${isActive ? ' active' : ''}`}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
              >
                <Icon size={16} />
                <span className="sidebar-nav-item-label">{item.label}</span>
                {count > 0 && <span className={`sidebar-count${item.id === 'escalations' ? ' danger' : ''}`}>{count}</span>}
                {item.id === 'escalations' && escalationCount > 0 && !isActive && <span className="sidebar-alert-dot" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-account">
          <div className="sidebar-account-info">
            <div className="sidebar-account-avatar">{currentUser.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div>
            <div className="sidebar-account-copy">
              <div className="sidebar-account-name">{currentUser.name}</div>
              <div className="sidebar-account-email">{currentUser.email}</div>
            </div>
          </div>
          <button onClick={onLogout} className="sidebar-logout">
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
