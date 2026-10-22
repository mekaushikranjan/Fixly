import dotenv from 'dotenv';
import { resolve } from 'node:path';
import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api';
import { prisma } from './db/prisma';
import { db } from './db/store';

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

app.get('/health', async (_req, res) => {
  try {
    await prisma.user.count({ where: { id: '__health_check__' } });
    res.json({ status: 'online', service: 'Fixly Campus API', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ status: 'offline', service: 'Fixly Campus API', database: 'disconnected' });
  }
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
