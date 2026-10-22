import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db/store';
import { Worker } from '../models/types';

const workerStatuses: Worker['status'][] = ['available', 'busy', 'off_duty'];

function reportError(error: unknown, res: Response): void {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    res.status(409).json({ error: 'A worker or account with that email already exists' });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    res.status(409).json({ error: 'This technician is referenced by existing records and cannot be deleted' });
    return;
  }
  console.error('Worker request failed:', error);
  res.status(500).json({ error: 'Unable to complete the worker request' });
}

export const workersController = {
  getCurrent: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const worker = await db.getWorkerByEmail(req.user!.email);
      if (!worker) {
        res.status(404).json({ error: 'Worker profile not found' });
        return;
      }
      res.json({ worker });
    } catch (error) {
      reportError(error, res);
    }
  },

  getCurrentPerformance: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const performance = await db.getWorkerPerformance(req.user!.email);
      if (!performance) {
        res.status(404).json({ error: 'Worker profile not found' });
        return;
      }
      res.json({ performance });
    } catch (error) {
      reportError(error, res);
    }
  },

  updateCurrentStatus: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { status } = req.body;
    if (status !== 'available' && status !== 'off_duty') {
      res.status(400).json({ error: 'Choose available or off duty status' });
      return;
    }
    try {
      const worker = await db.getWorkerByEmail(req.user!.email);
      if (!worker) {
        res.status(404).json({ error: 'Worker profile not found' });
        return;
      }
      if (worker.status === 'busy') {
        res.status(409).json({ error: 'Finish your active task before changing availability' });
        return;
      }
      if (status === 'available' && await db.hasActiveIssueForWorker(worker.id)) {
        res.status(409).json({ error: 'Finish your active task before becoming available' });
        return;
      }
      const result = await db.updateWorkerShift(worker.id, worker.shift, status, req.user!);
      if (!result.success) {
        res.status(409).json({ error: result.error || 'Unable to update availability' });
        return;
      }
      res.json({ worker: result.worker });
    } catch (error) {
      reportError(error, res);
    }
  },

  getWorkers: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const workers = await db.getWorkersForRole(req.user!, req.query.department as string | undefined);
      res.json({ success: true, scopedRole: req.user!.role, department: req.user!.department || 'All Campus', count: workers.length, workers });
    } catch (error) {
      reportError(error, res);
    }
  },

  create: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { name, email, phone, department, shift, currentBuilding, coordinates, password } = req.body;
    if (![name, email, phone, department, shift, currentBuilding, password].every((value) => typeof value === 'string' && value.trim())) {
      res.status(400).json({ error: 'Name, email, phone, department, shift, building, and initial password are required' });
      return;
    }
    if (password.length < 12) {
      res.status(400).json({ error: 'Initial password must be at least 12 characters' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'A valid worker email address is required' });
      return;
    }
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      res.status(400).json({ error: 'Valid worker coordinates are required' });
      return;
    }
    if (coordinates.lat < -90 || coordinates.lat > 90 || coordinates.lng < -180 || coordinates.lng > 180) {
      res.status(400).json({ error: 'Worker coordinates must be valid latitude and longitude values' });
      return;
    }
    try {
      const worker = await db.createWorker({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        department: department.trim(),
        shift: shift.trim(),
        currentBuilding: currentBuilding.trim(),
        coordinates,
        status: 'available',
        rating: 0,
        jobsCompleted: 0,
        reworkRate: 0,
        password,
      }, req.user!);
      res.status(201).json({ worker });
    } catch (error) {
      reportError(error, res);
    }
  },

  update: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const updates = req.body as Partial<Worker>;
    if (updates.status !== undefined && !workerStatuses.includes(updates.status)) {
      res.status(400).json({ error: 'A valid worker status is required' });
      return;
    }
    try {
      const worker = await db.getWorkerById(req.params.id);
      if (!worker) {
        res.status(404).json({ error: 'Worker not found' });
        return;
      }
      if (req.user!.role === 'department_supervisor' && worker.department.toLowerCase() !== req.user!.department?.toLowerCase()) {
        res.status(403).json({ error: 'Cannot modify workers outside your department' });
        return;
      }
      if (req.user!.role === 'department_supervisor' && updates.department
        && updates.department.toLowerCase() !== req.user!.department?.toLowerCase()) {
        res.status(403).json({ error: 'Cannot move a worker to another department' });
        return;
      }
      if (updates.status === 'available' && await db.hasActiveIssueForWorker(worker.id)) {
        res.status(409).json({ error: 'Finish the assigned issue before marking this technician available' });
        return;
      }
      const updated = await db.updateWorker(req.params.id, updates, req.user!);
      res.json({ worker: updated });
    } catch (error) {
      reportError(error, res);
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await db.deleteWorker(req.params.id, req.user!);
      if (!result.success) {
        res.status(result.error === 'Worker not found' ? 404 : 409).json({ error: result.error });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      reportError(error, res);
    }
  },

  updateShift: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { shift, status } = req.body;
    if (typeof shift !== 'string' || !shift.trim() || !workerStatuses.includes(status)) {
      res.status(400).json({ error: 'A shift and valid worker status are required' });
      return;
    }
    try {
      if (status === 'available' && await db.hasActiveIssueForWorker(req.params.id)) {
        res.status(409).json({ error: 'Finish the assigned issue before marking this technician available' });
        return;
      }
      const result = await db.updateWorkerShift(req.params.id, shift, status, req.user!);
      if (!result.success) {
        res.status(result.error?.includes('403') ? 403 : 404).json({ error: result.error });
        return;
      }
      res.json({ success: true, message: 'Worker shift and availability updated successfully', worker: result.worker });
    } catch (error) {
      reportError(error, res);
    }
  },
};
