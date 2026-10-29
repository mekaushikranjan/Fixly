import { getFirebaseMessaging } from './firebaseAdmin';
import { db } from '../db/store';

export interface PushNotificationPayload {
  title: string;
  body: string;
  type: string;
  data?: Record<string, string | undefined>;
}

/** FCM Android action button for accepting a new job directly from the notification. */
const ANDROID_ACCEPT_ACTION = {
  title: '✅ Accept',
  action: 'JOB_ACTION_ACCEPT',
  icon: 'ic_notification',
};

/** FCM Android action button for ignoring a new job notification. */
const ANDROID_IGNORE_ACTION = {
  title: '❌ Ignore',
  action: 'JOB_ACTION_IGNORE',
  icon: 'ic_notification',
};

export async function sendFirebasePushNotifications(
  tokens: string[],
  notification: PushNotificationPayload,
): Promise<{ sent: number; failed: number }> {
  if (tokens.length === 0) return { sent: 0, failed: 0 };

  const invalidTokens: string[] = [];
  let sent = 0;
  let failed = 0;
  const messaging = getFirebaseMessaging();

  const dataPayload: Record<string, string> = {
    notificationType: notification.type,
  };
  if (notification.data) {
    for (const [key, value] of Object.entries(notification.data)) {
      if (value !== undefined && value !== null) {
        dataPayload[key] = String(value);
      }
    }
  }

  // Determine if this is a "new job available" notification dispatched to workers
  const isNewJob =
    notification.type === 'assignment' &&
    notification.data?.status === 'queued';

  for (let offset = 0; offset < tokens.length; offset += 500) {
    const batch = tokens.slice(offset, offset + 500);
    const response = await messaging.sendEachForMulticast({
      tokens: batch,
      notification: { title: notification.title, body: notification.body },
      data: dataPayload,
      android: {
        priority: 'high',
        notification: {
          channelId: isNewJob ? 'new_job' : 'default',
          sound: 'default',
          // Inline action buttons shown in the notification tray (Android 7+)
          ...(isNewJob
            ? { actions: [ANDROID_ACCEPT_ACTION, ANDROID_IGNORE_ACTION] as any }
            : {}),
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            // iOS notification category triggers the registered Accept / Ignore buttons
            ...(isNewJob ? { category: 'NEW_JOB' } : {}),
          },
        },
      },
    });

    sent += response.successCount;
    failed += response.failureCount;
    response.responses.forEach((result, index) => {
      const code = result.error?.code;
      if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
        invalidTokens.push(batch[index]);
      }
    });
  }

  await db.deactivatePushDevices(invalidTokens);
  return { sent, failed };
}
