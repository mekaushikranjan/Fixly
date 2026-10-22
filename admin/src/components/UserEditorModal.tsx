'use client';

import React, { useState } from 'react';
import { Save, ShieldCheck, UserRound, X } from 'lucide-react';
import type { UserAccount } from '../lib/api';

type UserFormData = {
  name: string;
  email: string;
  role: UserAccount['role'];
  department: string;
  password: string;
  isActive: boolean;
};

interface UserEditorModalProps {
  user: UserAccount | null;
  onClose: () => void;
  onSave: (data: UserFormData) => Promise<void>;
}

export const UserEditorModal: React.FC<UserEditorModalProps> = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState<UserFormData>({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'user',
    department: user?.department || '',
    password: '',
    isActive: user?.isActive ?? true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const change = (field: keyof UserFormData, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Account could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <form className="modal-panel record-editor" role="dialog" aria-modal="true" aria-labelledby="user-editor-title" onSubmit={(event) => void submit(event)} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-heading-icon"><UserRound size={19} /></div>
          <div className="modal-heading-copy"><h2 id="user-editor-title">{user ? 'Edit account' : 'Create account'}</h2><p>Account changes are saved to the local database and audit trail.</p></div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </header>
        <div className="modal-content record-form-grid">
          <label><span className="form-label">Full name</span><input className="input" value={form.name} onChange={(event) => change('name', event.target.value)} minLength={2} maxLength={120} required /></label>
          <label><span className="form-label">Email</span><input className="input" type="email" value={form.email} onChange={(event) => change('email', event.target.value)} required /></label>
          <label><span className="form-label">Role</span><select className="input" value={form.role} disabled={user?.role === 'worker'} onChange={(event) => change('role', event.target.value as UserAccount['role'])}>
            {user?.role === 'worker' && <option value="worker">Worker (managed in technician roster)</option>}
            <option value="user">User</option><option value="department_supervisor">Department supervisor</option><option value="super_admin">Super Admin</option>
          </select></label>
          <label><span className="form-label">Department</span><input className="input" value={form.department} onChange={(event) => change('department', event.target.value)} placeholder="Optional except for supervisors and workers" required={form.role === 'department_supervisor' || form.role === 'worker'} /></label>
          <label className="record-form-wide"><span className="form-label">{user ? 'New password (leave blank to keep current)' : 'Initial password'}</span><input className="input" type="password" value={form.password} onChange={(event) => change('password', event.target.value)} minLength={12} required={!user} autoComplete="new-password" /></label>
          {user && <label className="record-checkbox"><input type="checkbox" checked={form.isActive} onChange={(event) => change('isActive', event.target.checked)} />Account is active</label>}
          {!user && <p className="record-form-wide field-hint">Passwords must be at least 12 characters. Share initial credentials securely with the account owner.</p>}
          {error && <div className="modal-error record-form-wide" role="alert">{error}</div>}
        </div>
        <footer className="modal-footer">
          <span className="record-footer-note"><ShieldCheck size={14} />Access changes are audited</span>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}><Save size={15} />{saving ? 'Saving…' : 'Save account'}</button>
        </footer>
      </form>
    </div>
  );
};
