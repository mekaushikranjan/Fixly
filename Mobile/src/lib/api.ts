import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MobileRole = 'user' | 'worker' | 'department_supervisor' | 'super_admin';
export type MobileResidenceType = 'hostel' | 'day_scholar';

export interface MobileAccount {
  id: string;
  name: string;
  email: string;
  role: MobileRole;
  department?: string;
  avatar?: string;
  phone?: string;
  residenceType?: MobileResidenceType;
  address?: string;
  city?: string;
  building?: string;
  room?: string;
  isActive: boolean;
}

export interface MobileSession {
  token: string;
  user: MobileAccount;
}

export interface ApiNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export type IssueStatus = 'queued' | 'assigned' | 'in_progress' | 'resolved' | 'escalated';
export type IssuePriority = 'Critical' | 'High' | 'Normal' | 'Low';

export interface MobileIssue {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  category: string;
  department: string;
  building: string;
  floor: string;
  room: string;
  status: IssueStatus;
  priority: IssuePriority;
  reportedBy: string;
  reportedByUserId: string;
  reportedAt: string;
  resolvedAt?: string;
  slaMinutes: number;
  slaDeadline: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  photoUrl?: string;
  resolutionPhoto?: string;
  feedback?: { rating: number; comment: string; submittedAt: string };
}

export interface MobileWorker {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  status: 'available' | 'busy' | 'off_duty';
  rating: number;
  jobsCompleted: number;
  reworkRate: number;
  shift: string;
  currentBuilding: string;
}

export interface MobileWorkerPerformance {
  rating: number;
  ratingsCount: number;
  jobsCompleted: number;
  resolvedIssues: number;
  activeIssues: number;
  reworkRate: number;
  averageResolutionMinutes: number | null;
}

interface ErrorPayload {
  error?: string;
  message?: string;
}

function getApiBase(): string {
  let base = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  if (!base) throw new Error('Set EXPO_PUBLIC_API_URL to the reachable Fixly API URL.');
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  return base;
}

const API_CACHE_PREFIX = '@fixly_api_cache:';
const API_SYNC_INTERVAL_MS = 60_000;
const requestMemoryCache = new Map<string, unknown>();
const lastApiSync = new Map<string, number>();
const activeGetRequests = new Map<string, Promise<unknown>>();
const cachedGetRequests = new Map<string, { path: string; token?: string }>();
const cacheListeners = new Map<string, Set<() => void>>();
const cacheGenerations = new Map<string, number>();

function tokenCacheId(token?: string): string {
  if (!token) return 'public';
  let firstHash = 2166136261;
  let secondHash = 0x27d4eb2d;
  for (let index = 0; index < token.length; index += 1) {
    const character = token.charCodeAt(index);
    firstHash = Math.imul(firstHash ^ character, 16777619);
    secondHash = Math.imul(secondHash ^ character, 0x5bd1e995);
  }
  return `${(firstHash >>> 0).toString(36)}${(secondHash >>> 0).toString(36)}`;
}

function cacheKey(path: string, token?: string): string {
  let base: string;
  try {
    base = getApiBase();
  } catch {
    base = 'unconfigured';
  }
  return `${API_CACHE_PREFIX}${tokenCacheId(token)}:${encodeURIComponent(base + path)}`;
}

async function readCachedResponse<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;
    const payload = JSON.parse(cached) as T;
    requestMemoryCache.set(key, payload);
    return payload;
  } catch (error) {
    console.warn('Unable to read cached Fixly data:', error);
    return null;
  }
}

async function invalidateCachedPaths(token: string | undefined, paths: string[]): Promise<void> {
  const keys = paths.map((path) => cacheKey(path, token));
  keys.forEach((key) => {
    lastApiSync.delete(key);
    notifyCacheChanged(key);
  });
}

function notifyCacheChanged(key: string): void {
  cacheListeners.get(key)?.forEach((listener) => listener());
}

export function subscribeToApiCache(path: string, token: string | undefined, listener: () => void): () => void {
  const key = cacheKey(path, token);
  const listeners = cacheListeners.get(key) || new Set<() => void>();
  listeners.add(listener);
  cacheListeners.set(key, listeners);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) cacheListeners.delete(key);
  };
}

function pathsToInvalidate(path: string, method: string): string[] {
  if (method === 'GET') return [];
  if (path === '/auth/me') return ['/auth/me'];
  if (path.startsWith('/notifications')) return ['/notifications', '/notifications/unread-count'];
  if (path === '/issues' || path.startsWith('/issues/')) {
    return ['/issues', '/worker/jobs', '/worker/performance', '/notifications', '/notifications/unread-count'];
  }
  if (path.startsWith('/worker/')) {
    return ['/worker/me', '/worker/jobs', '/worker/performance', '/issues'];
  }
  return [];
}

