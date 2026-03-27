import webpush from 'web-push';
import { db } from '@lerno/db';
import { pushSubscriptions } from '@lerno/db/schema';
import { eq } from 'drizzle-orm';

if (process.env.VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@lerno.dev',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY!
  );
}

export async function sendPushJob(job: { data: { userId: string; payload: object } }) {
  await sendPushToUser(job.data.userId, job.data.payload);
}

async function sendPushToUser(userId: string, payload: object) {
  const subs = await db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      ).catch(async (err) => {
        // Remove expired subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        }
      })
    )
  );
}
