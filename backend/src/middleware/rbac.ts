import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { UserRole } from '../models/types';

// Flowchart: Role-Based Access Control
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: '401 Unauthorized', message: 'User not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: '403 Forbidden',
        message: `Access Denied: Your role (${req.user.role}) is not authorized for this resource.`,
      });
      return;
    }

    // Flowchart: "Check role = department_supervisor (read assigned department field)"
    // "Department field present? No -> Access Denied (No department assigned)"
    if (req.user.role === 'department_supervisor') {
      if (!req.user.department || req.user.department.trim() === '') {
        res.status(403).json({
          error: '403 Forbidden',
          message: 'Access Denied: Supervisor has no department assigned.',
        });
        return;
      }

      // Check if request explicitly attempts to access or modify another department
      const requestedDept =
        (req.query.department as string) ||
        (req.body && req.body.department as string) ||
        (req.params && req.params.department as string);

      if (
        requestedDept &&
        requestedDept !== 'all' &&
        requestedDept.toLowerCase() !== req.user.department.toLowerCase()
      ) {
        // Flowchart: "Access attempt to another department's data? -> Backend rejects 403 Forbidden at query layer"
        res.status(403).json({
          error: '403 Forbidden',
          message: `Access Denied: Department supervisor is strictly restricted to '${req.user.department}' and cannot access or manipulate '${requestedDept}'.`,
        });
        return;
      }
    }

    next();
  };
}
