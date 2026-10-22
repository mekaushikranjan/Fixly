import { randomUUID } from 'node:crypto';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { db } from '../db/store';
import { AuthenticatedRequest, generateToken } from '../middleware/auth';
import { ResidenceType, UserAccount, UserRole } from '../models/types';
import { createFirebaseCustomToken, FirebaseAdminConfigurationError, verifyFirebaseIdToken } from '../services/firebaseAdmin';
import { sendWelcomeNotification } from '../services/notificationService';

const roles: UserRole[] = ['user', 'worker', 'department_supervisor', 'super_admin'];
const passwordResetCodes = new Map<string, { code: string; expiresAt: number }>();

function validAccountFields(input: Record<string, unknown>): string | undefined {
  if (typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.length > 120) {
    return 'Name must be between 2 and 120 characters';
  }
  if (typeof input.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return 'A valid email address is required';
  }
  if (!roles.includes(input.role as UserRole)) return 'A valid role is required';
  if (input.role === 'department_supervisor' && (typeof input.department !== 'string' || !input.department.trim())) {
    return 'Department is required for department supervisors';
  }
  if (input.role === 'worker' && (typeof input.department !== 'string' || !input.department.trim())) {
    return 'Department is required for worker accounts';
  }
  if (input.residenceType !== undefined
    && input.residenceType !== null
    && input.residenceType !== 'hostel'
    && input.residenceType !== 'day_scholar') {
    return 'Residence type must be hostel or day_scholar';
  }
  for (const field of ['phone', 'address', 'city', 'building', 'room'] as const) {
    if (input[field] !== undefined && input[field] !== null
      && (typeof input[field] !== 'string' || input[field].length > 500)) {
      return `${field} must be a string no longer than 500 characters`;
    }
  }
  return undefined;
}

function reportDatabaseError(error: unknown, res: Response): void {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    res.status(409).json({ error: 'An account with that email already exists' });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    res.status(409).json({ error: 'This account is referenced by existing records and cannot be deleted' });
    return;
  }
  if (error instanceof Error && (
    error.message === 'At least one active Super Admin account must remain'
    || error.message.startsWith('Worker accounts must remain')
    || error.message.startsWith('Create worker accounts')
  )) {
    res.status(409).json({ error: error.message });
    return;
  }
  console.error('User account database operation failed:', error);
  res.status(500).json({ error: 'Unable to complete the account operation' });
}

