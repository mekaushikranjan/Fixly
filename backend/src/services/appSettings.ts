import { prisma } from '../db/prisma';

export interface AppConfig {
  appName: string;
  version: string;
  university: string;
  updatedAt?: string;
}

export async function getAppConfig(): Promise<AppConfig> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: ['app_name', 'app_version', 'university_name'] } },
  });

  const appNameSetting = rows.find((row) => row.key === 'app_name');
  const versionSetting = rows.find((row) => row.key === 'app_version');
  const universitySetting = rows.find((row) => row.key === 'university_name');

  if (!appNameSetting?.value || !versionSetting?.value) {
    throw new Error('App name and version must be configured in the database.');
  }

  return {
    appName: appNameSetting.value,
    version: versionSetting.value,
    university: universitySetting?.value ?? '',
    updatedAt: [appNameSetting.updatedAt, versionSetting.updatedAt, universitySetting?.updatedAt]
      .filter((updatedAt): updatedAt is Date => updatedAt instanceof Date)
      .sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString(),
  };
}
