import { db } from '@lerno/db';
import { courseSchedule, users, userCourses } from '@lerno/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import PgBoss from 'pg-boss';

export async function sendExamReminders(job: { data: { boss: PgBoss } }) {
  // Find events in 1, 3, and 7 days
  const upcoming = await db.select({
    event: courseSchedule,
    user: users,
    course: userCourses,
  })
  .from(courseSchedule)
  .innerJoin(users, eq(users.id, courseSchedule.userId))
  .innerJoin(userCourses, eq(userCourses.id, courseSchedule.courseId))
  .where(and(
    eq(courseSchedule.reminderSent, false),
    sql`scheduled_at BETWEEN now() + interval '23 hours' AND now() + interval '8 days'`,
    sql`event_type IN ('exam', 'quiz', 'assignment')`,
  ));

  for (const { event, user, course } of upcoming) {
    const daysLeft = Math.ceil(
      (new Date(event.scheduledAt).getTime() - Date.now()) / 86400000
    );

    if (![1, 3, 7].includes(daysLeft)) continue;

    // Send email
    await job.data.boss.send('send-email', {
      to: user.email,
      template: 'examReminder',
      data: { name: user.displayName ?? user.username, examTitle: event.title, courseCode: course.code, daysLeft },
    });

    // Send push
    await job.data.boss.send('send-push', {
      userId: user.id,
      payload: {
        title: `📅 ${daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}: ${event.title}`,
        body: `${course.code} · Open Lerno to review`,
        url: '/study',
      },
    });

    // Mark reminder sent
    await db.update(courseSchedule).set({ reminderSent: true })
      .where(eq(courseSchedule.id, event.id));
  }
}
