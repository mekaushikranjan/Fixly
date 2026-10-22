import { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const DEFAULT_VERSION = '1.0.0';
const DEFAULT_UNIVERSITY = 'Lovely Professional University';

async function loadAppConfig(): Promise<{
  version: string;
  university: string;
  updatedAt?: string;
}> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: ['app_version', 'university_name'] } },
  });

  const versionSetting = rows.find((row) => row.key === 'app_version');
  const universitySetting = rows.find((row) => row.key === 'university_name');

  return {
    version: versionSetting?.value ?? DEFAULT_VERSION,
    university: universitySetting?.value ?? DEFAULT_UNIVERSITY,
    updatedAt: versionSetting?.updatedAt?.toISOString(),
  };
}

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

function validSetting(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export const appConfigController = {
  get: async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await loadAppConfig());
    } catch (error) {
      console.error('Failed to load app config:', error);
      res.json({
        version: DEFAULT_VERSION,
        university: DEFAULT_UNIVERSITY,
      });
    }
  },

  update: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { version: requestedVersion, university: requestedUniversity } = req.body;
      const version = validSetting(requestedVersion);
      const university = validSetting(requestedUniversity);

      if (version || university) {
        await prisma.$transaction(async (tx) => {
          if (version) await updateAppSetting(tx, 'app_version', version);
          if (university) await updateAppSetting(tx, 'university_name', university);
        });
      }

      res.json({
        success: true,
        ...await loadAppConfig(),
      });
    } catch (error) {
      console.error('Failed to update app config:', error);
      res.status(500).json({ error: 'Failed to update app configuration' });
    }
  }
};
