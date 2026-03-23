import { command } from '$app/server';
import { db } from '@lerno/db';
import { userCourses, users, courseSchedule, xpEvents } from '@lerno/db/schema';
import { eq } from 'drizzle-orm';
import PgBoss from 'pg-boss';

// Initialize boss instance strictly to trigger jobs 
// Note: In production you'd use a singleton from @lerno/jobs, but we export the boss class
const boss = new PgBoss(process.env.DATABASE_URL!);
// ensure started
boss.start().catch(console.error);

export const completeOnboarding = command(async ({
  userId, username, courses, events, preferences
}: {
  userId: string;
  username: string;
  courses: Array<{code: string; title: string; semester: string}>;
  events: Array<any>;
  preferences: { theme: string; aiEnabled: boolean; };
}) => {
  // 1. Update Username & Preferences
  await db.update(users).set({
    username,
    theme: preferences.theme,
    aiEnabled: preferences.aiEnabled,
  }).where(eq(users.id, userId));

  // 2. Insert courses
  if (courses.length > 0) {
    await db.insert(userCourses).values(
      courses.map(c => ({ ...c, userId, active: true }))
    );
  }

  // 3. Insert schedule events
  if (events && events.length > 0) {
    await db.insert(courseSchedule).values(
      events.map(e => ({ ...e, userId }))
    );
  }

  // 4. Queue initial content generation
  if (preferences.aiEnabled && courses.length > 0) {
    // delay by 5 seconds to ensure everything flushed
    await boss.send('generate-content', { userId }, { startAfter: 5 });
  }

  // 5. Award first-login XP
  await db.insert(xpEvents).values({
    userId, eventType: 'daily_login', xpAwarded: 5,
  }).onConflictDoNothing(); // Prevent multiple awards if re-run

  return { success: true };
});
