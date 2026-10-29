import { Response } from 'express';
import { Prisma, UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../db/prisma';
import { db } from '../db/store';
import { sendFirebasePushNotifications } from '../services/pushNotifications';
import { sendWelcomeNotification } from '../services/notificationService';

const roles: UserRole[] = ['user', 'worker', 'department_supervisor', 'super_admin'];
const pushPlatforms = ['ios', 'android', 'web'];

function isPushToken(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 20 && value.length <= 4096;
}

function reportError(error: unknown, res: Response): void {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    res.status(409).json({ error: 'That Google account is already linked to another Fixly account' });
    return;
  }
  console.error('Notification operation failed:', error);
  res.status(500).json({ error: 'Unable to complete the notification operation' });
}

export const notificationsController = {
  list: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const [notifications, unreadCount] = await Promise.all([
        db.getNotifications(userId),
        db.getUnreadNotificationCount(userId),
      ]);
      res.json({ notifications, unreadCount });
    } catch (error) {
      reportError(error, res);
    }
  },

  unreadCount: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      res.json({ unreadCount: await db.getUnreadNotificationCount(req.user!.id) });
    } catch (error) {
      reportError(error, res);
    }
  },

  markRead: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const updated = await db.markNotificationRead(req.user!.id, req.params.id);
      if (!updated) {
        res.status(404).json({ error: 'Unread notification not found' });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      reportError(error, res);
    }
  },

  markAllRead: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const updated = await db.markAllNotificationsRead(req.user!.id);
      res.json({ success: true, updated });
    } catch (error) {
      reportError(error, res);
    }
  },

  send: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { title, body, audience, recipientEmail, type } = req.body as Record<string, unknown>;
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) {
      res.status(400).json({ error: 'Title must be between 1 and 120 characters' });
      return;
    }
    if (typeof body !== 'string' || !body.trim() || body.trim().length > 1000) {
      res.status(400).json({ error: 'Message must be between 1 and 1000 characters' });
      return;
    }
    if (
      typeof audience !== 'string'
      || (audience !== 'all' && audience !== 'specific' && !roles.includes(audience as UserRole))
    ) {
      res.status(400).json({ error: 'A valid notification audience is required' });
      return;
    }
    const normalizedRecipientEmail = typeof recipientEmail === 'string'
      ? recipientEmail.trim().toLowerCase()
      : '';
    if (
      audience === 'specific'
      && (
        typeof recipientEmail !== 'string'
        || normalizedRecipientEmail.length > 254
        || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedRecipientEmail)
      )
    ) {
      res.status(400).json({ error: 'A valid account email is required for a specific recipient' });
      return;
    }
    const notificationType = typeof type === 'string' && ['info', 'alert', 'assignment', 'system'].includes(type)
      ? type
      : 'info';

    try {
      const specificRecipient = audience === 'specific'
        ? await prisma.user.findFirst({
            where: { email: normalizedRecipientEmail, isActive: true },
            select: { id: true },
          })
        : null;
      if (audience === 'specific' && !specificRecipient) {
        res.status(404).json({ error: 'No active Fixly account was found for that email address' });
        return;
      }

      const recipients = specificRecipient
        ? [specificRecipient]
        : await prisma.user.findMany({
            where: {
              isActive: true,
              ...(audience !== 'all' && audience !== 'specific' && { role: audience as UserRole }),
            },
            select: { id: true },
          });
      if (!recipients.length) {
        res.status(409).json({ error: 'There are no active accounts in that audience' });
        return;
      }
      const userIds = recipients.map((recipient) => recipient.id);
      const content = { title: title.trim(), body: body.trim(), type: notificationType };
      await db.createNotificationBroadcast(userIds, content, req.user!);
      const tokens = await db.getActivePushTokens(userIds);
      let push: { attempted: number; sent: number; failed: number; error?: string };
      try {
        push = { attempted: tokens.length, ...await sendFirebasePushNotifications(tokens, content) };
      } catch (error) {
        console.error('Notification records were saved, but Firebase push delivery failed:', error);
        push = {
          attempted: tokens.length,
          sent: 0,
          failed: tokens.length,
          error: error instanceof Error ? error.message : 'Firebase push delivery failed',
        };
      }
      res.status(201).json({
        success: true,
        recipientCount: userIds.length,
        push,
      });
    } catch (error) {
      reportError(error, res);
    }
  },

  registerPushToken: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { token, platform } = req.body as Record<string, unknown>;
    if (!isPushToken(token)) {
      res.status(400).json({ error: 'A valid Firebase Cloud Messaging token is required' });
      return;
    }
    if (typeof platform !== 'string' || !pushPlatforms.includes(platform)) {
      res.status(400).json({ error: 'Platform must be ios, android, or web' });
      return;
    }
    try {
      const existingDevicesCount = await prisma.pushDevice.count({
        where: { userId: req.user!.id, isActive: true },
      });
      const hasWelcomeNotification = await prisma.notification.findFirst({
        where: { userId: req.user!.id, type: 'system', title: { contains: 'Welcome' } },
      });

      await db.registerPushDevice(req.user!.id, token, platform);

      // Send welcome push notification if first device or welcome was not yet delivered
      if (existingDevicesCount === 0 || !hasWelcomeNotification) {
        await sendWelcomeNotification(req.user!, token);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      reportError(error, res);
    }
  },

  unregisterPushToken: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const token = req.body.token;
    if (!isPushToken(token)) {
      res.status(400).json({ error: 'A valid Firebase Cloud Messaging token is required' });
      return;
    }
    try {
      await db.unregisterPushDevice(req.user!.id, token);
      res.json({ success: true });
    } catch (error) {
      reportError(error, res);
    }
  },
};
