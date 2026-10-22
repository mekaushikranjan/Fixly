import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db/store';

export const analyticsController = {
  getMetrics: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user!;
    const dept = req.query.department as string;

    try {
    const [metrics, trends] = await Promise.all([
      db.getDepartmentMetrics(user, dept),
      db.getResolutionTrend(user),
    ]);

    // Campus-wide aggregates
    const totalIssues = metrics.reduce((acc, m) => acc + m.totalIssues, 0);
    const resolvedIssues = metrics.reduce((acc, m) => acc + m.resolvedIssues, 0);
    const pendingIssues = metrics.reduce((acc, m) => acc + m.pendingIssues, 0);
    const escalatedIssues = metrics.reduce((acc, m) => acc + m.escalatedIssues, 0);
    const activeWorkers = metrics.reduce((acc, m) => acc + m.activeWorkers, 0);
    const avgSlaCompliance =
      metrics.length > 0
        ? Number((metrics.reduce((acc, m) => acc + m.slaComplianceRate, 0) / metrics.length).toFixed(1))
        : 0;
    const avgReworkRate =
      metrics.length > 0
        ? Number((metrics.reduce((acc, m) => acc + m.reworkRate, 0) / metrics.length).toFixed(1))
        : 0;
    const resolvedForAverage = metrics.reduce((total, metric) => total + metric.resolvedIssues, 0);
    const avgResolutionTimeMins = resolvedForAverage
      ? Number((metrics.reduce((total, metric) => total + metric.avgResolutionTimeMins * metric.resolvedIssues, 0) / resolvedForAverage).toFixed(1))
      : 0;

    res.json({
      success: true,
      scopedRole: user.role,
      department: user.department || 'All Campus',
      summary: {
        totalIssues,
        resolvedIssues,
        pendingIssues,
        escalatedIssues,
        activeWorkers,
        avgSlaCompliance,
        avgReworkRate,
        avgResolutionTimeMins,
      },
      departments: metrics,
      trends,
    });
    } catch (error) {
      console.error('Analytics request failed:', error);
      res.status(500).json({ error: 'Unable to load analytics' });
    }
  },
};
