import dotenv from 'dotenv';
import { resolve } from 'node:path';
import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api';
import { prisma } from './db/prisma';
import { db } from './db/store';
import { checkFirebaseConnection } from './services/firebaseAdmin';
import { checkR2Connection } from './services/r2Storage';
import { isMobileActive, getLastMobilePing } from './services/mobilePingService';
import { getAppConfig } from './services/appSettings';
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
const nodeEnvironment = requiredEnvironmentValue('NODE_ENV');

function publicUrl(name: string, value: string): string {
  const configured = value.trim();
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
  if (configuredUrl) {
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
    return;
  }

  // If a mobile client has pinged recently (within last 15 minutes), mark as connected
  if (isMobileActive()) {
    return;
  }

  // Since the Fixly backend itself hosts the Mobile API endpoints at /api,
  // verify self-health to confirm mobile clients have an operational API
  const selfHealthUrl = `http://127.0.0.1:${PORT}/health`;
  const response = await fetch(selfHealthUrl, { signal: AbortSignal.timeout(2000) }).catch(() => null);
  if (response && response.ok) {
    return;
  }

  throw new Error('Mobile API is operational once mobile app connects or backend is healthy.');
}

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use('/api/issues', (req, res, next) => {
  if (req.method === 'POST' && req.originalUrl.split('?')[0] === '/api/issues') {
    express.json({ limit: '8mb' })(req, res, next);
    return;
  }
  next();
});
app.use('/api/auth/me', (req, res, next) => {
  if (req.method === 'PATCH') {
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
    const { appName } = await getAppConfig();
    res.json({ status: 'online', service: appName, database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ status: 'offline', database: 'disconnected' });
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
  const mobileApiProbe = check('Mobile app API', checkMobileAppApi);
  const [database, firebase, cloudflareR2, mobileApi, config] = await Promise.all([
    check('PostgreSQL', () => prisma.user.count({ where: { id: '__health_check__' } })),
    check('Firebase Admin', checkFirebaseConnection),
    check('Cloudflare R2', checkR2Connection),
    mobileApiProbe,
    getAppConfig().catch((error: unknown) => {
      console.error('App settings health check failed:', error);
      return undefined;
    }),
  ]);
  const status = database === 'connected' && config ? 'online' : 'offline';
  res.status(status === 'online' ? 200 : 503).json({
    status,
    ...(config && { service: config.appName }),
    database,
    integrations: { firebase, cloudflareR2, mobileApi },
    timestamp: new Date().toISOString(),
  });
});

const adminUrl = publicUrl('ADMIN_URL', requiredEnvironmentValue('ADMIN_URL'));

app.get(['/'], (req, res) => {
  const acceptsJson = req.headers.accept?.includes('application/json') && !req.headers.accept?.includes('text/html');
  void getAppConfig().then((config) => {
    if (acceptsJson) {
      res.json({
        name: config.appName,
        version: config.version,
        status: 'online',
        environment: nodeEnvironment,
        adminPortal: adminUrl,
        health: '/health',
        endpoints: {
          auth: '/api/auth',
          issues: '/api/issues',
          workers: '/api/workers',
          notifications: '/api/notifications',
          departments: '/api/departments'
        }
      });
      return;
    }

    const html = renderPreviewPage({
      adminUrl,
      appName: config.appName,
      appVersion: config.version,
      environment: nodeEnvironment.toUpperCase(),
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }).catch((error: unknown) => {
    console.error('Failed to load app settings:', error);
    res.status(503).json({ error: 'App settings are unavailable' });
  });
});

app.use('/api', apiRouter);
app.use((_req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// Auto keep-alive: pings the public backend URL every 5 minutes (300,000 ms) to keep Render awake
function startRenderKeepAlive(): void {
  const RENDER_PING_INTERVAL_MS = 5 * 60 * 1000;
  const renderPublicUrl =
    process.env.RENDER_EXTERNAL_URL?.trim() ||
    process.env.PUBLIC_API_URL?.trim() ||
    'https://fixly-2pk1.onrender.com';

  console.log(`[Keep-Alive] Started auto-ping service every 5 minutes to ${renderPublicUrl}/health`);

  setInterval(async () => {
    try {
      const targetUrl = `${renderPublicUrl.replace(/\/+$/, '')}/health`;
      const res = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });
      console.log(`[Keep-Alive] Auto-pinged ${targetUrl} — status ${res.status} at ${new Date().toISOString()}`);
    } catch (error) {
      console.warn(`[Keep-Alive] Auto-ping to ${renderPublicUrl} failed:`, error instanceof Error ? error.message : error);
    }
  }, RENDER_PING_INTERVAL_MS);
}

async function startServer(): Promise<void> {
  await prisma.$connect();
  const { appName } = await getAppConfig();
  await db.ensureActiveSuperAdmin();
  app.listen(PORT, () => {
    console.log(`${appName} API listening on port ${PORT}`);
    startRenderKeepAlive();
  });
}

void startServer().catch(async (error: unknown) => {
  console.error('Backend startup failed:', error);
  await prisma.$disconnect();
  process.exitCode = 1;
});

export default app;
