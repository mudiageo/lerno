import { command, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import { posts, userCourses } from '@lerno/db/schema';
import { and, eq } from '@lerno/db/drizzle';
import * as v from 'valibot';

const RevisionCardSchema = v.object({
  front: v.string(),
  back: v.string(),
  hint: v.optional(v.string()),
  topicTags: v.optional(v.array(v.string())),
});

const RevisionPackSchema = v.object({
  id: v.string(),
  courseCode: v.string(),
  topic: v.string(),
  cards: v.array(RevisionCardSchema),
});

/**
 * Queued offline packs sync into the existing study deck only after reconnect.
 * The client removes them from the local queue on success.
 */
export const syncRevisionPacks = command(v.array(RevisionPackSchema), async (packs) => {
  const userId = getRequestEvent().locals?.user?.id;
  if (!userId) throw new Error('Sign in to sync revision packs.');

  let synced = 0;
  for (const pack of packs) {
    const code = pack.courseCode.trim().toUpperCase();
    const [course] = await (db as any)
      .select({ id: userCourses.id })
      .from(userCourses)
      .where(and(eq(userCourses.userId as any, userId), eq(userCourses.code as any, code)))
      .limit(1);

    for (const card of pack.cards) {
      if (!card.front.trim() || !card.back.trim()) continue;
      await (db as any).insert(posts).values({
        authorId: userId,
        courseId: course?.id ?? null,
        postType: 'flashcard',
        content: {
          front: card.front.trim().slice(0, 500),
          back: card.back.trim().slice(0, 1_000),
          hint: card.hint?.trim().slice(0, 200) || undefined,
        },
        topicTags: [pack.topic.trim().slice(0, 60)],
        aiGenerated: true,
        isVisible: true,
      });
      synced += 1;
    }
  }

  return { synced };
});

const SemesterSchema = v.optional(
  v.picklist(['first', 'second', 'summer', 'trimester_1', 'trimester_2', 'trimester_3'])
);

const ExtractedCourseSchema = v.object({
  code: v.pipe(v.string(), v.minLength(2), v.maxLength(20)),
  title: v.pipe(v.string(), v.minLength(2)),
  units: v.optional(v.number()),
  outline: v.optional(v.string()),
  topics: v.array(v.string()),
  semester: SemesterSchema,
});

/** Shared by onboarding and settings after the user approves the preview. */
export const saveCurriculumCourses = command(
  v.object({ courses: v.array(ExtractedCourseSchema) }),
  async ({ courses }) => {
    const userId = getRequestEvent().locals?.user?.id;
    if (!userId) throw new Error('Sign in to save courses.');

    const existing = await (db as any)
      .select({ code: userCourses.code })
      .from(userCourses)
      .where(eq(userCourses.userId as any, userId));
    const existingCodes = new Set<string>(existing.map((row: { code: string }) => row.code));

    const rows = courses
      .map((course) => ({
        userId,
        code: course.code.trim().toUpperCase(),
        title: course.title.trim(),
        description: course.outline?.trim() || null,
        creditUnits: course.units ?? null,
        semester: course.semester ?? 'first',
        active: true,
      }))
      .filter((row, index, all) => {
        const first = all.findIndex((candidate) => candidate.code === row.code) === index;
        return first && !existingCodes.has(row.code);
      });

    if (rows.length > 0) {
      await (db as any).insert(userCourses).values(rows);
    }

    return {
      saved: rows.length,
      skipped: courses.length - rows.length,
    };
  }
);
