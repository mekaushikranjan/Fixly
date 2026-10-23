import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Prisma, User as PrismaUser } from '@prisma/client';
import { prisma } from './prisma';
import { AuditLog, DepartmentMetrics, Issue, ShiftRoster, UserAccount, UserRole, Worker, WorkerPerformance } from '../models/types';

type UserInput = Omit<UserAccount, 'isActive'> & { isActive?: boolean };
type UserUpdates = Partial<Pick<
  UserAccount,
  'name' | 'email' | 'role' | 'department' | 'avatar' | 'isActive'
  | 'residenceType' | 'address' | 'city' | 'building' | 'room'
>>;

function asUser(user: PrismaUser): UserAccount {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || undefined,
    avatar: user.avatar || undefined,
    phone: user.phone || undefined,
    residenceType: user.residenceType as UserAccount['residenceType'] || undefined,
    address: user.address || undefined,
    city: user.city || undefined,
    building: user.building || undefined,
    room: user.room || undefined,
    isActive: user.isActive,
  };
}

function asIssue(issue: Prisma.IssueGetPayload<object>): Issue {
  const coordinates = issue.coordinates;
  const feedback = issue.feedback;
  return {
    ...issue,
    reportedAt: issue.reportedAt.toISOString(),
    resolvedAt: issue.resolvedAt?.toISOString(),
    slaDeadline: issue.slaDeadline.toISOString(),
    photoUrl: issue.photoUrl || undefined,
    resolutionPhoto: issue.resolutionPhoto || undefined,
    coordinates: coordinates && typeof coordinates === 'object' && !Array.isArray(coordinates)
      && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number'
      ? { lat: coordinates.lat, lng: coordinates.lng }
      : undefined,
    feedback: feedback && typeof feedback === 'object' && !Array.isArray(feedback)
      && typeof feedback.rating === 'number' && typeof feedback.comment === 'string' && typeof feedback.submittedAt === 'string'
      ? { rating: feedback.rating, comment: feedback.comment, submittedAt: feedback.submittedAt }
      : undefined,
    assignedWorkerId: issue.assignedWorkerId || undefined,
    assignedWorkerName: issue.assignedWorkerName || undefined,
  };
}

function asWorker(worker: Prisma.WorkerGetPayload<object>): Worker {
  return {
    ...worker,
    coordinates: worker.coordinates as Worker['coordinates'],
    activeJobId: undefined,
  };
}

function asShift(shift: Prisma.ShiftRosterGetPayload<object>): ShiftRoster {
  return shift;
}

function asAudit(log: Prisma.AuditLogGetPayload<object>): AuditLog {
  return { ...log, timestamp: log.timestamp.toISOString(), department: log.department || undefined, targetType: log.targetType as AuditLog['targetType'] };
}

class IssueNoLongerAvailableError extends Error {}
class DatabaseStore {
  async ensureActiveSuperAdmin(): Promise<void> {
    const count = await prisma.user.count({
      where: { role: 'super_admin', isActive: true },
    });
    if (count === 0) {
      throw new Error('No active Super Admin account exists in the database. Create or reactivate a Super Admin before starting the API.');
    }
  }