export const authController = {
  register: async (req: Request, res: Response): Promise<void> => {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (name.length < 2 || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) {
      res.status(400).json({ error: 'Provide a valid name, email, and password of at least 12 characters' });
      return;
    }
    try {
      const user = await db.createPublicUser(name, email, password);
      await sendWelcomeNotification(user);
      res.status(201).json({ success: true, token: generateToken(user), user });
    } catch (error) {
      reportDatabaseError(error, res);
    }
  },

  login: async (req: Request, res: Response): Promise<void> => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    try {
    const account = await db.getUserWithPassword(email);
    if (!account || !account.isActive || !(await bcrypt.compare(password, account.passwordHash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const { passwordHash: _passwordHash, ...user } = account;
    res.json({ success: true, token: generateToken(user), user });
    } catch (error) {
      reportDatabaseError(error, res);
    }
  },

  forgotPassword: async (req: Request, res: Response): Promise<void> => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    try {
      const user = await db.getUserWithPassword(email);
      if (!user) {
        res.status(404).json({ error: 'No Fixly account found with this email address.' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ error: 'This account is deactivated. Contact campus administrator.' });
        return;
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      passwordResetCodes.set(email, {
        code,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });

      console.log(`[AUTH] Password reset code for ${email}: ${code}`);

      res.json({
        success: true,
        message: 'Password reset code generated. Use the code to reset your password.',
        code,
        email,
      });
    } catch (error) {
      reportDatabaseError(error, res);
    }
  },

  resetPassword: async (req: Request, res: Response): Promise<void> => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';

    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, verification code, and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const record = passwordResetCodes.get(email);
    if (!record || record.code !== code) {
      res.status(400).json({ error: 'Invalid or expired verification code.' });
      return;
    }

    if (Date.now() > record.expiresAt) {
      passwordResetCodes.delete(email);
      res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
      return;
    }

    try {
      const passwordHash = await bcrypt.hash(newPassword, 12);
      const updated = await db.updatePasswordByEmail(email, passwordHash);
      if (!updated) {
        res.status(404).json({ error: 'Account not found.' });
        return;
      }

      passwordResetCodes.delete(email);
      console.log(`[AUTH] Password reset successfully for ${email}`);

      res.json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      });
    } catch (error) {
      reportDatabaseError(error, res);
    }
  },

  googleLogin: async (req: Request, res: Response): Promise<void> => {
    const idToken = typeof req.body.firebaseIdToken === 'string' ? req.body.firebaseIdToken : '';
    if (!idToken) {
      res.status(400).json({ error: 'A Firebase ID token is required' });
      return;
    }
    try {
      const decoded = await verifyFirebaseIdToken(idToken);
      if (decoded.firebase?.sign_in_provider !== 'google.com' || !decoded.email || decoded.email_verified !== true) {
        res.status(401).json({ error: 'Sign in with a Google account whose email address is verified' });
        return;
      }
      let account = await db.getFirebaseUser(decoded.email);
      let createdAccount = false;
      if (!account) {
        const name = typeof decoded.name === 'string' && decoded.name.trim()
          ? decoded.name.trim().slice(0, 120)
          : decoded.email.split('@')[0].slice(0, 120);
        const avatar = typeof decoded.picture === 'string' && decoded.picture.length <= 500
          ? decoded.picture
          : undefined;
        try {
          account = {
            ...await db.createGoogleUser(name, decoded.email, decoded.uid, avatar),
            firebaseUid: decoded.uid,
          };
          createdAccount = true;
        } catch (createError) {
          if (!(createError instanceof Prisma.PrismaClientKnownRequestError) || createError.code !== 'P2002') {
            throw createError;
          }
          account = await db.getFirebaseUser(decoded.email);
          if (!account) throw createError;
        }
      }
      if (createdAccount) await sendWelcomeNotification(account);
      if (!account.isActive) {
        res.status(403).json({ error: 'This Fixly account is inactive' });
        return;
      }
      if (account.firebaseUid && account.firebaseUid !== decoded.uid) {
        res.status(403).json({ error: 'This Fixly account is linked to a different Firebase identity' });
        return;
      }
      if (!account.firebaseUid) await db.linkFirebaseUid(account.id, decoded.uid);
      res.json({ success: true, token: generateToken(account), user: account });
    } catch (error) {
      if (error instanceof FirebaseAdminConfigurationError) {
        res.status(503).json({ error: error.message });
        return;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        res.status(409).json({ error: 'That Firebase account is already linked to another Fixly account' });
        return;
      }
      console.error('Firebase sign-in verification failed:', error);
      res.status(401).json({ error: 'Firebase sign-in could not be verified' });
    }
  },

  getMe: (req: AuthenticatedRequest, res: Response): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({ user: req.user });
  },

  getFirebaseCustomToken: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    try {
      const customToken = await createFirebaseCustomToken(req.user.id, req.user.role);
      res.json({ customToken });
    } catch (error) {
      if (error instanceof FirebaseAdminConfigurationError) {
        res.status(503).json({ error: error.message });
        return;
      }
      console.error('Unable to issue Firebase session token:', error);
      res.status(503).json({ error: 'Firebase Storage authentication is unavailable' });
    }
  },

  updateMe: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const input = req.body as Record<string, unknown>;
    const updates: {
      name?: string;
      phone?: string | null;
      residenceType?: ResidenceType | null;
      address?: string | null;
      city?: string | null;
      building?: string | null;
      room?: string | null;
      avatar?: string | null;
    } = {};
    if (input.name !== undefined) {
      if (typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.trim().length > 120) {
        res.status(400).json({ error: 'Name must be between 2 and 120 characters' });
        return;
      }
      updates.name = input.name.trim();
    }
    if (input.residenceType !== undefined) {
      if (input.residenceType !== null && input.residenceType !== 'hostel' && input.residenceType !== 'day_scholar') {
        res.status(400).json({ error: 'Residence type must be hostel or day_scholar' });
        return;
      }
      updates.residenceType = input.residenceType as ResidenceType | null;
    }
    for (const field of ['phone', 'address', 'city', 'building', 'room', 'avatar'] as const) {
      const value = input[field];
      if (value === undefined) continue;
      if (value !== null && typeof value !== 'string') {
        res.status(400).json({ error: `${field} must be a string` });
        return;
      }
      if (typeof value === 'string' && value.length > 500) {
        res.status(400).json({ error: `${field} is too long` });
        return;
      }
      updates[field] = typeof value === 'string' && value.trim() ? value.trim() : null;
    }
    if (updates.residenceType === 'hostel') {
      updates.address = null;
      updates.city = null;
    } else if (updates.residenceType === 'day_scholar') {
      updates.building = null;
      updates.room = null;
    }
    if (!Object.keys(updates).length) {
      res.status(400).json({ error: 'At least one profile field is required' });
      return;
    }
    try {
      res.json({ user: await db.updateAccountProfile(req.user!.id, updates) });
    } catch (error) {
      reportDatabaseError(error, res);
    }
  },

  list: async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      res.json({ users: await db.getUsers() });
    } catch (error) {
      reportDatabaseError(error, res);
    }
  },

  create: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const input = req.body as Record<string, unknown>;
    const validationError = validAccountFields(input);
    const password = typeof input.password === 'string' ? input.password : '';
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    if (input.role === 'worker') {
      res.status(400).json({ error: 'Create worker accounts from the technician roster' });
      return;
    }
    if (password.length < 12) {
      res.status(400).json({ error: 'Password must be at least 12 characters' });
      return;
    }

    const user: Omit<UserAccount, 'isActive'> = {
      id: randomUUID(),
      name: (input.name as string).trim(),
      email: (input.email as string).trim().toLowerCase(),
      role: input.role as UserRole,
      department: typeof input.department === 'string' ? input.department.trim() : undefined,
      avatar: typeof input.avatar === 'string' ? input.avatar : undefined,
      residenceType: input.residenceType as ResidenceType | undefined,
      address: typeof input.address === 'string' ? input.address.trim() : undefined,
      city: typeof input.city === 'string' ? input.city.trim() : undefined,
      building: typeof input.building === 'string' ? input.building.trim() : undefined,
      room: typeof input.room === 'string' ? input.room.trim() : undefined,
    };
    try {
      const created = await db.createUser(user, password, req.user);
      res.status(201).json({ user: created });
    } catch (error) {
      reportDatabaseError(error, res);
    }
  },

  update: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const input = req.body as Record<string, unknown>;
    const validationError = validAccountFields(input);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    const password = typeof input.password === 'string' ? input.password : '';
    if (password && password.length < 12) {
      res.status(400).json({ error: 'Password must be at least 12 characters' });
      return;
    }
    const isActive = typeof input.isActive === 'boolean' ? input.isActive : true;
    if (req.params.id === req.user?.id && !isActive) {
      res.status(400).json({ error: 'You cannot deactivate your own account' });
      return;
    }
    try {
      const updated = await db.updateUser(req.params.id, {
        name: (input.name as string).trim(),
        email: (input.email as string).trim().toLowerCase(),
        role: input.role as UserRole,
        department: typeof input.department === 'string' ? input.department.trim() : undefined,
        avatar: typeof input.avatar === 'string' ? input.avatar : undefined,
        residenceType: input.residenceType as ResidenceType | undefined,
        address: typeof input.address === 'string' ? input.address.trim() : undefined,
        city: typeof input.city === 'string' ? input.city.trim() : undefined,
        building: typeof input.building === 'string' ? input.building.trim() : undefined,
        room: typeof input.room === 'string' ? input.room.trim() : undefined,
        isActive,
        password: password || undefined,
      }, req.user!);
      if (!updated) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({ user: updated });
    } catch (error) {
      reportDatabaseError(error, res);
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await db.deleteUser(req.params.id, req.user!);
      if (!result.success) {
        const status = result.error === 'User not found' ? 404
          : result.error?.includes('referenced') || result.error?.includes('Super Admin') || result.error?.includes('worker accounts') ? 409 : 400;
        res.status(status).json({ error: result.error });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      reportDatabaseError(error, res);
    }
  },
};
