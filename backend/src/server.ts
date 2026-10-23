import dotenv from 'dotenv';
import { resolve } from 'node:path';
import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api';
import { prisma } from './db/prisma';
import { db } from './db/store';
import { checkFirebaseConnection } from './services/firebaseAdmin';
import { checkR2Connection } from './services/r2Storage';
import { renderPreviewPage } from './views/previewHtml';

dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be configured in backend/.env.`);
  return value;
}

const PORT = Number(requiredEnvironmentValue('PORT'));
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65_535) {
  throw new Error('PORT must be a valid TCP port between 1 and 65535.');
}
const allowedOrigins = requiredEnvironmentValue('CORS_ORIGINS')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
if (!allowedOrigins.length) {
  throw new Error('CORS_ORIGINS must include at least one allowed origin.');
}
for (const origin of allowedOrigins) {
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    throw new Error(`CORS_ORIGINS contains an invalid origin: ${origin}`);
  }
  if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.origin !== origin) {
    throw new Error(`CORS_ORIGINS entries must be valid HTTP(S) origins without paths: ${origin}`);
  }
}

const jwtSecret = requiredEnvironmentValue('JWT_SECRET');
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters');
}
requiredEnvironmentValue('DATABASE_URL');
requiredEnvironmentValue('DIRECT_DATABASE_URL');
const bootstrapAdminName = requiredEnvironmentValue('BOOTSTRAP_ADMIN_NAME');
const bootstrapAdminEmail = requiredEnvironmentValue('BOOTSTRAP_ADMIN_EMAIL');
const bootstrapAdminPassword = requiredEnvironmentValue('BOOTSTRAP_ADMIN_PASSWORD');
const appName = process.env.APP_NAME?.trim() || 'Fixly Campus';
const appVersion = process.env.APP_VERSION?.trim() || '1.0.0';

function publicUrl(name: string, value: string | undefined, fallback: string): string {
  const configured = value?.trim();
  if (!configured) return fallback;
  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error(`${name} must be a valid public HTTP(S) URL.`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${name} must use HTTP or HTTPS.`);
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
}

async function checkMobileAppApi(): Promise<void> {
  const configuredUrl = process.env.MOBILE_APP_API_URL?.trim();
  if (!configuredUrl) throw new Error('MOBILE_APP_API_URL is not configured.');

  const configured = new URL(configuredUrl);
  if (!['http:', 'https:'].includes(configured.protocol)) {
    throw new Error('MOBILE_APP_API_URL must use HTTP or HTTPS.');
  }
  const basePath = configured.pathname.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  const healthUrl = `${configured.origin}${basePath}/health`;
  const response = await fetch(healthUrl, { signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error(`Mobile API health check returned HTTP ${response.status}.`);

  const health = await response.json() as { status?: unknown };
  if (health.status !== 'online') throw new Error('Mobile API health endpoint is not online.');
}

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use('/api/issues', (req, res, next) => {
  if (req.method === 'POST' && req.originalUrl.split('?')[0] === '/api/issues') {
    express.json({ limit: '8mb' })(req, res, next);
    return;
  }
  next();
});
app.use(express.json({ limit: '2mb' }));
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/assets', express.static(resolve(__dirname, '../public')));

app.get('/health', async (_req, res) => {
  try {
    await prisma.user.count({ where: { id: '__health_check__' } });
    res.json({ status: 'online', service: appName, database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ status: 'offline', service: appName, database: 'disconnected' });
  }
});

app.get('/health/integrations', async (_req, res) => {
  const check = async (name: string, probe: () => Promise<unknown>): Promise<'connected' | 'disconnected'> => {
    try {
      await probe();
      return 'connected';
    } catch (error) {
      console.error(`${name} health check failed:`, error);
      return 'disconnected';
    }
  };
  const mobileApiProbe = process.env.MOBILE_APP_API_URL?.trim()
    ? check('Mobile app API', checkMobileAppApi)
    : Promise.resolve('not_configured' as const);
  const [database, firebase, cloudflareR2, mobileApi] = await Promise.all([
    check('PostgreSQL', () => prisma.user.count({ where: { id: '__health_check__' } })),
    check('Firebase Admin', checkFirebaseConnection),
    check('Cloudflare R2', checkR2Connection),
    mobileApiProbe,
  ]);
  const status = database === 'connected' ? 'online' : 'offline';
  res.status(database === 'connected' ? 200 : 503).json({
    status,
    service: appName,
    database,
    integrations: { firebase, cloudflareR2, mobileApi },
    timestamp: new Date().toISOString(),
  });
});

const defaultAdminUrl = publicUrl(
  'ADMIN_URL',
  process.env.ADMIN_URL || process.env.ADMIN_WEB_URL,
  allowedOrigins[0] || 'http://localhost:3000',
);

app.get(['/'], (req, res) => {
  const acceptsJson = req.headers.accept?.includes('application/json') && !req.headers.accept?.includes('text/html');
  if (acceptsJson) {
    return res.json({
      name: appName,
      version: appVersion,
      status: 'online',
      environment: process.env.NODE_ENV,
      adminPortal: defaultAdminUrl,
      health: '/health',
      endpoints: {
        auth: '/api/auth',
        issues: '/api/issues',
        workers: '/api/workers',
        notifications: '/api/notifications',
        departments: '/api/departments'
      }
    });
  }

  const html = renderPreviewPage({
    appName,
    adminUrl: defaultAdminUrl,
    environment: (process.env.NODE_ENV || 'development').toUpperCase(),
    version: appVersion,
  });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

app.use('/api', apiRouter);
app.use((_req, res) => res.status(404).json({ error: 'Endpoint not found' }));

async function startServer(): Promise<void> {
  await prisma.$connect();
  await db.bootstrapAdmin(
    bootstrapAdminName,
    bootstrapAdminEmail,
    bootstrapAdminPassword,
  );
  app.listen(PORT, () => {
    console.log(`Fixly Campus API listening on port ${PORT}`);
  });
}

void startServer().catch(async (error: unknown) => {
  console.error('Backend startup failed:', error);
  await prisma.$disconnect();
  process.exitCode = 1;
});

export default app;