async function fetchAndCache<T>(
  path: string,
  options: RequestInit,
  token: string | undefined,
  key: string | null,
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const cacheScope = tokenCacheId(token);
  const cacheGeneration = cacheGenerations.get(cacheScope) || 0;
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}${path}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (error) {
    if (key && (cacheGenerations.get(cacheScope) || 0) === cacheGeneration) {
      const cached = await readCachedResponse<T>(key);
      if (cached !== null) {
        requestMemoryCache.set(key, cached);
        return cached;
      }
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  const responseText = await response.text();
  let payload: unknown = {};
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      throw new Error(`The Fixly API returned an invalid response (${response.status}).`);
    }
  }
  if (!response.ok) {
    const error = payload as ErrorPayload;
    throw new Error(error.message || error.error || `Request failed (${response.status})`);
  }
  if (key) {
    requestMemoryCache.set(key, payload);
    lastApiSync.set(key, Date.now());
    try {
      await AsyncStorage.setItem(key, JSON.stringify(payload));
    } catch (error) {
      console.warn('Unable to save Fixly data for offline use:', error);
    }
    notifyCacheChanged(key);
  }
  const invalidatedPaths = pathsToInvalidate(path, method);
  if (invalidatedPaths.length && (cacheGenerations.get(cacheScope) || 0) === cacheGeneration) {
    await invalidateCachedPaths(token, invalidatedPaths);
  }
  return payload as T;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
  forceRefresh = false,
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const key = method === 'GET' ? cacheKey(path, token) : null;
  if (key) {
    cachedGetRequests.set(key, { path, token });
    const cached = requestMemoryCache.has(key)
      ? requestMemoryCache.get(key) as T
      : await readCachedResponse<T>(key);
    const lastSync = lastApiSync.get(key) || 0;
    if (!forceRefresh && cached !== null && cached !== undefined) {
      if (Date.now() - lastSync >= API_SYNC_INTERVAL_MS) {
        void request(path, options, token, true).catch((error: unknown) => {
          console.warn(`Unable to sync cached Fixly data for ${path}:`, error);
        });
      }
      return cached;
    }

    const activeRequest = activeGetRequests.get(key);
    if (activeRequest) return activeRequest as Promise<T>;

    const networkRequest = fetchAndCache<T>(path, options, token, key);
    activeGetRequests.set(key, networkRequest);
    try {
      return await networkRequest;
    } finally {
      if (activeGetRequests.get(key) === networkRequest) activeGetRequests.delete(key);
    }
  }

  return fetchAndCache<T>(path, options, token, null);
}

export async function syncCachedApiData(token: string): Promise<void> {
  const requests = Array.from(cachedGetRequests.values())
    .filter((cachedRequest) => cachedRequest.token === token || cachedRequest.token === undefined);
  await Promise.all(requests.map(({ path, token: requestToken }) =>
    request(path, {}, requestToken, true).catch((error: unknown) => {
      console.warn(`Unable to sync cached Fixly data for ${path}:`, error);
    }),
  ));
}

export async function clearApiCache(token?: string): Promise<void> {
  const accountPrefix = `${API_CACHE_PREFIX}${tokenCacheId(token)}:`;
  const cacheScope = tokenCacheId(token);
  cacheGenerations.set(cacheScope, (cacheGenerations.get(cacheScope) || 0) + 1);
  const trackedKeys = new Set([
    ...requestMemoryCache.keys(),
    ...lastApiSync.keys(),
    ...activeGetRequests.keys(),
    ...cachedGetRequests.keys(),
    ...cacheListeners.keys(),
  ]);
  for (const key of trackedKeys) {
    if (key.startsWith(accountPrefix)) {
      requestMemoryCache.delete(key);
      lastApiSync.delete(key);
      activeGetRequests.delete(key);
      cachedGetRequests.delete(key);
      cacheListeners.delete(key);
    }
  }
  try {
    const keys = await AsyncStorage.getAllKeys();
    const accountKeys = keys.filter((key) => key.startsWith(accountPrefix));
    if (accountKeys.length) await AsyncStorage.multiRemove(accountKeys);
  } catch (error) {
    console.warn('Unable to clear the local Fixly data cache:', error);
  }
}

