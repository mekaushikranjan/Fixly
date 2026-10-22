'use client';

import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api, type UserAccount } from '../lib/api';

interface LoginProps {
  onLogin: (user: UserAccount) => void;
}

export const LoginPage: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await api.login(email.trim(), password);
      if (session.user.role !== 'super_admin' && session.user.role !== 'department_supervisor') {
        api.logout();
        throw new Error('This portal is available to Super Admins and Department Supervisors only.');
      }
      onLogin(session.user);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="login-logo" src="/fixly-logo.png" alt="Fixly Logo" />
          <div className="login-portal-label">
            <span className="login-status-dot" />
            <span>Admin &amp; Supervisor Portal</span>
          </div>
          <p className="login-tagline">Campus Civic Operations Console</p>
        </div>

        <div className="login-notice">
          <ShieldCheck size={16} />
          <p>Sign in with an active account. All account and operational changes are recorded in the audit trail.</p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <label className="form-label" htmlFor="admin-email">Email address</label>
            <input
              id="admin-email"
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@campus.edu"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="admin-password">Password</label>
            <div className="password-field">
              <input
                id="admin-password"
                className="input password-input"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="login-submit">
            {loading ? (
              <><span className="loading-spinner" />Authenticating...</>
            ) : (
              <><ShieldCheck size={16} />Sign in to console</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
