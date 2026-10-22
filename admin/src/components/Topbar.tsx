'use client';

import React from 'react';
import { Menu, RefreshCw, Bell, Search, Settings } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onOpenMobile: () => void;
  onRefresh: () => void;
  loading: boolean;
  searchValue: string;
  onSearchChange: (v: string) => void;
  showSearch?: boolean;
  notificationCount: number;
  onOpenNotifications: () => void;
  onOpenSettings?: () => void;
  appVersion?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  subtitle,
  onOpenMobile,
  onRefresh,
  loading,
  searchValue,
  onSearchChange,
  showSearch = true,
  notificationCount,
  onOpenNotifications,
  onOpenSettings,
  appVersion,
}) => (
  <div className="topbar">
    <button
      onClick={onOpenMobile}
      className="mobile-hamburger icon-button"
      aria-label="Open navigation menu"
    >
      <Menu size={18} />
    </button>

    <div className={`topbar-title${showSearch ? '' : ' topbar-title-grow'}`}>
      <div className="topbar-heading">{title}</div>
      {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
    </div>

    {showSearch && (
      <div className="topbar-search">
        <Search size={14} className="topbar-search-icon" />
        <input
          className="input topbar-search-input"
          placeholder="Search this section..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    )}

    <div className="topbar-actions">
      {onOpenSettings && (
        <button
          className="icon-button"
          aria-label="Mobile App Version & Settings"
          title={`Mobile App Version ${appVersion ? `(v${appVersion})` : ''}`}
          onClick={onOpenSettings}
        >
          <Settings size={16} />
        </button>
      )}

      <button
        className="icon-button"
        aria-label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ''}`}
        title="Notifications"
        onClick={onOpenNotifications}
      >
        <Bell size={16} />
        {notificationCount > 0 && <span className="notification-dot" />}
      </button>

      <button
        onClick={onRefresh}
        disabled={loading}
        className="icon-button"
        title="Refresh data"
        aria-label="Refresh data"
      >
        <RefreshCw className={loading ? 'is-spinning' : ''} size={16} />
      </button>
    </div>
  </div>
);
