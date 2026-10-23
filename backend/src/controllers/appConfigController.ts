import { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { getAppConfig } from '../services/appSettings';

async function updateAppSetting(
  tx: Prisma.TransactionClient,
  key: string,
  value: string,
): Promise<void> {
  await tx.appSetting.upsert({
    where: { key },
    create: { key, value, updatedAt: new Date() },
    update: { value, updatedAt: new Date() },
  });
}

function validSetting(value: unknown, name: string, maxLength: number): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new Error(`${name} must be between 1 and ${maxLength} characters.`);
  }
  return value.trim();
}

export const appConfigController = {
  get: async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await getAppConfig());
    } catch (error) {
      console.error('Failed to load app config:', error);
      res.status(500).json({ error: 'Failed to load app configuration' });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let appName: string | undefined;
    let version: string | undefined;
    let university: string | undefined;
    try {
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        res.status(400).json({ error: 'App settings must be provided as an object.' });
        return;
      }
      const input = req.body as Record<string, unknown>;
      appName = validSetting(input.appName, 'App name', 80);
      version = validSetting(input.version, 'App version', 32);
      university = validSetting(input.university, 'University name', 160);

      if (!appName && !version && !university) {
        res.status(400).json({ error: 'Provide at least one app setting to update.' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        if (appName) await updateAppSetting(tx, 'app_name', appName);
        if (version) await updateAppSetting(tx, 'app_version', version);
        if (university) await updateAppSetting(tx, 'university_name', university);
      });

      res.json({
        success: true,
        ...await getAppConfig(),
      });
    } catch (error) {
      if (error instanceof Error && /must be between/.test(error.message)) {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Failed to update app config:', error);
      res.status(500).json({ error: 'Failed to update app configuration' });
    }
  }
};
