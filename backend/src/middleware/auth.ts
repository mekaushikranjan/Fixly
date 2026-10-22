import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { db } from '../db/store';
import { UserAccount } from '../models/types';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  return secret;
}

export interface AuthenticatedRequest extends Request {
  user?: UserAccount;
}

export function generateToken(user: UserAccount): string {
  return jwt.sign({ id: user.id }, getJwtSecret(), { expiresIn: '7d' });
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: '401 Unauthorized', message: 'Authentication required to access Fixly API resources.' });
    return;
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7), getJwtSecret());
    if (typeof decoded === 'string' || typeof (decoded as JwtPayload).id !== 'string') {
      res.status(401).json({ error: '401 Unauthorized', message: 'Invalid or expired token.' });
      return;
    }
    const user = await db.getUserById((decoded as JwtPayload).id as string);
    if (!user || !user.isActive) {
      res.status(401).json({ error: '401 Unauthorized', message: 'Account is inactive or no longer exists.' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: '401 Unauthorized', message: 'Invalid or expired token.' });
  }
}
