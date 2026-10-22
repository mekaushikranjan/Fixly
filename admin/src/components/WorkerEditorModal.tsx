'use client';

import React, { useState } from 'react';
import { HardHat, Save, X } from 'lucide-react';
import type { Worker } from '../lib/api';

export type WorkerFormData = {
  name: string;
  email: string;
  phone: string;
  department: string;
  shift: string;
  currentBuilding: string;
  status: Worker['status'];
  rating: string;
  jobsCompleted: string;
  reworkRate: string;
  latitude: string;
  longitude: string;
  password: string;
};

interface WorkerEditorModalProps {
  worker: Worker | null;
  onClose: () => void;
  onSave: (data: WorkerFormData) => Promise<void>;
}

export const WorkerEditorModal: React.FC<WorkerEditorModalProps> = ({ worker, onClose, onSave }) => {
  const [form, setForm] = useState<WorkerFormData>({
    name: worker?.name || '',
    email: worker?.email || '',
    phone: worker?.phone || '',
    department: worker?.department || '',
    shift: worker?.shift || '',
    currentBuilding: worker?.currentBuilding || '',
    status: worker?.status || 'available',
    rating: String(worker?.rating ?? 0),
    jobsCompleted: String(worker?.jobsCompleted ?? 0),
    reworkRate: String(worker?.reworkRate ?? 0),
    latitude: worker ? String(worker.coordinates.lat) : '',
    longitude: worker ? String(worker.coordinates.lng) : '',
    password: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const change = (field: keyof WorkerFormData, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Worker could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <form className="modal-panel record-editor" role="dialog" aria-modal="true" aria-labelledby="worker-editor-title" onSubmit={(event) => void submit(event)} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-heading-icon"><HardHat size={19} /></div>
          <div className="modal-heading-copy"><h2 id="worker-editor-title">{worker ? 'Edit technician' : 'Add technician'}</h2><p>Worker data and shift changes are saved and audited.</p></div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </header>
        <div className="modal-content record-form-grid">
          <label><span className="form-label">Full name</span><input className="input" value={form.name} onChange={(event) => change('name', event.target.value)} required /></label>
          <label><span className="form-label">Email</span><input className="input" type="email" value={form.email} onChange={(event) => change('email', event.target.value)} required /></label>
          <label><span className="form-label">Phone</span><input className="input" type="tel" value={form.phone} onChange={(event) => change('phone', event.target.value)} required /></label>
          <label><span className="form-label">Department</span><input className="input" value={form.department} onChange={(event) => change('department', event.target.value)} required /></label>
          <label><span className="form-label">Shift</span><input className="input" value={form.shift} onChange={(event) => change('shift', event.target.value)} required /></label>
          <label><span className="form-label">Current building</span><input className="input" value={form.currentBuilding} onChange={(event) => change('currentBuilding', event.target.value)} required /></label>
          <label><span className="form-label">Duty status</span><select className="input" value={form.status} onChange={(event) => change('status', event.target.value as Worker['status'])}>
            <option value="available">Available</option><option value="busy">Busy</option><option value="off_duty">Off duty</option>
          </select></label>
          <label><span className="form-label">Latitude</span><input className="input" type="number" step="any" value={form.latitude} onChange={(event) => change('latitude', event.target.value)} required /></label>
          <label><span className="form-label">Longitude</span><input className="input" type="number" step="any" value={form.longitude} onChange={(event) => change('longitude', event.target.value)} required /></label>
          {worker && <>
            <label><span className="form-label">Rating</span><input className="input" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(event) => change('rating', event.target.value)} /></label>
            <label><span className="form-label">Jobs completed</span><input className="input" type="number" min="0" step="1" value={form.jobsCompleted} onChange={(event) => change('jobsCompleted', event.target.value)} /></label>
            <label><span className="form-label">Rework rate (%)</span><input className="input" type="number" min="0" step="0.1" value={form.reworkRate} onChange={(event) => change('reworkRate', event.target.value)} /></label>
          </>}
          {!worker && <label className="record-form-wide"><span className="form-label">Initial account password</span><input className="input" type="password" value={form.password} onChange={(event) => change('password', event.target.value)} minLength={12} required autoComplete="new-password" /></label>}
          {error && <div className="modal-error record-form-wide" role="alert">{error}</div>}
        </div>
        <footer className="modal-footer">
          <span className="record-footer-note">Coordinates locate this technician on the map</span>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}><Save size={15} />{saving ? 'Saving…' : 'Save technician'}</button>
        </footer>
      </form>
    </div>
  );
};
