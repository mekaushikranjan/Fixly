'use client';

import React, { useState } from 'react';
import { AlertTriangle, Save, X } from 'lucide-react';
import type { Issue } from '../lib/api';

export type IssueFormData = Pick<Issue, 'title' | 'description' | 'category' | 'department' | 'building' | 'floor' | 'room' | 'priority'> & { status?: Issue['status'] };

interface IssueEditorModalProps {
  issue: Issue | null;
  defaultDepartment?: string;
  onClose: () => void;
  onSave: (data: IssueFormData) => Promise<void>;
}

export const IssueEditorModal: React.FC<IssueEditorModalProps> = ({ issue, defaultDepartment = '', onClose, onSave }) => {
  const [form, setForm] = useState<IssueFormData>({
    title: issue?.title || '',
    description: issue?.description || '',
    category: issue?.category || defaultDepartment,
    department: issue?.department || defaultDepartment,
    building: issue?.building || '',
    floor: issue?.floor || '',
    room: issue?.room || '',
    priority: issue?.priority || 'Normal',
    ...(issue ? { status: issue.status } : {}),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const change = (field: keyof IssueFormData, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Issue could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <form className="modal-panel record-editor" role="dialog" aria-modal="true" aria-labelledby="issue-editor-title" onSubmit={(event) => void submit(event)} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-heading-icon"><AlertTriangle size={19} /></div>
          <div className="modal-heading-copy"><h2 id="issue-editor-title">{issue ? `Edit #${issue.ticketId}` : 'Create issue'}</h2><p>Issue details are stored in the database and changes are audited.</p></div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </header>
        <div className="modal-content record-form-grid">
          <label className="record-form-wide"><span className="form-label">Title</span><input className="input" value={form.title} onChange={(event) => change('title', event.target.value)} maxLength={180} required /></label>
          <label className="record-form-wide"><span className="form-label">Description</span><textarea className="input record-textarea" value={form.description} onChange={(event) => change('description', event.target.value)} rows={3} required /></label>
          <label><span className="form-label">Department</span><input className="input" value={form.department} onChange={(event) => change('department', event.target.value)} required /></label>
          <label><span className="form-label">Category</span><input className="input" value={form.category} onChange={(event) => change('category', event.target.value)} required /></label>
          <label><span className="form-label">Building</span><input className="input" value={form.building} onChange={(event) => change('building', event.target.value)} required /></label>
          <label><span className="form-label">Floor</span><input className="input" value={form.floor} onChange={(event) => change('floor', event.target.value)} /></label>
          <label><span className="form-label">Room / area</span><input className="input" value={form.room} onChange={(event) => change('room', event.target.value)} /></label>
          <label><span className="form-label">Priority</span><select className="input" value={form.priority} onChange={(event) => change('priority', event.target.value as Issue['priority'])}>
            {(['Critical', 'High', 'Normal', 'Low'] as const).map((priority) => <option key={priority}>{priority}</option>)}
          </select></label>
          {issue && <label><span className="form-label">Status</span><select className="input" value={form.status} onChange={(event) => change('status', event.target.value as Issue['status'])}>
            {(['queued', 'assigned', 'in_progress', 'resolved', 'escalated'] as const).map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
          </select></label>}
          {error && <div className="modal-error record-form-wide" role="alert">{error}</div>}
        </div>
        <footer className="modal-footer">
          <span className="record-footer-note">Required fields are marked by the form</span>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}><Save size={15} />{saving ? 'Saving…' : 'Save issue'}</button>
        </footer>
      </form>
    </div>
  );
};
