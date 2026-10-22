import { db } from '../db/store';
import { prisma } from '../db/prisma';
import { IssueStatus } from '../models/types';
import { PushNotificationPayload, sendFirebasePushNotifications } from './pushNotifications';

export function getIssueStatusNotification(
  status: IssueStatus,
  issue: { ticketId: string; title: string; assignedWorkerName?: string | null },
): { title: string; body: string; type: string } {
  switch (status) {
    case 'queued':
      return {
        title: 'Issue Submitted ',
        body: `Your report ${issue.ticketId} ("${issue.title}") has been received and is queued for assignment.`,
        type: 'assignment',
      };
    case 'assigned':
      return {
        title: 'Technician Assigned ',
        body: `${issue.assignedWorkerName ? `${issue.assignedWorkerName} has been assigned to` : 'A technician has been assigned to'} your report: "${issue.title}".`,
        type: 'assignment',
      };
    case 'in_progress':
      return {
        title: 'Work In Progress ',
        body: `A technician is now actively working on ${issue.ticketId}: "${issue.title}".`,
        type: 'assignment',
      };
    case 'resolved':
      return {
        title: 'Issue Resolved',
        body: `Your report ${issue.ticketId} ("${issue.title}") has been marked as resolved! Tap to review.`,
        type: 'assignment',
      };
    case 'escalated':
      return {
        title: 'Issue Escalated ',
        body: `Your report ${issue.ticketId} ("${issue.title}") has been escalated for administrative review.`,
        type: 'alert',
      };
  }
}

export async function notifyUsersWithPush(
  userIds: string[],
  payload: PushNotificationPayload,
): Promise<{ sent: number; failed: number }> {
  if (userIds.length === 0) return { sent: 0, failed: 0 };

  try {
    await db.createNotifications(userIds, {
      title: payload.title,
      body: payload.body,
      type: payload.type,
      data: payload.data,
    });
  } catch (error) {
    console.error('Failed to create in-app notifications:', error);
  }

  try {
    const tokens = await db.getActivePushTokens(userIds);
    if (tokens.length > 0) {
      return await sendFirebasePushNotifications(tokens, payload);
    }
  } catch (error) {
    console.error('Failed to send Firebase push notifications:', error);
  }

  return { sent: 0, failed: 0 };
}

export async function sendWelcomeNotification(
  user: { id: string; name: string },
  deviceToken?: string,
): Promise<void> {
  const payload: PushNotificationPayload = {
    title: 'Welcome to Fixly! 👋',
    body: `Hi ${user.name}, welcome to Fixly! Push notifications are active. You will receive live status updates from report submission until resolution.`,
    type: 'system',
    data: {
      type: 'welcome',
    },
  };

  try {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: 'system',
        title: { contains: 'Welcome' },
      },
    });
    if (!existing) {
      await db.createNotifications([user.id], payload);
    }
  } catch (error) {
    console.error('Failed to record welcome in-app notification:', error);
  }

  try {
    if (deviceToken) {
      await sendFirebasePushNotifications([deviceToken], payload);
    } else {
      const tokens = await db.getActivePushTokens([user.id]);
      if (tokens.length > 0) {
        await sendFirebasePushNotifications(tokens, payload);
      }
    }
  } catch (error) {
    console.error('Failed to dispatch welcome push notification:', error);
  }
}
