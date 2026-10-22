import { getFirebaseMessaging } from './firebaseAdmin';
import { db } from '../db/store';

export interface PushNotificationPayload {
  title: string;
  body: string;
  type: string;
  data?: Record<string, string | undefined>;
}

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

  for (let offset = 0; offset < tokens.length; offset += 500) {
    const batch = tokens.slice(offset, offset + 500);
    const response = await messaging.sendEachForMulticast({
      tokens: batch,
      notification: { title: notification.title, body: notification.body },
      data: dataPayload,
      android: {
        priority: 'high',
        notification: { channelId: 'default', sound: 'default' },
      },
      apns: { payload: { aps: { sound: 'default' } } },
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
