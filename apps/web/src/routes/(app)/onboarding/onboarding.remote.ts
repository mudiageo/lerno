import { command, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import { userCourses, users, courseSchedule, xpEvents } from '@lerno/db/schema';
import { eq } from '@lerno/db/drizzle';
import * as v from 'valibot';

// Content generation now runs in the web client through Firebase AI Logic.
// The old server job code remains in packages/jobs as disclosed pre-existing
// code, but this submitted runtime does not enqueue it.

const OnboardingSchema = v.object({
  username: v.pipe(v.string(), v.minLength(3), v.maxLength(30)),
  courses: v.array(
    v.object({
      code: v.string(),
      title: v.string(),
      semester: v.string(),
    })
  ),
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
    await tx
      .update(users)
      .set({
        username,
        theme: preferences.theme,
        aiEnabled: preferences.aiEnabled,
      })
      .where(eq(users.id, userId));

    // 2. Insert courses (deduplicated by code)
    if (courses.length > 0) {
      // Basic deduplication for safety
      const uniqueCourses = courses.filter(
        (c, index, self) => index === self.findIndex((t) => t.code === c.code)
      );

      await tx.insert(userCourses).values(
        uniqueCourses.map((c) => ({
          userId,
          code: c.code,
          title: c.title,
          semester: c.semester,
          active: true,
        }))
      );
    }

    // 3. Award first-login XP
    await tx
      .insert(xpEvents)
      .values({
        userId,
        eventType: 'daily_login',
        xpAwarded: 5,
      })
      .onConflictDoNothing();
  });

  return { success: true };
});
