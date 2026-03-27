import { db } from '@lerno/db';
import { users, subscriptions } from '@lerno/db/schema';
import { eq, and } from 'drizzle-orm';

export async function downgradeUserJob(job: { data: { userId: string } }) {
  const { userId } = job.data;
  
  // Verify subscription is actually cancelled/expired
  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, 'cancelled')
    ),
  });

  if (sub && sub.cancelAtEnd && new Date() >= sub.currentPeriodEnd) {
    await db.update(users)
      .set({ plan: 'free' })
      .where(eq(users.id, userId));
  }
}
