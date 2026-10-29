import { Platform } from 'react-native';
import { getFirebaseApp } from './firebase';
import { isExpoGo } from './runtime';

// ─── Notification action identifiers ────────────────────────────────────────
/** iOS / Android action id for accepting a new job from the notification. */
export const JOB_ACTION_ACCEPT = 'JOB_ACTION_ACCEPT';
/** iOS / Android action id for ignoring / dismissing a new job notification. */
export const JOB_ACTION_IGNORE = 'JOB_ACTION_IGNORE';
/** iOS notification category for "new job available" push notifications. */
export const JOB_CATEGORY_ID = 'NEW_JOB';
// ────────────────────────────────────────────────────────────────────────────

async function getNotifications() {
  const Notifications = await import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  return Notifications;
}

/**
 * Registers the "new_job" notification category on iOS and the
 * "new_job" notification channel (with inline actions) on Android.
 * Call this once at app start (before registering for push tokens).
 */
export async function registerJobNotificationCategory(): Promise<void> {
  if (isExpoGo || Platform.OS === 'web') return;
  const Notifications = await getNotifications();

  if (Platform.OS === 'ios') {
    await Notifications.setNotificationCategoryAsync(JOB_CATEGORY_ID, [
      {
        identifier: JOB_ACTION_ACCEPT,
        buttonTitle: '✅ Accept',
        options: { opensAppToForeground: false },
      },
      {
        identifier: JOB_ACTION_IGNORE,
        buttonTitle: '❌ Ignore',
        options: { opensAppToForeground: false, isDestructive: true },
      },
    ]);
  }

  if (Platform.OS === 'android') {
    // Primary "new_job" channel with high importance
    await Notifications.setNotificationChannelAsync('new_job', {
      name: 'New Job Alerts',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (isExpoGo) return null;

  if (Platform.OS === 'web') {
    const vapidKey = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY?.trim();
    if (!vapidKey) throw new Error('Set EXPO_PUBLIC_FIREBASE_VAPID_KEY to enable web push notifications.');
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
      throw new Error('Web push notifications are not supported in this browser.');
    }
    const { getMessaging: getWebMessaging, getToken: getWebToken, isSupported } = await import('firebase/messaging');
    if (!(await isSupported())) throw new Error('Firebase web messaging is not supported in this browser.');

    const app = getFirebaseApp();
    const firebaseConfig = app.options;
    const serviceWorkerUrl = new URL('/firebase-messaging-sw.js', window.location.origin);
    serviceWorkerUrl.search = new URLSearchParams({
      apiKey: String(firebaseConfig.apiKey),
      authDomain: String(firebaseConfig.authDomain),
      projectId: String(firebaseConfig.projectId),
      storageBucket: String(firebaseConfig.storageBucket),
      messagingSenderId: String(firebaseConfig.messagingSenderId),
      appId: String(firebaseConfig.appId),
    }).toString();
    const registration = await navigator.serviceWorker.register(serviceWorkerUrl);
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Push notifications are disabled for Fixly in browser settings.');
    }
    return getWebToken(getWebMessaging(app), { vapidKey, serviceWorkerRegistration: registration });
  }
  const Notifications = await getNotifications();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Fixly notifications',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    // Also ensure the new_job channel is created during push registration
    await Notifications.setNotificationChannelAsync('new_job', {
      name: 'New Job Alerts',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const {
    AuthorizationStatus,
    getMessaging,
    getToken,
    isDeviceRegisteredForRemoteMessages,
    registerDeviceForRemoteMessages,
    requestPermission,
  } = await import('@react-native-firebase/messaging');
  const client = getMessaging();
  if (Platform.OS === 'ios' && !isDeviceRegisteredForRemoteMessages(client)) {
    await registerDeviceForRemoteMessages(client);
  }

  if (Platform.OS === 'android') {
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) {
      permission = await Notifications.requestPermissionsAsync();
    }
    if (!permission.granted) {
      throw new Error('Push notifications are disabled for Fixly in device settings.');
    }
  } else {
    const permission = await requestPermission(client);
    if (permission < AuthorizationStatus.AUTHORIZED) {
      throw new Error('Push notifications are disabled for Fixly in device settings.');
    }
  }

  return getToken(client);
}

export function subscribeToPushTokenRefresh(listener: (token: string) => void): () => void {
  if (Platform.OS === 'web' || isExpoGo) return () => undefined;

  let active = true;
  let stopListening = () => {};
  void import('@react-native-firebase/messaging')
    .then(({ getMessaging, onTokenRefresh }) => {
      if (active) stopListening = onTokenRefresh(getMessaging(), listener);
    })
    .catch((error: unknown) => {
      console.warn('Firebase push token refresh listener could not start:', error);
    });

  return () => {
    active = false;
    stopListening();
  };
}

export function subscribeToForegroundMessages(
  onMessageReceived?: (data: Record<string, unknown>) => void,
): () => void {
  if (isExpoGo) return () => undefined;

  if (Platform.OS === 'web') {
    let unsubscribe: () => void = () => {};
    void import('firebase/messaging').then(({ getMessaging: getWebMessaging, onMessage }) => {
      const app = getFirebaseApp();
      unsubscribe = onMessage(getWebMessaging(app), (message) => {
        onMessageReceived?.(message.data || {});
        if (Notification.permission !== 'granted') return;
        const title = message.notification?.title || 'Fixly';
        const body = message.notification?.body || '';
        if (document.visibilityState === 'visible' && !body) return;
        void navigator.serviceWorker.ready.then((registration) =>
          registration.showNotification(title, { body, data: message.data }),
        );
      });
    }).catch((error: unknown) => {
      console.warn('Firebase web push foreground listener could not start:', error);
    });
    return () => unsubscribe();
  }
  let active = true;
  let stopListening = () => {};
  void Promise.all([
    import('@react-native-firebase/messaging'),
    getNotifications(),
  ])
    .then(([{ getMessaging, onMessage }, Notifications]) => {
      if (!active) return;
      stopListening = onMessage(getMessaging(), async (message) => {
        onMessageReceived?.(message.data || {});
        const title = message.notification?.title;
        const body = message.notification?.body;
        if (!title && !body) return;
        const isNewJob = message.data?.notificationType === 'assignment' && message.data?.status === 'queued';
        await Notifications.scheduleNotificationAsync({
          content: {
            title: title || 'Fixly',
            body: body || '',
            data: message.data,
            sound: 'default',
            ...(isNewJob && Platform.OS === 'ios'
              ? { categoryIdentifier: JOB_CATEGORY_ID }
              : {}),
          },
          trigger: null,
          ...(isNewJob && Platform.OS === 'android'
            ? { identifier: `new_job_${String(message.data?.issueId ?? Date.now())}` }
            : {}),
        } as Parameters<typeof Notifications.scheduleNotificationAsync>[0]);
      });
    })
    .catch((error: unknown) => {
      console.warn('Firebase foreground message listener could not start:', error);
    });

  return () => {
    active = false;
    stopListening();
  };
}
