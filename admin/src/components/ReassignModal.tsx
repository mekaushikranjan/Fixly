'use client';

import React, { useState } from 'react';
import { AlertCircle, ShieldCheck, UserRoundCheck, X } from 'lucide-react';
import type { Issue, Worker } from '../lib/api';

interface ReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  workers: Worker[];
  currentRole: 'super_admin' | 'department_supervisor';
  currentDepartment?: string;
  onConfirm: (issueId: string, workerId: string) => Promise<void>;
}

export const ReassignModal: React.FC<ReassignModalProps> = ({
  isOpen,
  onClose,
  issue,
  workers,
  currentRole,
  currentDepartment,
  onConfirm,
}) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const eligibleWorkers = workers.filter((worker) => (
    worker.department.toLowerCase() === issue?.department.toLowerCase()
    && (currentRole === 'super_admin' || worker.department.toLowerCase() === currentDepartment?.toLowerCase())
    && (worker.status === 'available' || worker.id === issue?.assignedWorkerId)
  ));

  if (!isOpen || !issue) return null;

  const submit = async () => {
    if (!selectedWorkerId) {
      setErrorMessage('Select a technician to continue.');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      await onConfirm(issue.id, selectedWorkerId);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Assignment could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="reassign-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-heading-icon"><UserRoundCheck size={19} /></div>
          <div className="modal-heading-copy">
            <h2 id="reassign-title">{issue.status === 'escalated' ? 'Emergency dispatch' : 'Assign technician'}</h2>
            <p>Ticket #{issue.ticketId} · {issue.department}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </header>
        <div className="modal-content">
          <div className="modal-summary">
            <span className={statusClass(issue.status)}>{issue.status.replaceAll('_', ' ')}</span>
            <span className="modal-priority">{issue.priority} priority</span>
            <h3>{issue.title}</h3>
            <p>{issue.building} · {issue.floor}, {issue.room}</p>
            <p>Currently assigned: {issue.assignedWorkerName || 'Unassigned'}</p>
          </div>
          <label className="form-label" htmlFor="worker-select">Technician <span>({eligibleWorkers.length} available in department)</span></label>
          <select id="worker-select" className="input" value={selectedWorkerId} onChange={(event) => setSelectedWorkerId(event.target.value)}>
            <option value="">Choose a technician</option>
            {eligibleWorkers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.name} · {worker.status.replaceAll('_', ' ')} · {worker.currentBuilding}
              </option>
            ))}
          </select>
          {!eligibleWorkers.length && <p className="field-hint">No technicians are available in this department.</p>}
          <div className="audit-notice"><ShieldCheck size={16} /><span>This assignment is recorded in the administrative audit trail.</span></div>
          {errorMessage && <div className="modal-error" role="alert"><AlertCircle size={16} />{errorMessage}</div>}
        </div>
        <footer className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" onClick={() => void submit()} disabled={submitting || !eligibleWorkers.length}>
            <UserRoundCheck size={15} />{submitting ? 'Saving…' : 'Confirm assignment'}
          </button>
        </footer>
      </section>
    </div>
  );
};

function statusClass(status: string) {
  return `badge badge-${status}`;
}
