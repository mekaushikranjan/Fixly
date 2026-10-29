import { Router } from 'express';
import { authController } from '../controllers/authController';
import { issuesController } from '../controllers/issuesController';
import { workersController } from '../controllers/workersController';
import { analyticsController } from '../controllers/analyticsController';
import { auditController, shiftsController } from '../controllers/auditController';
import { notificationsController } from '../controllers/notificationsController';
import { appConfigController } from '../controllers/appConfigController';
import { recordMobilePing } from '../services/mobilePingService';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// --- Auth Routes ---
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/google', authController.googleLogin);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/auth/me', authenticate, authController.getMe);
router.post('/auth/firebase-custom-token', authenticate, authController.getFirebaseCustomToken);
router.patch('/auth/me', authenticate, authController.updateMe);
router.get('/users', authenticate, requireRole(['super_admin']), authController.list);
router.post('/users', authenticate, requireRole(['super_admin']), authController.create);
router.patch('/users/:id', authenticate, requireRole(['super_admin']), authController.update);
router.delete('/users/:id', authenticate, requireRole(['super_admin']), authController.remove);

// --- Notifications & Push Devices ---
router.get('/notifications', authenticate, notificationsController.list);
router.get('/notifications/unread-count', authenticate, notificationsController.unreadCount);
router.patch('/notifications/read-all', authenticate, notificationsController.markAllRead);
router.patch('/notifications/:id/read', authenticate, notificationsController.markRead);
router.post('/notifications', authenticate, requireRole(['super_admin']), notificationsController.send);
router.post('/devices/push-token', authenticate, notificationsController.registerPushToken);
router.delete('/devices/push-token', authenticate, notificationsController.unregisterPushToken);

// --- App Configuration & Version ---
router.get('/app/config', appConfigController.get);
router.patch(
  '/app/config',
  authenticate,
  requireRole(['super_admin', 'department_supervisor']),
  appConfigController.update
);

// --- Mobile App Ping / Keep-Alive Heartbeat ---
router.all('/mobile/ping', (req, res) => {
  const platform = req.body?.platform || req.query?.platform || 'mobile';
  const version = req.body?.version || req.query?.version;
  recordMobilePing(String(platform), typeof version === 'string' ? version : undefined);
  res.json({
    status: 'connected',
    service: 'Fixly Mobile API',
    platform,
    timestamp: new Date().toISOString(),
  });
});

// --- Issue Routes (Role Scoped) ---
router.get('/issues', authenticate, issuesController.getIssues);
router.get(
  '/issues/escalations',
  authenticate,
  requireRole(['super_admin', 'department_supervisor']),
  issuesController.getEscalations
);
router.post('/issues', authenticate, issuesController.create);
router.patch('/issues/:id', authenticate, requireRole(['super_admin', 'department_supervisor']), issuesController.update);
router.delete('/issues/:id', authenticate, requireRole(['super_admin', 'department_supervisor']), issuesController.remove);
router.patch(
  '/issues/:id/reassign',
  authenticate,
  requireRole(['super_admin', 'department_supervisor']),
  issuesController.reassign
);
router.patch(
  '/issues/:id/status',
  authenticate,
  requireRole(['super_admin', 'department_supervisor', 'worker']),
  issuesController.updateStatus
);
router.get('/worker/jobs', authenticate, requireRole(['worker']), issuesController.getWorkerJobs);
router.get('/worker/me', authenticate, requireRole(['worker']), workersController.getCurrent);
router.get('/worker/performance', authenticate, requireRole(['worker']), workersController.getCurrentPerformance);
router.patch('/worker/me/status', authenticate, requireRole(['worker']), workersController.updateCurrentStatus);
router.post('/issues/:id/accept', authenticate, requireRole(['worker']), issuesController.accept);
router.post('/issues/:id/feedback', authenticate, requireRole(['user']), issuesController.feedback);

// --- Worker & Shift Routes ---
router.get(
  '/workers',
  authenticate,
  requireRole(['super_admin', 'department_supervisor']),
  workersController.getWorkers
);
router.patch(
  '/workers/:id/shift',
  authenticate,
  requireRole(['super_admin', 'department_supervisor']),
  workersController.updateShift
);
router.post('/workers', authenticate, requireRole(['super_admin']), workersController.create);
router.patch('/workers/:id', authenticate, requireRole(['super_admin', 'department_supervisor']), workersController.update);
router.delete('/workers/:id', authenticate, requireRole(['super_admin']), workersController.remove);

router.get(
  '/shifts',
  authenticate,
  requireRole(['super_admin', 'department_supervisor']),
  shiftsController.getShifts
);

// --- Analytics & Audit Trails ---
router.get(
  '/analytics',
  authenticate,
  requireRole(['super_admin', 'department_supervisor']),
  analyticsController.getMetrics
);

router.get(
  '/audit',
  authenticate,
  requireRole(['super_admin', 'department_supervisor']),
  auditController.getLogs
);

export default router;
