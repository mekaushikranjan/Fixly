import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db/store';
import { Issue, IssueStatus, Priority } from '../models/types';
import { sendFirebasePushNotifications } from '../services/pushNotifications';
import { getIssueStatusNotification, notifyUsersWithPush } from '../services/notificationService';
import { R2StorageConfigurationError, UploadedIssuePhoto, uploadIssuePhoto } from '../services/r2Storage';

const statuses: IssueStatus[] = ['queued', 'assigned', 'in_progress', 'resolved', 'escalated'];
const priorities: Priority[] = ['Critical', 'High', 'Normal', 'Low'];
const MAX_ISSUE_PHOTO_BYTES = 5 * 1024 * 1024;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function reportError(error: unknown, res: Response): void {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    res.status(409).json({ error: 'A record with those unique values already exists' });
    return;
  }
  console.error('Issue request failed:', error);
  res.status(500).json({ error: 'Unable to complete the issue request' });
}

function canManageIssue(req: AuthenticatedRequest, issue: Issue, res: Response): boolean {
  if (req.user?.role === 'super_admin') return true;
  if (req.user?.role === 'department_supervisor' && issue.department.toLowerCase() === req.user.department?.toLowerCase()) return true;
  res.status(403).json({ error: 'You are not allowed to modify this issue' });
  return false;
}

async function notifyAvailableDepartmentWorkersOfEscalation(issue: Issue): Promise<void> {
  const workerUserIds = await db.getAvailableWorkerUserIds(issue.department);
  await notifyUsersWithPush(workerUserIds, {
    title: 'Issue escalated in your department',
    body: `${issue.ticketId}: "${issue.title}" requires your department's attention.`,
    type: 'alert',
    data: {
      issueId: issue.id,
      ticketId: issue.ticketId,
      status: 'escalated',
    },
  });
}