export const mobileApi = {
  login(email: string, password: string): Promise<MobileSession> {
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },

  register(name: string, email: string, password: string): Promise<MobileSession> {
    return request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
  },

  loginWithGoogle(firebaseIdToken: string): Promise<MobileSession> {
    return request('/auth/google', { method: 'POST', body: JSON.stringify({ firebaseIdToken }) });
  },

  getMe(token: string): Promise<{ user: MobileAccount }> {
    return request('/auth/me', {}, token);
  },

  getFirebaseCustomToken(token: string): Promise<{ customToken: string }> {
    return request('/auth/firebase-custom-token', { method: 'POST' }, token);
  },

  updateMe(
    token: string,
    fields: Partial<Pick<MobileAccount, 'name' | 'phone' | 'residenceType' | 'address' | 'city' | 'building' | 'room'>>
      & { photoBase64?: string; photoMimeType?: string },
  ): Promise<{ user: MobileAccount }> {
    return request('/auth/me', { method: 'PATCH', body: JSON.stringify(fields) }, token);
  },

  getNotifications(token: string): Promise<{ notifications: ApiNotification[]; unreadCount: number }> {
    return request('/notifications', {}, token);
  },

  getUnreadNotificationCount(token: string): Promise<{ unreadCount: number }> {
    return request('/notifications/unread-count', {}, token);
  },

  markNotificationRead(token: string, id: string): Promise<{ success: boolean }> {
    return request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }, token);
  },

  markAllNotificationsRead(token: string): Promise<{ success: boolean; updated: number }> {
    return request('/notifications/read-all', { method: 'PATCH' }, token);
  },

  getIssues(token: string): Promise<{ issues: MobileIssue[] }> {
    return request('/issues', {}, token);
  },

  getAvailableJobs(token: string, forceRefresh = false): Promise<{ issues: MobileIssue[] }> {
    return request('/worker/jobs', {}, token, forceRefresh);
  },

  getCurrentWorker(token: string): Promise<{ worker: MobileWorker }> {
    return request('/worker/me', {}, token);
  },

  getWorkerPerformance(token: string): Promise<{ performance: MobileWorkerPerformance }> {
    return request('/worker/performance', {}, token);
  },

  updateWorkerStatus(token: string, status: 'available' | 'off_duty'): Promise<{ worker: MobileWorker }> {
    return request('/worker/me/status', { method: 'PATCH', body: JSON.stringify({ status }) }, token);
  },

  acceptIssue(token: string, issueId: string): Promise<{ success: boolean; issue: MobileIssue }> {
    return request(`/issues/${encodeURIComponent(issueId)}/accept`, { method: 'POST' }, token);
  },

  createIssue(token: string, issue: Pick<MobileIssue, 'title' | 'description' | 'category' | 'department' | 'building' | 'floor' | 'room'> & {
    photoUrl?: string;
    photoBase64?: string;
    photoMimeType?: string;
  }): Promise<{ issue: MobileIssue }> {
    return request('/issues', { method: 'POST', body: JSON.stringify(issue) }, token);
  },

  updateIssueStatus(token: string, id: string, status: IssueStatus, resolutionPhoto?: string): Promise<{ issue: MobileIssue }> {
    return request(`/issues/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(resolutionPhoto ? { resolutionPhoto } : {}) }),
    }, token);
  },

  submitIssueFeedback(token: string, id: string, rating: number, comment: string): Promise<{ issue: MobileIssue }> {
    return request(`/issues/${encodeURIComponent(id)}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }, token);
  },

  registerPushToken(token: string, pushToken: string, platform: 'ios' | 'android' | 'web'): Promise<{ success: boolean }> {
    return request('/devices/push-token', {
      method: 'POST',
      body: JSON.stringify({ token: pushToken, platform }),
    }, token);
  },

  unregisterPushToken(token: string, pushToken: string): Promise<{ success: boolean }> {
    return request('/devices/push-token', {
      method: 'DELETE',
      body: JSON.stringify({ token: pushToken }),
    }, token);
  },

  getAppConfig(): Promise<{ appName: string; version: string; university: string; updatedAt?: string }> {
    return request('/app/config');
  },

  ping(): Promise<{ status: string; connected: boolean }> {
    return pingBackend();
  },
};

export async function pingBackend(): Promise<{ status: string; connected: boolean }> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/mobile/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: Platform.OS,
        timestamp: Date.now(),
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      return { status: 'connected', connected: true };
    }
    return { status: 'offline', connected: false };
  } catch {
    try {
      const healthUrl = `${getApiBase().replace(/\/api\/?$/, '')}/health`;
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(6000) });
      return { status: res.ok ? 'connected' : 'offline', connected: res.ok };
    } catch {
      return { status: 'disconnected', connected: false };
    }
  }
}
