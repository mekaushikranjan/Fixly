import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db/store';

export const auditController = {
  getLogs: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const logs = await db.getAuditLogsForRole(user);
      res.json({ success: true, scopedRole: user.role, count: logs.length, logs });
    } catch (error) {
      console.error('Audit log request failed:', error);
      res.status(500).json({ error: 'Unable to load audit logs' });
    }
  },
};

export const shiftsController = {
  getShifts: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const shifts = await db.getShiftsForRole(user);
      res.json({ success: true, scopedRole: user.role, department: user.department || 'All Campus', count: shifts.length, shifts });
    } catch (error) {
      console.error('Shift roster request failed:', error);
      res.status(500).json({ error: 'Unable to load shifts' });
    }
  },
};