export const issuesController = {
  getIssues: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const issues = await db.getIssuesForRole(req.user!, req.query.department as string | undefined);
      res.json({ success: true, scopedRole: req.user!.role, department: req.user!.department || 'All Campus', count: issues.length, issues });
    } catch (error) {
      reportError(error, res);
    }
  },

  getEscalations: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const escalations = await db.getEscalationQueue(req.user!);
      res.json({ success: true, scopedRole: req.user!.role, count: escalations.length, escalations });
    } catch (error) {
      reportError(error, res);
    }
  },

  getWorkerJobs: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const issues = await db.getAvailableIssuesForWorker(req.user!);
      res.json({ issues });
    } catch (error) {
      reportError(error, res);
    }
  },

  accept: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const issue = await db.acceptIssue(req.params.id, req.user!);
      if (!issue) {
        res.status(409).json({ error: 'This issue is no longer available or does not match your department' });
        return;
      }
      const notif = getIssueStatusNotification('assigned', {
        ...issue,
        assignedWorkerName: issue.assignedWorkerName || req.user!.name,
      });
      const tokens = await db.getActivePushTokens([issue.reportedByUserId]);
      let push: { sent: number; failed: number } = { sent: 0, failed: tokens.length };
      try {
        push = await sendFirebasePushNotifications(tokens, {
          ...notif,
          data: {
            issueId: issue.id,
            ticketId: issue.ticketId,
            status: 'assigned',
          },
        });
      } catch (error) {
        console.error('Assignment was saved, but Firebase push delivery failed:', error);
      }
      res.json({ success: true, issue, push });
    } catch (error) {
      reportError(error, res);
    }
  },

  feedback: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const rating = req.body.rating;
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length > 2000) {
      res.status(400).json({ error: 'Rating must be 1 to 5 and comment cannot exceed 2000 characters' });
      return;
    }
    try {
      const issue = await db.addIssueFeedback(req.params.id, req.user!.id, { rating, comment });
      if (!issue) {
        res.status(404).json({ error: 'Resolved issue not found for this account' });
        return;
      }
      res.json({ success: true, issue });
    } catch (error) {
      reportError(error, res);
    }
  },

  reassign: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (typeof req.body.workerId !== 'string' || !req.body.workerId) {
      res.status(400).json({ error: 'workerId is required' });
      return;
    }
    try {
      const result = await db.reassignIssue(req.params.id, req.body.workerId, req.user!);
      if (!result.success || !result.issue) {
        res.status(result.error?.includes('403') ? 403 : 404).json({ error: result.error });
        return;
      }

      // Notify the reporter about reassignment via push
      try {
        const notif = getIssueStatusNotification('assigned', result.issue);
        const reporterTokens = await db.getActivePushTokens([result.issue.reportedByUserId]);
        if (reporterTokens.length > 0) {
          await sendFirebasePushNotifications(reporterTokens, {
            ...notif,
            data: {
              issueId: result.issue.id,
              ticketId: result.issue.ticketId,
              status: 'assigned',
            },
          });
        }
      } catch (reporterPushErr) {
        console.error('Failed to send reassignment push to reporter:', reporterPushErr);
      }

      // Notify assigned worker via push
      try {
        const worker = await db.getWorkerById(req.body.workerId);
        if (worker) {
          const workerAccount = await db.getUserByEmail(worker.email);
          if (workerAccount) {
            const workerTokens = await db.getActivePushTokens([workerAccount.id]);
            if (workerTokens.length > 0) {
              await sendFirebasePushNotifications(workerTokens, {
                title: 'New Job Assigned 📋',
                body: `You have been assigned to ${result.issue.ticketId}: "${result.issue.title}".`,
                type: 'assignment',
                data: {
                  issueId: result.issue.id,
                  ticketId: result.issue.ticketId,
                  status: 'assigned',
                },
              });
            }
          }
        }
      } catch (workerPushErr) {
        console.error('Failed to send reassignment push to worker:', workerPushErr);
      }

      res.json({ success: true, message: `Issue reassigned to worker ${req.body.workerId}`, issue: result.issue });
    } catch (error) {
      reportError(error, res);
    }
  },

  updateStatus: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const status = req.body.status as IssueStatus;
    if (!statuses.includes(status)) {
      res.status(400).json({ error: 'A valid issue status is required' });
      return;
    }
    try {
      const issue = await db.getIssueById(req.params.id);
      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }
      if (req.user!.role === 'worker') {
        const worker = await db.getWorkerByEmail(req.user!.email);
        if (!worker || issue.assignedWorkerId !== worker.id || !['in_progress', 'resolved'].includes(status)) {
          res.status(403).json({ error: 'Workers can only update issues assigned to them to in progress or resolved' });
          return;
        }
      } else if (!canManageIssue(req, issue, res)) return;
      const result = await db.updateIssueStatus(issue.id, status, req.user!, req.body.resolutionPhoto);
      if (!result.success || !result.issue) {
        res.status(409).json({ error: result.error || 'Unable to update issue status' });
        return;
      }
      const notif = getIssueStatusNotification(result.issue.status, result.issue);
      const notification = {
        title: notif.title,
        body: notif.body,
        type: notif.type,
        data: {
          issueId: result.issue.id,
          ticketId: result.issue.ticketId,
          status: result.issue.status,
        },
      };
      let push: { sent: number; failed: number; error?: string } = { sent: 0, failed: 0 };
      if (issue.status !== result.issue.status) {
        try {
          const tokens = await db.getActivePushTokens([result.issue.reportedByUserId]);
          push = await sendFirebasePushNotifications(tokens, notification);
        } catch (pushError) {
          console.error('Issue status was updated, but Firebase push delivery failed:', pushError);
          push = {
            sent: 0,
            failed: 0,
            error: pushError instanceof Error ? pushError.message : 'Firebase push delivery failed',
          };
        }
        if (result.issue.status === 'escalated') {
          try {
            await notifyAvailableDepartmentWorkersOfEscalation(result.issue);
          } catch (workerNotifyError) {
            console.error('Issue was escalated, but department worker notifications failed:', workerNotifyError);
          }
        }
      }
      res.json({ success: true, message: `Issue status updated to ${status}`, issue: result.issue, push });
    } catch (error) {
      reportError(error, res);
    }
  },

  create: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const {
      title,
      description,
      department,
      building,
      floor,
      room,
      category,
      priority,
      photoBase64,
      photoMimeType,
    } = req.body;
    if (typeof title !== 'string' || !title.trim() || typeof description !== 'string' || !description.trim()) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }
    if (photoBase64 !== undefined) {
      if (typeof photoBase64 !== 'string' || !photoBase64 || !BASE64_PATTERN.test(photoBase64)) {
        res.status(400).json({ error: 'The attached photo is not valid base64 image data' });
        return;
      }
      if (Buffer.byteLength(photoBase64, 'base64') > MAX_ISSUE_PHOTO_BYTES) {
        res.status(413).json({ error: 'The attached photo must be 5 MB or smaller' });
        return;
      }
      if (typeof photoMimeType !== 'string' || !/^image\/(jpeg|png|webp|heic|heif)$/i.test(photoMimeType)) {
        res.status(400).json({ error: 'The attached photo must be a JPEG, PNG, WebP, HEIC, or HEIF image' });
        return;
      }
    }
    if (priority !== undefined && !priorities.includes(priority)) {
      res.status(400).json({ error: 'A valid issue priority is required' });
      return;
    }
    if (req.user!.role === 'department_supervisor' && department && department.toLowerCase() !== req.user!.department?.toLowerCase()) {
      res.status(403).json({ error: 'Cannot create an issue for another department' });
      return;
    }
    let uploadedPhoto: UploadedIssuePhoto | undefined;
    try {
      if (typeof photoBase64 === 'string') {
        uploadedPhoto = await uploadIssuePhoto(req.user!.id, photoBase64, photoMimeType);
      }
      const issueInput = {
        ...req.body,
        ...(uploadedPhoto ? { photoUrl: uploadedPhoto.downloadUrl } : {}),
      };
      delete issueInput.photoBase64;
      delete issueInput.photoMimeType;
      const newIssue = await db.createIssue(issueInput, req.user!);

      // Notify the reporter immediately with in-app notification & push notification
      try {
        const userNotif = getIssueStatusNotification('queued', newIssue);
        await notifyUsersWithPush([req.user!.id], {
          ...userNotif,
          data: {
            issueId: newIssue.id,
            ticketId: newIssue.ticketId,
            status: 'queued',
          },
        });
      } catch (reporterNotifyError) {
        console.error('Issue was saved, but reporter push delivery failed:', reporterNotifyError);
      }

      let dispatchNotification: { recipients: number; sent: number; failed: number; error?: string } = {
        recipients: 0,
        sent: 0,
        failed: 0,
      };
      try {
        const workerUserIds = await db.getAvailableWorkerUserIds(newIssue.department);
        const content = {
          title: 'New issue available',
          body: `${newIssue.ticketId}: ${newIssue.title}`,
          type: 'assignment',
          data: {
            issueId: newIssue.id,
            ticketId: newIssue.ticketId,
            status: 'queued',
          },
        };
        await db.createNotifications(workerUserIds, content);
        const tokens = await db.getActivePushTokens(workerUserIds);
        const delivery = await sendFirebasePushNotifications(tokens, content);
        dispatchNotification = { recipients: workerUserIds.length, ...delivery };
      } catch (notificationError) {
        console.error('Issue was saved, but worker notification delivery failed:', notificationError);
        dispatchNotification.error = notificationError instanceof Error
          ? notificationError.message
          : 'Worker notification delivery failed';
      }
      res.status(201).json({
        success: true,
        message: 'Issue reported successfully',
        issue: newIssue,
        dispatchNotification,
      });
    } catch (error) {
      if (uploadedPhoto) {
        try {
          await uploadedPhoto.remove();
        } catch (cleanupError) {
          console.error('Unable to remove an uploaded photo after issue creation failed:', cleanupError);
        }
      }
      if (error instanceof R2StorageConfigurationError) {
        res.status(503).json({ error: error.message });
        return;
      }
      reportError(error, res);
    }
  },

  update: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const updates = req.body as Partial<Issue>;
    if (updates.status !== undefined && !statuses.includes(updates.status)) {
      res.status(400).json({ error: 'A valid issue status is required' });
      return;
    }
    if (updates.priority !== undefined && !priorities.includes(updates.priority)) {
      res.status(400).json({ error: 'A valid issue priority is required' });
      return;
    }
    try {
      const issue = await db.getIssueById(req.params.id);
      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }
      if (!canManageIssue(req, issue, res)) return;
      if (req.user!.role === 'department_supervisor' && updates.department
        && updates.department.toLowerCase() !== req.user!.department?.toLowerCase()) {
        res.status(403).json({ error: 'Cannot move an issue to another department' });
        return;
      }
      const updated = await db.updateIssue(issue.id, updates, req.user!);
      if (updated) {
        if (updates.status && updates.status !== issue.status) {
          try {
            const notif = getIssueStatusNotification(updates.status, updated);
            await notifyUsersWithPush([issue.reportedByUserId], {
              ...notif,
              data: {
                issueId: issue.id,
                ticketId: issue.ticketId,
                status: updates.status,
              },
            });
          } catch (statusNotifyError) {
            console.error('Failed to send status update push notification:', statusNotifyError);
          }
          if (updates.status === 'escalated') {
            try {
              await notifyAvailableDepartmentWorkersOfEscalation(updated);
            } catch (workerNotifyError) {
              console.error('Issue was escalated, but department worker notifications failed:', workerNotifyError);
            }
          }
        } else if (updates.assignedWorkerId && updates.assignedWorkerId !== issue.assignedWorkerId) {
          try {
            const notif = getIssueStatusNotification('assigned', {
              ...updated,
              assignedWorkerName: updates.assignedWorkerName || 'A technician',
            });
            await notifyUsersWithPush([issue.reportedByUserId], {
              ...notif,
              data: {
                issueId: issue.id,
                ticketId: issue.ticketId,
                status: updated.status,
              },
            });
          } catch (assignNotifyError) {
            console.error('Failed to send assignment push notification:', assignNotifyError);
          }
        }
      }
      res.json({ issue: updated });
    } catch (error) {
      reportError(error, res);
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const issue = await db.getIssueById(req.params.id);
      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }
      if (!canManageIssue(req, issue, res)) return;
      await db.deleteIssue(issue.id, req.user!);
      res.json({ success: true });
    } catch (error) {
      reportError(error, res);
    }
  },
};
