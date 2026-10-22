'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, Send } from 'lucide-react';
import { api, type NotificationRecord } from '../lib/api';

interface NotificationsPanelProps {
  notifications: NotificationRecord[];
  unreadCount: number;
  canSend: boolean;
  onRefresh: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  unreadCount,
  canSend,
  onRefresh,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [type, setType] = useState('info');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'warning'>('success');

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setFeedback('');
    setSending(true);
    try {
      const result = await api.sendNotification({ title: title.trim(), body: body.trim(), audience, type });
      setTitle('');
      setBody('');
      const pushSummary = result.push.attempted === 0
        ? 'No mobile devices are registered for push notifications yet.'
        : `Push accepted by Firebase for ${result.push.sent} of ${result.push.attempted} devices; ${result.push.failed} failed.`;
      setFeedbackTone(
        result.push.attempted === 0 || result.push.failed > 0 || Boolean(result.push.error)
          ? 'warning'
          : 'success',
      );
      setFeedback(
        `Saved for ${result.recipientCount} accounts. ${pushSummary}`
        + (result.push.error ? ` Delivery error: ${result.push.error}` : ''),
      );
      onRefresh();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send this notification.');
    } finally {
      setSending(false);
    }
  };

  const markRead = async (id: string) => {
    setError('');
    try {
      await api.markNotificationRead(id);
      onRefresh();
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Unable to update notification.');
    }
  };

  const markAllRead = async () => {
    setError('');
    try {
      await api.markAllNotificationsRead();
      onRefresh();
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : 'Unable to update notifications.');
    }
  };

  return (
    <section className="notifications-layout">
      {canSend && (
        <form className="notification-compose card" onSubmit={send}>
          <div className="notification-compose-heading">
            <span className="notification-compose-icon"><Send size={17} /></span>
            <div><h2>Send a notification</h2><p>Deliver an in-app message and a push alert to registered mobile devices.</p></div>
          </div>
          <label className="form-label" htmlFor="notification-title">Title</label>
          <input
            id="notification-title"
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
          />
          <label className="form-label" htmlFor="notification-message">Message</label>
          <textarea
            id="notification-message"
            className="input notification-message-input"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={1000}
            rows={4}
            required
          />
          <div className="notification-form-row">
            <div>
              <label className="form-label" htmlFor="notification-audience">Audience</label>
              <select id="notification-audience" className="input" value={audience} onChange={(event) => setAudience(event.target.value)}>
                <option value="all">All active accounts</option>
                <option value="user">Users</option>
                <option value="worker">Workers</option>
                <option value="department_supervisor">Department supervisors</option>
                <option value="super_admin">Super Admins</option>
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="notification-type">Category</label>
              <select id="notification-type" className="input" value={type} onChange={(event) => setType(event.target.value)}>
                <option value="info">Information</option>
                <option value="alert">Alert</option>
                <option value="assignment">Job assignment</option>
                <option value="system">System update</option>
              </select>
            </div>
          </div>
          {error && <p className="notification-feedback error" role="alert">{error}</p>}
          {feedback && <p className={`notification-feedback ${feedbackTone}`} role="status">{feedback}</p>}
          <div className="notification-compose-actions">
            <span>Messages are stored in the notification inbox.</span>
            <button className="btn btn-primary" type="submit" disabled={sending}>
              <Send size={15} />{sending ? 'Sending…' : 'Send notification'}
            </button>
          </div>
        </form>
      )}

      <section className="notification-inbox card">
        <div className="notification-inbox-heading">
          <div><h2>Notification inbox</h2><p>{unreadCount} unread · {notifications.length} total</p></div>
          <button className="btn btn-secondary" onClick={() => void markAllRead()} disabled={!unreadCount}>
            <CheckCheck size={15} />Mark all read
          </button>
        </div>
        {error && !canSend && <p className="notification-feedback error" role="alert">{error}</p>}
        {notifications.length === 0 ? (
          <div className="notification-empty"><Bell size={24} /><span>No notifications yet.</span></div>
        ) : (
          <div className="notification-list">
            {notifications.map((notification) => {
              const unread = !notification.readAt;
              return (
                <article className={`notification-row${unread ? ' unread' : ''}`} key={notification.id}>
                  <span className={`notification-kind notification-kind-${notification.type}`}>{notification.type}</span>
                  <div className="notification-row-copy">
                    <div className="notification-row-title">{notification.title}<time>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</time></div>
                    <p>{notification.body}</p>
                  </div>
                  {unread && <button className="notification-mark-read" onClick={() => void markRead(notification.id)}>Mark read</button>}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
};
