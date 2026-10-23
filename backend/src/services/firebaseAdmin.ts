import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

import fs from 'fs';
import path from 'path';

const TOKEN_VERIFIER_APP_NAME = 'fixly-token-verifier';
const ADMIN_APP_NAME = 'fixly-admin';

export class FirebaseAdminConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseAdminConfigurationError';
  }
}

interface ServiceAccountFileCredentials {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

let cachedFileCredentials: ServiceAccountFileCredentials | null | undefined = undefined;

function loadServiceAccountFromFile(): ServiceAccountFileCredentials | null {
  if (cachedFileCredentials !== undefined) {
    return cachedFileCredentials;
  }

  const candidatePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.resolve(process.cwd(), 'service-account.json'),
    path.resolve(process.cwd(), 'data/service-account.json'),
    path.resolve(__dirname, '../../service-account.json'),
  ].filter((p): p is string => Boolean(p && p.trim()));

  for (const candidate of candidatePaths) {
    try {
      const resolvedPath = path.isAbsolute(candidate) ? candidate : path.resolve(process.cwd(), candidate);
      if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        const parsed = JSON.parse(fileContent);
        if (parsed && typeof parsed === 'object') {
          cachedFileCredentials = parsed as ServiceAccountFileCredentials;
          return cachedFileCredentials;
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  cachedFileCredentials = null;
  return null;
}

function getProjectId(): string {
  let projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId || /your|placeholder|replace-with/i.test(projectId)) {
    const fileCreds = loadServiceAccountFromFile();
    if (fileCreds?.project_id) {
      projectId = fileCreds.project_id.trim();
    }
  }
  if (!projectId || /your|placeholder|replace-with/i.test(projectId)) {
    throw new FirebaseAdminConfigurationError(
      'FIREBASE_PROJECT_ID is missing or invalid. Set it to the Firebase project ID used by the mobile app.',
    );
  }
  return projectId;
}

function getTokenVerifierApp() {
  const projectId = getProjectId();
  const existingApp = getApps().find((app) => app.name === TOKEN_VERIFIER_APP_NAME);
  if (existingApp) {
    if (existingApp.options.projectId !== projectId) {
      throw new Error('The initialized Firebase verifier project does not match FIREBASE_PROJECT_ID.');
    }
    return existingApp;
  }
  return initializeApp({ projectId }, TOKEN_VERIFIER_APP_NAME);
}

function getAdminApp() {
  const fileCreds = loadServiceAccountFromFile();
  const projectId = getProjectId();

  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  if (!clientEmail || /your|placeholder|replace-with/i.test(clientEmail)) {
    if (fileCreds?.client_email) {
      clientEmail = fileCreds.client_email.trim();
    }
  }

  let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY?.trim() ?? '';
  if (!rawPrivateKey || /your|placeholder|replace-with/i.test(rawPrivateKey)) {
    if (fileCreds?.private_key) {
      rawPrivateKey = fileCreds.private_key.trim();
    }
  }

  let privateKey = rawPrivateKey
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n');

  const missingCredentials = [
    !clientEmail || /your|placeholder|replace-with/i.test(clientEmail)
      ? 'FIREBASE_CLIENT_EMAIL'
      : null,
    !privateKey || /your|placeholder|replace-with/i.test(privateKey)
      ? 'FIREBASE_PRIVATE_KEY'
      : null,
  ].filter((name): name is string => name !== null);

  if (missingCredentials.length) {
    throw new FirebaseAdminConfigurationError(
      `${missingCredentials.join(' and ')} ${missingCredentials.length === 1 ? 'is' : 'are'} missing or invalid. Set the Firebase Admin service-account values in the backend environment, then restart the backend.`,
    );
  }
  if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    throw new FirebaseAdminConfigurationError(
      'FIREBASE_PRIVATE_KEY is not a valid PEM private key. Store the full key in backend/.env with escaped \\n line breaks.',
    );
  }

  const existingApp = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existingApp) {
    const app = getApp(ADMIN_APP_NAME);
    if (app.options.projectId !== projectId) {
      throw new Error('The initialized Firebase Admin project does not match FIREBASE_PROJECT_ID.');
    }
    return app;
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  }, ADMIN_APP_NAME);
}

export function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  return getAuth(getTokenVerifierApp()).verifyIdToken(idToken);
}

export async function checkFirebaseConnection(): Promise<void> {
  await getAuth(getAdminApp()).listUsers(1);
}

export function createFirebaseCustomToken(uid: string, role: string): Promise<string> {
  return getAuth(getAdminApp()).createCustomToken(uid, { fixlyUserId: uid, fixlyRole: role });
}

export function getFirebaseMessaging() {
  return getMessaging(getAdminApp());
}