  async getUserByEmail(email: string): Promise<UserAccount | undefined> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return user ? asUser(user) : undefined;
  }

  async getUserById(id: string): Promise<UserAccount | undefined> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? asUser(user) : undefined;
  }

  async getUserWithPassword(email: string): Promise<(UserAccount & { passwordHash: string }) | undefined> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return user ? { ...asUser(user), passwordHash: user.passwordHash } : undefined;
  }

  async getFirebaseUser(email: string): Promise<(UserAccount & { firebaseUid: string | null }) | undefined> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return user ? { ...asUser(user), firebaseUid: user.firebaseUid } : undefined;
  }

  async createGoogleUser(name: string, email: string, firebaseUid: string, avatar?: string): Promise<UserAccount> {
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(randomUUID(), 12),
        firebaseUid,
        avatar,
        role: 'user',
      },
    });
    return asUser(user);
  }

  async linkFirebaseUid(userId: string, firebaseUid: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { firebaseUid } });
  }

  async updateAccountProfile(
    userId: string,
    updates: {
      name?: string;
      phone?: string | null;
      residenceType?: UserAccount['residenceType'] | null;
      address?: string | null;
      city?: string | null;
      building?: string | null;
      room?: string | null;
      avatar?: string | null;
    },
  ): Promise<UserAccount> {
    return asUser(await prisma.user.update({ where: { id: userId }, data: updates }));
  }

  async createPublicUser(name: string, email: string, password: string): Promise<UserAccount> {
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(password, 12),
        role: 'user',
      },
    });
    return asUser(user);
  }

  async getUsers(): Promise<UserAccount[]> {
    return (await prisma.user.findMany({ orderBy: { name: 'asc' } })).map(asUser);
  }

  async getNotifications(userId: string, limit = 100) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return notifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString() ?? null,
    }));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markNotificationRead(userId: string, notificationId: string): Promise<boolean> {
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count > 0;
  }

  async markAllNotificationsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  }

  async createNotifications(
    userIds: string[],
    input: { title: string; body: string; type: string; data?: Record<string, unknown> },
  ): Promise<void> {
    if (!userIds.length) return;
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        id: randomUUID(),
        userId,
        title: input.title,
        body: input.body,
        type: input.type,
        ...(input.data !== undefined ? { data: input.data as Prisma.InputJsonValue } : {}),
      })),
    });
  }

  async getAvailableWorkerUserIds(department: string): Promise<string[]> {
    const workers = await prisma.worker.findMany({
      where: { department, status: 'available' },
      select: { email: true },
    });
    if (!workers.length) return [];
    const accounts = await prisma.user.findMany({
      where: { email: { in: workers.map((worker) => worker.email) }, role: 'worker', isActive: true },
      select: { id: true },
    });
    return accounts.map((account) => account.id);
  }

  async createNotificationBroadcast(
    userIds: string[],
    input: { title: string; body: string; type: string },
    actor: UserAccount,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.notification.createMany({
        data: userIds.map((userId) => ({
          id: randomUUID(),
          userId,
          title: input.title,
          body: input.body,
          type: input.type,
        })),
      });
      await this.writeAudit(
        tx,
        actor,
        'NOTIFICATION_SENT',
        'system',
        randomUUID(),
        `Sent "${input.title}" to ${userIds.length} account(s)`,
      );
    });
  }

  async getActivePushTokens(userIds: string[]): Promise<string[]> {
    const devices = await prisma.pushDevice.findMany({
      where: { userId: { in: userIds }, isActive: true },
      select: { token: true },
    });
    return devices.map((device) => device.token);
  }

  async registerPushDevice(userId: string, token: string, platform: string): Promise<void> {
    await prisma.pushDevice.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform, isActive: true, lastSeenAt: new Date() },
    });
  }

  async unregisterPushDevice(userId: string, token: string): Promise<void> {
    await prisma.pushDevice.updateMany({
      where: { userId, token },
      data: { isActive: false },
    });
  }

  async deactivatePushDevices(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await prisma.pushDevice.updateMany({
      where: { token: { in: tokens } },
      data: { isActive: false },
    });
  }

  async createUser(input: UserInput, password: string, actor?: UserAccount): Promise<UserAccount> {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          id: input.id,
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash: await bcrypt.hash(password, 12),
          role: input.role,
          department: input.department || null,
          avatar: input.avatar || null,
          residenceType: input.residenceType || null,
          address: input.address || null,
          city: input.city || null,
          building: input.building || null,
          room: input.room || null,
          isActive: input.isActive ?? true,
        },
      });
      if (actor) await this.writeAudit(tx, actor, 'USER_CREATED', 'user', created.id, `Created ${created.role} account ${created.email}`, created.department);
      return created;
    });
    return asUser(user);
  }

  async updateUser(id: string, updates: UserUpdates & { password?: string }, actor: UserAccount): Promise<UserAccount | undefined> {
    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) return undefined;
    const worker = await prisma.worker.findUnique({ where: { email: current.email } });
    if (worker && updates.role !== undefined && updates.role !== 'worker') {
      throw new Error('Worker accounts must remain worker accounts; remove the technician record first');
    }
    if (!worker && updates.role === 'worker') {
      throw new Error('Create worker accounts from the technician roster');
    }
    const remainsActiveAdmin = updates.role === 'super_admin' && updates.isActive !== false;
    if (current.role === 'super_admin' && current.isActive && !remainsActiveAdmin
      && await prisma.user.count({ where: { role: 'super_admin', isActive: true } }) <= 1) {
      throw new Error('At least one active Super Admin account must remain');
    }
    const data: Prisma.UserUpdateInput = {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.email !== undefined && { email: updates.email.toLowerCase() }),
      ...(updates.role !== undefined && { role: updates.role }),
      ...(updates.department !== undefined && { department: updates.department || null }),
      ...(updates.avatar !== undefined && { avatar: updates.avatar || null }),
      ...(updates.residenceType !== undefined && { residenceType: updates.residenceType || null }),
      ...(updates.address !== undefined && { address: updates.address || null }),
      ...(updates.city !== undefined && { city: updates.city || null }),
      ...(updates.building !== undefined && { building: updates.building || null }),
      ...(updates.room !== undefined && { room: updates.room || null }),
      ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      ...(updates.password && { passwordHash: await bcrypt.hash(updates.password, 12) }),
    };
    try {
      const user = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({ where: { id }, data });
        if (worker) {
          await tx.worker.update({
            where: { id: worker.id },
            data: {
              ...(updates.name !== undefined && { name: updates.name }),
              ...(updates.email !== undefined && { email: updates.email.toLowerCase() }),
              ...(updates.department !== undefined && { department: updates.department || '' }),
            },
          });
        }
        await this.writeAudit(tx, actor, 'USER_UPDATED', 'user', id, `Updated account ${updated.email}`, updated.department);
        return updated;
      });
      return asUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return undefined;
      throw error;
    }
  }

  async deleteUser(id: string, actor: UserAccount): Promise<{ success: boolean; error?: string }> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { success: false, error: 'User not found' };
    if (actor.id === id) return { success: false, error: 'You cannot delete your own account' };
    if (await prisma.worker.findUnique({ where: { email: user.email } })) {
      return { success: false, error: 'Delete worker accounts from technician management to keep technician records synchronized' };
    }
    if (user.role === 'super_admin' && user.isActive && await prisma.user.count({ where: { role: 'super_admin', isActive: true } }) <= 1) {
      return { success: false, error: 'At least one active Super Admin account must remain' };
    }
    await prisma.$transaction(async (tx) => {
      await this.writeAudit(tx, actor, 'USER_DELETED', 'user', id, `Deleted account ${user.email}`, user.department);
      await tx.user.delete({ where: { id } });
    });
    return { success: true };
  }

  async getIssuesForRole(user: UserAccount, targetDeptFilter?: string): Promise<Issue[]> {
    const where: Prisma.IssueWhereInput = {};
    if (user.role === 'department_supervisor') {
      where.department = user.department || '';
    } else if (targetDeptFilter && targetDeptFilter !== 'all') {
      where.department = targetDeptFilter;
    }
    if (user.role === 'user') where.reportedByUserId = user.id;
    if (user.role === 'worker') {
      const worker = await prisma.worker.findUnique({ where: { email: user.email } });
      if (!worker) return [];
      where.assignedWorkerId = worker.id;
    }
    return (await prisma.issue.findMany({ where, orderBy: { reportedAt: 'desc' } })).map(asIssue);
  }

  async getIssueById(id: string): Promise<Issue | undefined> {
    const issue = await prisma.issue.findFirst({ where: { OR: [{ id }, { ticketId: id }] } });
    return issue ? asIssue(issue) : undefined;
  }

  async getAvailableIssuesForWorker(user: UserAccount): Promise<Issue[]> {
    const worker = await prisma.worker.findUnique({ where: { email: user.email } });
    if (!worker || worker.status !== 'available') return [];
    return (await prisma.issue.findMany({
      where: {
        department: worker.department,
        status: 'queued',
        assignedWorkerId: null,
      },
      orderBy: [{ priority: 'asc' }, { reportedAt: 'asc' }],
    })).map(asIssue);
  }

  async hasActiveIssueForWorker(workerId: string, excludingIssueId?: string): Promise<boolean> {
    const issue = await prisma.issue.findFirst({
      where: {
        assignedWorkerId: workerId,
        status: { not: 'resolved' },
        ...(excludingIssueId ? { id: { not: excludingIssueId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(issue);
  }

  async acceptIssue(issueId: string, actor: UserAccount): Promise<Issue | undefined> {
    const worker = await prisma.worker.findUnique({ where: { email: actor.email } });
    if (!worker || worker.status !== 'available') return undefined;
    try {
      return await prisma.$transaction(async (tx) => {
        const claimedWorker = await tx.worker.updateMany({
          where: { id: worker.id, status: 'available' },
          data: { status: 'busy' },
        });
        if (!claimedWorker.count) return undefined;
        const changed = await tx.issue.updateMany({
          where: {
            id: issueId,
            department: worker.department,
            status: 'queued',
            assignedWorkerId: null,
          },
          data: {
            assignedWorkerId: worker.id,
            assignedWorkerName: worker.name,
            status: 'assigned',
          },
        });
        if (!changed.count) throw new IssueNoLongerAvailableError();
        const issue = await tx.issue.findUnique({ where: { id: issueId } });
        if (!issue) throw new IssueNoLongerAvailableError();
        await tx.notification.create({
          data: {
            userId: issue.reportedByUserId,
            title: 'Technician Assigned 👨‍🔧',
            body: `${worker.name} accepted your report: "${issue.title}".`,
            type: 'assignment',
            data: { issueId: issue.id, ticketId: issue.ticketId, status: 'assigned' },
          },
        });
        await this.writeAudit(
          tx,
          actor,
          'ISSUE_ACCEPTED',
          'issue',
          issue.ticketId,
          `Worker ${worker.name} accepted issue ${issue.title}`,
          issue.department,
        );
        return asIssue(issue);
      });
    } catch (error) {
      if (error instanceof IssueNoLongerAvailableError) return undefined;
      throw error;
    }
  }

  async addIssueFeedback(
    issueId: string,
    userId: string,
    feedback: { rating: number; comment: string },
  ): Promise<Issue | undefined> {
    const issue = await prisma.issue.findFirst({
      where: { OR: [{ id: issueId }, { ticketId: issueId }], reportedByUserId: userId, status: 'resolved' },
    });
    if (!issue) return undefined;
    const updated = await prisma.issue.update({
      where: { id: issue.id },
      data: {
        feedback: {
          rating: feedback.rating,
          comment: feedback.comment,
          submittedAt: new Date().toISOString(),
        },
      },
    });
    return asIssue(updated);
  }

  async getWorkerByEmail(email: string): Promise<Worker | undefined> {
    const worker = await prisma.worker.findUnique({ where: { email: email.toLowerCase() } });
    return worker ? asWorker(worker) : undefined;
  }

  async getWorkerPerformance(email: string): Promise<WorkerPerformance | undefined> {
    const worker = await prisma.worker.findUnique({
      where: { email: email.toLowerCase() },
      include: { issues: { select: { status: true, resolvedAt: true, reportedAt: true, reworkCount: true, feedback: true } } },
    });
    if (!worker) return undefined;

    const resolved = worker.issues.filter((issue) => issue.status === 'resolved');
    const completedWithDuration = resolved.filter((issue) => issue.resolvedAt);
    const ratings = worker.issues.flatMap((issue) => {
      const feedback = issue.feedback;
      return feedback && typeof feedback === 'object' && !Array.isArray(feedback)
        && typeof feedback.rating === 'number'
        ? [feedback.rating]
        : [];
    });

    return {
      rating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : worker.rating,
      ratingsCount: ratings.length,
      jobsCompleted: resolved.length,
      resolvedIssues: resolved.length,
      activeIssues: worker.issues.filter((issue) => issue.status === 'assigned' || issue.status === 'in_progress').length,
      reworkRate: resolved.length
        ? resolved.filter((issue) => issue.reworkCount > 0).length / resolved.length * 100
        : worker.reworkRate,
      averageResolutionMinutes: completedWithDuration.length
        ? completedWithDuration.reduce(
          (total, issue) => total + (issue.resolvedAt!.getTime() - issue.reportedAt.getTime()) / 60000,
          0,
        ) / completedWithDuration.length
        : null,
    };
  }

  async getWorkersForRole(user: UserAccount, targetDeptFilter?: string): Promise<Worker[]> {
    const where: Prisma.WorkerWhereInput = {};
    if (user.role === 'department_supervisor') {
      where.department = user.department || '';
    } else if (targetDeptFilter && targetDeptFilter !== 'all') {
      where.department = targetDeptFilter;
    }
    return (await prisma.worker.findMany({ where, orderBy: { name: 'asc' } })).map(asWorker);
  }

  async getWorkerById(id: string): Promise<Worker | undefined> {
    const worker = await prisma.worker.findUnique({ where: { id } });
    return worker ? asWorker(worker) : undefined;
  }

  async getShiftsForRole(user: UserAccount): Promise<ShiftRoster[]> {
    const shifts = await prisma.shiftRoster.findMany({
      where: user.role === 'super_admin' ? {} : { department: user.department || '' },
      orderBy: { date: 'desc' },
    });
    return shifts.map(asShift);
  }

  async getAuditLogsForRole(user: UserAccount): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
      where: user.role === 'super_admin' ? {} : { department: user.department || '' },
      orderBy: { timestamp: 'desc' },
    });
    return logs.map(asAudit);
  }

  async getEscalationQueue(user: UserAccount): Promise<Issue[]> {
    return (await this.getIssuesForRole(user)).filter((issue) => (
      issue.status === 'escalated'
      || issue.priority === 'Critical'
      || (new Date(issue.slaDeadline).getTime() < Date.now() && issue.status !== 'resolved')
    ));
  }

  async getDepartmentMetrics(user: UserAccount, specificDept?: string): Promise<DepartmentMetrics[]> {
    let selected: string[];
    if (user.role === 'department_supervisor') {
      selected = [user.department || ''];
    } else if (specificDept && specificDept !== 'all') {
      selected = [specificDept];
    } else {
      const [issueDepartments, workerDepartments] = await Promise.all([
        prisma.issue.findMany({ distinct: ['department'], select: { department: true } }),
        prisma.worker.findMany({ distinct: ['department'], select: { department: true } }),
      ]);
      selected = Array.from(new Set([
        ...issueDepartments.map(({ department }) => department),
        ...workerDepartments.map(({ department }) => department),
      ])).sort((a, b) => a.localeCompare(b));
    }
    const metrics = await Promise.all(selected.map(async (department) => {
      const where = { department };
      const [statusCounts, resolved, activeWorkers] = await Promise.all([
        prisma.issue.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
          _sum: { reworkCount: true },
        }),
        prisma.issue.findMany({
          where: { ...where, status: 'resolved', resolvedAt: { not: null } },
          select: { reportedAt: true, resolvedAt: true, slaDeadline: true },
        }),
        prisma.worker.count({ where: { department, status: { not: 'off_duty' } } }),
      ]);
      const getCount = (status: Issue['status']) => statusCounts.find((item) => item.status === status)?._count._all || 0;
      const totalIssues = statusCounts.reduce((total, item) => total + item._count._all, 0);
      const resolvedIssues = getCount('resolved');
      const pendingIssues = totalIssues - resolvedIssues;
      const escalatedIssues = getCount('escalated');
      const resolution = resolved.map((issue) => (issue.resolvedAt!.getTime() - issue.reportedAt.getTime()) / 60_000);
      const withinSla = resolved.filter((issue) => issue.resolvedAt! <= issue.slaDeadline).length;
      const reworkCount = statusCounts.reduce((total, item) => total + (item._sum.reworkCount || 0), 0);
      return {
        department,
        totalIssues,
        resolvedIssues,
        pendingIssues,
        escalatedIssues,
        activeWorkers,
        avgResolutionTimeMins: resolution.length ? Number((resolution.reduce((a, b) => a + b, 0) / resolution.length).toFixed(1)) : 0,
        slaComplianceRate: resolved.length ? Number(((withinSla / resolved.length) * 100).toFixed(1)) : 0,
        reworkRate: totalIssues ? Number(((reworkCount / totalIssues) * 100).toFixed(1)) : 0,
      };
    }));
    return metrics;
  }

  async getResolutionTrend(user: UserAccount): Promise<{ date: string; resolved: number; escalated: number; avgMins: number }[]> {
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 6);
    start.setUTCHours(0, 0, 0, 0);
    const departmentWhere: Prisma.IssueWhereInput = user.role === 'department_supervisor'
      ? { department: user.department || '' }
      : {};
    const [resolved, escalated] = await Promise.all([
      prisma.issue.findMany({
        where: { ...departmentWhere, status: 'resolved', resolvedAt: { gte: start, lte: end } },
        select: { resolvedAt: true, reportedAt: true },
      }),
      prisma.issue.findMany({
        where: { ...departmentWhere, status: 'escalated', reportedAt: { gte: start, lte: end } },
        select: { reportedAt: true },
      }),
    ]);
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + offset);
      const dateKey = date.toISOString().slice(0, 10);
      const resolvedThatDay = resolved.filter((issue) => issue.resolvedAt?.toISOString().slice(0, 10) === dateKey);
      const durations = resolvedThatDay.map((issue) => (issue.resolvedAt!.getTime() - issue.reportedAt.getTime()) / 60_000);
      return {
        date: dateKey,
        resolved: resolvedThatDay.length,
        escalated: escalated.filter((issue) => issue.reportedAt.toISOString().slice(0, 10) === dateKey).length,
        avgMins: durations.length ? Number((durations.reduce((total, minutes) => total + minutes, 0) / durations.length).toFixed(1)) : 0,
      };
    });
  }

  async createIssue(data: Partial<Issue>, user: UserAccount): Promise<Issue> {
    const priority = data.priority || 'Normal';
    const slaMinutes = data.slaMinutes || (priority === 'Critical' ? 30 : priority === 'High' ? 60 : 180);
    const issue = await prisma.$transaction(async (tx) => {
      const created = await tx.issue.create({
        data: {
          ticketId: `FX-${randomUUID().slice(0, 8).toUpperCase()}`,
          title: data.title || 'Untitled Issue',
          description: data.description || '',
          category: data.category || 'General',
          department: user.role === 'department_supervisor' ? user.department || '' : data.department || 'General',
          building: data.building || '',
          floor: data.floor || '',
          room: data.room || '',
          priority,
          reportedBy: user.name,
          reportedByUserId: user.id,
          slaMinutes,
          slaDeadline: data.slaDeadline ? new Date(data.slaDeadline) : new Date(Date.now() + slaMinutes * 60_000),
          photoUrl: data.photoUrl || null,
          coordinates: data.coordinates as Prisma.InputJsonValue | undefined,
          feedback: data.feedback ? {
            rating: data.feedback.rating,
            comment: data.feedback.comment,
            submittedAt: data.feedback.submittedAt,
          } : undefined,
          reworkCount: 0,
        },
      });
      await this.writeAudit(tx, user, 'ISSUE_CREATED', 'issue', created.ticketId, `Created issue: ${created.title}`, created.department);
      return created;
    });
    return asIssue(issue);
  }

  async updateIssue(id: string, updates: Partial<Issue>, actor: UserAccount): Promise<Issue | undefined> {
    const current = await this.getIssueById(id);
    if (!current) return undefined;
    const data: Prisma.IssueUpdateInput = {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.department !== undefined && { department: updates.department }),
      ...(updates.building !== undefined && { building: updates.building }),
      ...(updates.floor !== undefined && { floor: updates.floor }),
      ...(updates.room !== undefined && { room: updates.room }),
      ...(updates.status !== undefined && { status: updates.status, resolvedAt: updates.status === 'resolved' ? new Date() : null }),
      ...(updates.priority !== undefined && { priority: updates.priority }),
      ...(updates.slaMinutes !== undefined && { slaMinutes: updates.slaMinutes }),
      ...(updates.slaDeadline !== undefined && { slaDeadline: new Date(updates.slaDeadline) }),
      ...(updates.assignedWorkerId !== undefined && { assignedWorkerId: updates.assignedWorkerId }),
      ...(updates.assignedWorkerName !== undefined && { assignedWorkerName: updates.assignedWorkerName }),
      ...(updates.photoUrl !== undefined && { photoUrl: updates.photoUrl }),
      ...(updates.resolutionPhoto !== undefined && { resolutionPhoto: updates.resolutionPhoto }),
      ...(updates.coordinates !== undefined && { coordinates: updates.coordinates as Prisma.InputJsonValue }),
      ...(updates.feedback !== undefined && { feedback: updates.feedback ? {
        rating: updates.feedback.rating,
        comment: updates.feedback.comment,
        submittedAt: updates.feedback.submittedAt,
      } : Prisma.JsonNull }),
      ...(updates.reworkCount !== undefined && { reworkCount: updates.reworkCount }),
    };
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.issue.update({ where: { id: current.id }, data });
      if (updates.status === 'resolved' && current.assignedWorkerId) {
        const remainingActiveIssue = await tx.issue.findFirst({
          where: {
            assignedWorkerId: current.assignedWorkerId,
            status: { not: 'resolved' },
          },
          select: { id: true },
        });
        if (!remainingActiveIssue) {
          await tx.worker.updateMany({
            where: { id: current.assignedWorkerId, status: 'busy' },
            data: { status: 'available' },
          });
        }
      }
      await this.writeAudit(tx, actor, 'ISSUE_UPDATED', 'issue', result.ticketId, `Updated issue ${result.ticketId}`, result.department);
      return result;
    });
    return asIssue(updated);
  }

  async deleteIssue(id: string, actor: UserAccount): Promise<boolean> {
    const issue = await this.getIssueById(id);
    if (!issue) return false;
    await prisma.$transaction(async (tx) => {
      await this.writeAudit(tx, actor, 'ISSUE_DELETED', 'issue', issue.ticketId, `Deleted issue ${issue.ticketId}`, issue.department);
      await tx.issue.delete({ where: { id: issue.id } });
    });
    return true;
  }

  async reassignIssue(issueId: string, workerId: string, actor: UserAccount): Promise<{ success: boolean; issue?: Issue; error?: string }> {
    const issue = await this.getIssueById(issueId);
    const worker = await this.getWorkerById(workerId);
    if (!issue) return { success: false, error: 'Issue not found' };
    if (!worker) return { success: false, error: 'Worker not found' };
    if (actor.role === 'department_supervisor'
      && (issue.department.toLowerCase() !== actor.department?.toLowerCase() || worker.department.toLowerCase() !== actor.department?.toLowerCase())) {
      return { success: false, error: '403 Forbidden: Cannot assign outside your department' };
    }
    if (issue.assignedWorkerId === worker.id) {
      return { success: true, issue };
    }
    if (worker.status !== 'available' || await this.hasActiveIssueForWorker(worker.id, issue.id)) {
      return { success: false, error: 'This technician must finish their active issue before receiving another assignment' };
    }
    const result = await prisma.$transaction(async (tx) => {
      const claimedWorker = await tx.worker.updateMany({
        where: { id: worker.id, status: 'available' },
        data: { status: 'busy' },
      });
      if (!claimedWorker.count) {
        return { success: false as const, error: 'This technician is no longer available' };
      }
      const changed = await tx.issue.update({
        where: { id: issue.id },
        data: { assignedWorkerId: worker.id, assignedWorkerName: worker.name, status: 'assigned' },
      });
      await tx.notification.create({
        data: {
          userId: issue.reportedByUserId,
          title: 'Technician Assigned 👨‍🔧',
          body: `Technician ${worker.name} has been assigned to your report: "${issue.title}".`,
          type: 'assignment',
          data: { issueId: issue.id, ticketId: issue.ticketId, status: 'assigned' },
        },
      });
      const workerAccount = await tx.user.findFirst({ where: { email: worker.email } });
      if (workerAccount) {
        await tx.notification.create({
          data: {
            userId: workerAccount.id,
            title: 'New Job Assigned 📋',
            body: `You have been assigned to ${issue.ticketId}: "${issue.title}".`,
            type: 'assignment',
            data: { issueId: issue.id, ticketId: issue.ticketId, status: 'assigned' },
          },
        });
      }
      await this.writeAudit(tx, actor, 'MANUAL_REASSIGNMENT', 'issue', issue.ticketId, `Assigned to ${worker.name}`, issue.department);
      if (issue.assignedWorkerId && issue.assignedWorkerId !== worker.id) {
        const previousWorkerHasActiveIssue = await tx.issue.findFirst({
          where: {
            assignedWorkerId: issue.assignedWorkerId,
            status: { not: 'resolved' },
          },
          select: { id: true },
        });
        if (!previousWorkerHasActiveIssue) {
          await tx.worker.updateMany({
            where: { id: issue.assignedWorkerId, status: 'busy' },
            data: { status: 'available' },
          });
        }
      }
      return { success: true as const, issue: asIssue(changed) };
    });
    return result;
  }

  async updateWorkerShift(workerId: string, shift: string, status: Worker['status'], actor: UserAccount): Promise<{ success: boolean; worker?: Worker; error?: string }> {
    const worker = await this.getWorkerById(workerId);
    if (!worker) return { success: false, error: 'Worker not found' };
    if (actor.role === 'department_supervisor' && worker.department.toLowerCase() !== actor.department?.toLowerCase()) {
      return { success: false, error: '403 Forbidden: Cannot adjust shift outside your department' };
    }
    const date = new Date().toISOString().slice(0, 10);
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.worker.update({ where: { id: workerId }, data: { shift, status } });
      await tx.shiftRoster.upsert({
        where: { workerId_date: { workerId, date } },
        create: {
          workerId, workerName: worker.name, department: worker.department, shift, date,
          status: status === 'off_duty' ? 'leave' : 'active', buildingAssigned: worker.currentBuilding,
        },
        update: { shift, status: status === 'off_duty' ? 'leave' : 'active' },
      });
      await this.writeAudit(tx, actor, 'SHIFT_ROSTER_UPDATE', 'shift', workerId, `Updated ${worker.name}: ${status}, ${shift}`, worker.department);
      return result;
    });
    return { success: true, worker: asWorker(updated) };
  }

  async createWorker(data: Omit<Worker, 'id'> & { id?: string; password: string }, actor: UserAccount): Promise<Worker> {
    const worker = await prisma.$transaction(async (tx) => {
      const created = await tx.worker.create({
        data: {
          ...(data.id && { id: data.id }),
          name: data.name,
          email: data.email.toLowerCase(),
          phone: data.phone,
          department: data.department,
          status: data.status,
          rating: data.rating,
          jobsCompleted: data.jobsCompleted,
          reworkRate: data.reworkRate,
          shift: data.shift,
          currentBuilding: data.currentBuilding,
          coordinates: data.coordinates,
        },
      });
      await tx.user.create({
        data: {
          name: created.name,
          email: created.email,
          passwordHash: await bcrypt.hash(data.password, 12),
          role: 'worker',
          department: created.department,
        },
      });
      await this.writeAudit(tx, actor, 'WORKER_CREATED', 'worker', created.id, `Created worker ${created.name}`, created.department);
      return created;
    });
    return asWorker(worker);
  }

  async updateWorker(id: string, updates: Partial<Worker>, actor: UserAccount): Promise<Worker | undefined> {
    const worker = await prisma.worker.findUnique({ where: { id } });
    if (!worker) return undefined;
    const changed = await prisma.$transaction(async (tx) => {
      const result = await tx.worker.update({
        where: { id },
        data: {
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.email !== undefined && { email: updates.email.toLowerCase() }),
          ...(updates.phone !== undefined && { phone: updates.phone }),
          ...(updates.department !== undefined && { department: updates.department }),
          ...(updates.status !== undefined && { status: updates.status }),
          ...(updates.rating !== undefined && { rating: updates.rating }),
          ...(updates.jobsCompleted !== undefined && { jobsCompleted: updates.jobsCompleted }),
          ...(updates.reworkRate !== undefined && { reworkRate: updates.reworkRate }),
          ...(updates.shift !== undefined && { shift: updates.shift }),
          ...(updates.currentBuilding !== undefined && { currentBuilding: updates.currentBuilding }),
          ...(updates.coordinates !== undefined && { coordinates: updates.coordinates }),
        },
      });
      await tx.user.updateMany({ where: { email: worker.email }, data: { name: result.name, email: result.email, department: result.department } });
      await this.writeAudit(tx, actor, 'WORKER_UPDATED', 'worker', id, `Updated worker ${result.name}`, result.department);
      return result;
    });
    return asWorker(changed);
  }

  async deleteWorker(id: string, actor: UserAccount): Promise<{ success: boolean; error?: string }> {
    const worker = await prisma.worker.findUnique({ where: { id }, include: { issues: { where: { status: { not: 'resolved' } } } } });
    if (!worker) return { success: false, error: 'Worker not found' };
    if (worker.issues.length) return { success: false, error: 'Cannot delete a worker assigned to an open issue' };
    await prisma.$transaction(async (tx) => {
      await this.writeAudit(tx, actor, 'WORKER_DELETED', 'worker', id, `Deleted worker ${worker.name}`, worker.department);
      await tx.worker.delete({ where: { id } });
      const account = await tx.user.findUnique({ where: { email: worker.email } });
      if (account?.role === 'worker') {
        const issueHistory = await tx.issue.count({ where: { reportedByUserId: account.id } });
        if (issueHistory) {
          await tx.user.update({ where: { id: account.id }, data: { isActive: false } });
        } else {
          await tx.user.delete({ where: { id: account.id } });
        }
      }
    });
    return { success: true };
  }

  async updateIssueStatus(issueId: string, status: Issue['status'], actor: UserAccount, resolutionPhoto?: string): Promise<{ success: boolean; issue?: Issue; error?: string }> {
    const issue = await this.getIssueById(issueId);
    if (!issue) return { success: false, error: 'Issue not found' };
    if (actor.role === 'department_supervisor' && issue.department.toLowerCase() !== actor.department?.toLowerCase()) {
      return { success: false, error: '403 Forbidden: Cannot update other departments' };
    }
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.issue.update({
        where: { id: issue.id },
        data: {
          status,
          ...(resolutionPhoto !== undefined && { resolutionPhoto }),
          resolvedAt: status === 'resolved' ? new Date() : null,
        },
      });
      if (actor.role === 'worker' && status === 'resolved') {
        const activeIssue = await tx.issue.findFirst({
          where: {
            assignedWorkerId: issue.assignedWorkerId,
            status: { not: 'resolved' },
          },
          select: { id: true },
        });
        if (!activeIssue) {
          await tx.worker.updateMany({
            where: { email: actor.email, status: 'busy' },
            data: { status: 'available' },
          });
        }
      }
      if (issue.status !== status) {
        let title = 'Report status updated';
        let body = `${issue.ticketId} is now ${status.replace('_', ' ')}.`;
        let notifType = 'assignment';

        if (status === 'in_progress') {
          title = 'Work In Progress 🛠️';
          body = `A technician is now actively working on ${issue.ticketId}: "${issue.title}".`;
        } else if (status === 'resolved') {
          title = 'Issue Resolved ✅';
          body = `Your report ${issue.ticketId} ("${issue.title}") has been marked as resolved! Tap to review.`;
        } else if (status === 'escalated') {
          title = 'Issue Escalated ⚠️';
          body = `Your report ${issue.ticketId} ("${issue.title}") has been escalated for administrative review.`;
          notifType = 'alert';
        }

        await tx.notification.create({
          data: {
            userId: issue.reportedByUserId,
            title,
            body,
            type: notifType,
            data: { issueId: issue.id, ticketId: issue.ticketId, status },
          },
        });
      }
      await this.writeAudit(tx, actor, 'ISSUE_STATUS_CHANGE', 'issue', issue.ticketId, `Status changed from ${issue.status} to ${status}`, issue.department);
      return result;
    });
    return { success: true, issue: asIssue(updated) };
  }

  private async writeAudit(
    transaction: Prisma.TransactionClient,
    actor: UserAccount,
    action: string,
    targetType: AuditLog['targetType'],
    targetId: string,
    details: string,
    department?: string | null,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        id: randomUUID(),
        adminId: actor.id,
        adminName: actor.name,
        adminRole: actor.role,
        action,
        targetType,
        targetId,
        details,
        department: department || null,
      },
    });
  }
}

export const db = new DatabaseStore();
