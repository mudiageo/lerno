import { command, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import { userCourses, users, courseSchedule, xpEvents } from '@lerno/db/schema';
import { eq } from '@lerno/db/drizzle';
import PgBoss from 'pg-boss';
import * as v from 'valibot';

// Initialize boss instance strictly to trigger jobs 
// Note: In production you'd use a singleton from @lerno/jobs, but we export the boss class
const boss = new PgBoss(process.env.DATABASE_URL!);
boss.start().catch(console.error);

const OnboardingSchema = v.object({
  username: v.pipe(v.string(), v.minLength(3), v.maxLength(30)),
  courses: v.array(v.object({
    code: v.string(),
    title: v.string(),
    semester: v.string(),
  })),
  preferences: v.object({
    theme: v.picklist(['light', 'dark', 'oled', 'system']),
    aiEnabled: v.boolean(),
  }),
});

export const completeOnboarding = command(OnboardingSchema, async (data) => {
  const event = getRequestEvent();
  const userId = event?.locals.user?.id;

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const { username, courses, preferences } = data;

  await db.transaction(async (tx) => {
    // 1. Update Username & Preferences
    await tx.update(users).set({
      username,
      theme: preferences.theme,
      aiEnabled: preferences.aiEnabled,
    }).where(eq(users.id, userId));

    // 2. Insert courses (deduplicated by code)
    if (courses.length > 0) {
      // Basic deduplication for safety
      const uniqueCourses = courses.filter((c, index, self) =>
        index === self.findIndex((t) => t.code === c.code)
      );

      await tx.insert(userCourses).values(
        uniqueCourses.map(c => ({
          userId,
          code: c.code,
          title: c.title,
          semester: c.semester,
          active: true
        }))
      );
    }

    // 3. Award first-login XP
    await tx.insert(xpEvents).values({
      userId,
      eventType: 'daily_login',
      xpAwarded: 5,
    }).onConflictDoNothing();
  });

  // 4. Queue initial content generation (out of transaction for performance)
  if (preferences.aiEnabled && courses.length > 0) {
    try {
      await boss.send('generate-content', { userId }, { startAfter: 5 });
    } catch (e) {
      console.error('Failed to queue content generation:', e);
    }
  }

  return { success: true };
});
