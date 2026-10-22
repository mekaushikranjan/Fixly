'use client';

import React, { useState } from 'react';
import { Smartphone, Check, X, Building, Tag } from 'lucide-react';
import { api } from '../lib/api';

interface AppSettingsModalProps {
  initialVersion: string;
  initialUniversity: string;
  onClose: () => void;
  onUpdated: (version: string, university: string) => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  initialVersion,
  initialUniversity,
  onClose,
  onUpdated,
}) => {
  const [version, setVersion] = useState(initialVersion || '1.0.0');
  const [university, setUniversity] = useState(initialUniversity || 'Lovely Professional University');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim()) {
      setError('App version cannot be blank.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await api.updateAppConfig({
        version: version.trim(),
        university: university.trim(),
      });
      onUpdated(res.version, res.university);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update app settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <form
        className="modal-panel record-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-settings-title"
        onSubmit={handleSubmit}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: 480 }}
      >
        <header className="modal-header">
          <div className="modal-heading-icon" style={{ backgroundColor: '#FDE9DC', color: '#F26522' }}>
            <Smartphone size={20} />
          </div>
          <div className="modal-heading-copy">
            <h2 id="app-settings-title">Mobile App Configuration</h2>
            <p>Set the live mobile app version and campus university details displayed on Fixly.</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </header>

        <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: 13 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#D1FAE5', color: '#059669', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={16} /> Saved! Mobile apps will display this updated version.
            </div>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={14} color="#F26522" /> Mobile App Version
            </span>
            <input
              className="input"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. 1.0.0 or 1.1.2"
              required
            />
            <span style={{ fontSize: 11, color: '#6B7280' }}>
              Displayed on the user profile screen footer on mobile devices.
            </span>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building size={14} color="#F26522" /> University / Campus Name
            </span>
            <input
              className="input"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="e.g. Lovely Professional University"
              required
            />
            <span style={{ fontSize: 11, color: '#6B7280' }}>
              Institution name displayed on the mobile app header and footer.
            </span>
          </label>

          {/* Live Mobile Footer Preview */}
          <div style={{ marginTop: 8, padding: 14, borderRadius: 12, backgroundColor: '#F8F7F4', border: '1px solid #EDEAE3', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8A8780', textTransform: 'uppercase', marginBottom: 6 }}>
              Mobile Footer Live Preview
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, color: '#F26522', fontSize: 15 }}>Fixly</span>
              <span style={{ padding: '2px 7px', borderRadius: 999, backgroundColor: '#FDE9DC', color: '#B94E0F', fontSize: 10, fontWeight: 800 }}>
                v{version || '1.0.0'}
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#2C2C2A' }}>
              {university }
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="button button-outline" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save App Version'}
          </button>
        </div>
      </form>
    </div>
  );
};
