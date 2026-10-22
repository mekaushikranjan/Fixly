'use client';

import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';
import type { Worker } from '../lib/api';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null;
  onConfirm: (workerId: string, shift: string, status: 'available' | 'busy' | 'off_duty') => Promise<void>;
}

const shiftOptions = [
  'Morning (08:00 - 16:00)',
  'Evening (16:00 - 00:00)',
  'Night (00:00 - 08:00)',
];

export const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose, worker, onConfirm }) => {
  const [shift, setShift] = useState(shiftOptions[0]);
  const [status, setStatus] = useState<'available' | 'busy' | 'off_duty'>('available');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !worker) return null;

  const submit = async () => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      await onConfirm(worker.id, shift, status);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Shift change could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <section className="modal-panel compact" role="dialog" aria-modal="true" aria-labelledby="shift-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-heading-icon"><CheckCircle2 size={19} /></div>
          <div className="modal-heading-copy">
            <h2 id="shift-title">Manage shift</h2>
            <p>{worker.name} · {worker.department}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </header>
        <div className="modal-content">
          <div className="worker-modal-identity"><span className="worker-avatar">{worker.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><div><strong>{worker.name}</strong><span>{worker.jobsCompleted} jobs completed · {worker.rating}★ rating</span></div></div>
          <label className="form-label" htmlFor="shift-select">Shift window</label>
          <select id="shift-select" className="input" value={shift} onChange={(event) => setShift(event.target.value)}>
            {shiftOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <fieldset className="status-fieldset">
            <legend className="form-label">Duty status</legend>
            <div className="status-options">
              {(['available', 'busy', 'off_duty'] as const).map((option) => (
                <button key={option} type="button" onClick={() => setStatus(option)} className={`status-option ${option}${status === option ? ' selected' : ''}`}>
                  {option.replaceAll('_', ' ')}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="audit-notice"><ShieldCheck size={16} /><span>Shift and availability changes are recorded in the audit trail.</span></div>
          {errorMessage && <div className="modal-error" role="alert">{errorMessage}</div>}
        </div>
        <footer className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" onClick={() => void submit()} disabled={submitting}>
            <CheckCircle2 size={15} />{submitting ? 'Saving…' : 'Save changes'}
          </button>
        </footer>
      </section>
    </div>
  );
};
