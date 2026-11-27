import { JOBS_SERVICE_URL } from '$app/env/private';
import { command, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import { userCourses, users, courseSchedule, xpEvents } from '@lerno/db/schema';
import { eq } from '@lerno/db/drizzle';
import * as v from 'valibot';

type JobsQueue = { send: (message: unknown) => Promise<string> };

// pg-boss cannot run inside Workers. Prefer a Cloudflare Queue producer when
// bound, otherwise POST to the Node jobs service. This keeps the web bundle
// free of pg-boss on both Vercel and Cloudflare.
async function enqueueGenerateContent(event: ReturnType<typeof getRequestEvent>, userId: string) {
  const env = (event.platform as { env?: { JOBS_QUEUE?: JobsQueue } } | undefined)?.env;
  const queue = env?.JOBS_QUEUE;
  if (queue) {
    await queue.send({ name: 'generate-content', data: { userId }, options: { startAfter: 5 } });
    return;
  }

  if (!JOBS_SERVICE_URL) {
    console.warn('JOBS_SERVICE_URL is not set; skipping generate-content job');
    return;
  }

  try {
    await fetch(`${JOBS_SERVICE_URL.replace(/\/$/, '')}/jobs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'generate-content',
        data: { userId },
        options: { startAfter: 5 },
      }),
    });
  } catch (error) {
    console.error('Failed to queue content generation:', error);
  }
}

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

  // 4. Queue initial content generation (out of transaction for performance)
  if (preferences.aiEnabled && courses.length > 0) {
    await enqueueGenerateContent(event, userId);
  }

  return { success: true };
});
