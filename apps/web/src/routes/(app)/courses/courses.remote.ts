import { query, command, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import {
  userCourses, courseSchedule, courseMaterials,
  posts, users, communities, communityMembers,
  xpEvents, topicMastery, youtubeCache,
} from '@lerno/db/schema';
import { eq, and, desc, sql, asc, gte, lt, ilike, or, count } from '@lerno/db/drizzle';
import * as v from 'valibot';
import { storage } from '@lerno/storage';

// ─── My Courses (dashboard) ───────────────────────────────────────────────────

export const getMyCourses = query(
  v.object({}),
  async () => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const courses = await db
      .select({
        id: userCourses.id,
        code: userCourses.code,
        title: userCourses.title,
        description: userCourses.description,
        semester: userCourses.semester,
        year: userCourses.year,
        creditUnits: userCourses.creditUnits,
        color: userCourses.color,
        active: userCourses.active,
        createdAt: userCourses.createdAt,
      })
      .from(userCourses)
      .where(and(eq(userCourses.userId, userId), eq(userCourses.active, true)))
      .orderBy(asc(userCourses.year), asc(userCourses.code));

    // Enrich each course with stats
    const enriched = await Promise.all(
      courses.map(async (course) => {
        // Mastery average for this course
        const [masteryRow] = await db
          .select({ avg: sql<number>`AVG(${topicMastery.masteryPct})` })
          .from(topicMastery)
          .where(and(eq(topicMastery.userId, userId), eq(topicMastery.courseId, course.id)));

        // Flashcards due today
        const [dueRow] = await db
          .select({ count: count() })
          .from(topicMastery)
          .where(
            and(
              eq(topicMastery.userId, userId),
              eq(topicMastery.courseId, course.id),
              or(
                sql`${topicMastery.fsrsDue} <= NOW()`,
                sql`${topicMastery.fsrsDue} IS NULL`,
              ),
            ),
          );

        // Next upcoming exam
        const [nextExam] = await db
          .select({ scheduledAt: courseSchedule.scheduledAt, title: courseSchedule.title, eventType: courseSchedule.eventType })
          .from(courseSchedule)
          .where(
            and(
              eq(courseSchedule.courseId, course.id),
              gte(courseSchedule.scheduledAt, new Date()),
            ),
          )
          .orderBy(asc(courseSchedule.scheduledAt))
          .limit(1);

        // Post counts
        const [postRow] = await db
          .select({ count: count() })
          .from(posts)
          .where(and(eq(posts.courseId, course.id), eq(posts.isVisible, true)));

        return {
          ...course,
          masteryPct: Math.round(masteryRow?.avg ?? 0),
          flashcardsDue: dueRow?.count ?? 0,
          postCount: postRow?.count ?? 0,
          nextExam: nextExam
            ? { ...nextExam, scheduledAt: nextExam.scheduledAt.toISOString() }
            : null,
          createdAt: course.createdAt?.toISOString() ?? new Date().toISOString(),
        };
      }),
    );

    return enriched;
  },
);

// ─── Single course stats ──────────────────────────────────────────────────────

export const getCourseStats = query(
  v.object({ courseCode: v.string() }),
  async ({ courseCode }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const [course] = await db
      .select()
      .from(userCourses)
      .where(and(eq(userCourses.code, courseCode), eq(userCourses.userId, userId)))
      .limit(1);

    // Try the AI-seeded course if user doesn't have it enrolled
    const [seedCourse] = course
      ? [course]
      : await db
        .select()
        .from(userCourses)
        .where(eq(userCourses.code, courseCode))
        .limit(1);

    if (!seedCourse) throw new Error('Course not found');

    const courseId = seedCourse.id;

    const [[masteryRow], [flashcardsRow], [quizzesRow], [videosRow], communityRow, [xpRow]] =
      await Promise.all([
        db
          .select({ avg: sql<number>`COALESCE(AVG(${topicMastery.masteryPct}), 0)` })
          .from(topicMastery)
          .where(and(eq(topicMastery.userId, userId), eq(topicMastery.courseId, courseId))),
        db
          .select({ count: count() })
          .from(posts)
          .where(
            and(
              eq(posts.courseId, courseId),
              eq(posts.postType, 'flashcard'),
              eq(posts.isVisible, true),
            ),
          ),
        db
          .select({ count: count() })
          .from(posts)
          .where(
            and(
              eq(posts.courseId, courseId),
              eq(posts.postType, 'quiz'),
              eq(posts.isVisible, true),
            ),
          ),
        db
          .select({ count: count() })
          .from(posts)
          .where(
            and(
              eq(posts.courseId, courseId),
              eq(posts.postType, 'video'),
              eq(posts.isVisible, true),
            ),
          ),
        db
          .select({ id: communities.id, name: communities.name, slug: communities.slug, memberCount: communities.memberCount })
          .from(communities)
          .where(eq(communities.courseCode, courseCode))
          .limit(1),
        db
          .select({ total: sql<number>`COALESCE(SUM(${xpEvents.xpAwarded}), 0)` })
          .from(xpEvents)
          .where(and(eq(xpEvents.userId, userId), eq(xpEvents.courseId, courseId))),
      ]);

    const upcomingExams = await db
      .select()
      .from(courseSchedule)
      .where(
        and(eq(courseSchedule.courseId, courseId), gte(courseSchedule.scheduledAt, new Date())),
      )
      .orderBy(asc(courseSchedule.scheduledAt))
      .limit(5);

    return {
      course: { ...seedCourse, createdAt: seedCourse.createdAt?.toISOString() ?? '' },
      masteryPct: Math.round(masteryRow?.avg ?? 0),
      flashcardCount: flashcardsRow?.count ?? 0,
      quizCount: quizzesRow?.count ?? 0,
      videoCount: videosRow?.count ?? 0,
      xpEarned: xpRow?.total ?? 0,
      community: communityRow ?? null,
      upcomingExams: upcomingExams.map((e) => ({
        ...e,
        scheduledAt: e.scheduledAt.toISOString(),
        createdAt: e.createdAt?.toISOString() ?? '',
      })),
    };
  },
);

// ─── Course catalog search ─────────────────────────────────────────────────────

export const searchCourseCatalog = query(
  v.object({ query: v.string() }),
  async ({ query: q }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;

    // Query seeded courses (from AI user)
    const results = await db
      .select({ code: userCourses.code, title: userCourses.title, description: userCourses.description, year: userCourses.year, creditUnits: userCourses.creditUnits })
      .from(userCourses)
      .where(
        or(
          ilike(userCourses.code, `%${q}%`),
          ilike(userCourses.title, `%${q}%`),
        ),
      )
      .groupBy(userCourses.code, userCourses.title, userCourses.description, userCourses.year, userCourses.creditUnits)
      .limit(20);

    if (!userId) return results;

    // Mark which ones the user is already enrolled in
    const enrolled = await db
      .select({ code: userCourses.code })
      .from(userCourses)
      .where(and(eq(userCourses.userId, userId), eq(userCourses.active, true)));

    const enrolledCodes = new Set(enrolled.map((e) => e.code));
    return results.map((r) => ({ ...r, enrolled: enrolledCodes.has(r.code) }));
  },
);

// ─── Enroll / unenroll ────────────────────────────────────────────────────────

export const enrollCourse = command(
  v.object({
    code: v.string(),
    title: v.string(),
    semester: v.optional(v.picklist(['first', 'second', 'summer', 'trimester_1', 'trimester_2', 'trimester_3'])),
    year: v.optional(v.number()),
    creditUnits: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  }),
  async (input) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    // Check if already enrolled
    const existing = await db
      .select({ id: userCourses.id, active: userCourses.active })
      .from(userCourses)
      .where(and(eq(userCourses.userId, userId), eq(userCourses.code, input.code)))
      .limit(1);

    if (existing.length > 0) {
      if (!existing[0].active) {
        // Re-activate
        await db.update(userCourses).set({ active: true }).where(eq(userCourses.id, existing[0].id));
        return { id: existing[0].id, reactivated: true };
      }
      return { id: existing[0].id, alreadyEnrolled: true };
    }

    const [created] = await db
      .insert(userCourses)
      .values({ userId, ...input, active: true })
      .returning({ id: userCourses.id });

    return { id: created.id };
  },
);

export const unenrollCourse = command(
  v.object({ courseId: v.string() }),
  async ({ courseId }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    await db
      .update(userCourses)
      .set({ active: false })
      .where(and(eq(userCourses.id, courseId), eq(userCourses.userId, userId)));
  },
);

// ─── Exam schedule ────────────────────────────────────────────────────────────

export const getExamSchedule = query(
  v.object({ courseCode: v.string() }),
  async ({ courseCode }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const [course] = await db
      .select({ id: userCourses.id })
      .from(userCourses)
      .where(and(eq(userCourses.code, courseCode), eq(userCourses.userId, userId)))
      .limit(1);

    if (!course) return [];

    const events = await db
      .select()
      .from(courseSchedule)
      .where(eq(courseSchedule.courseId, course.id))
      .orderBy(asc(courseSchedule.scheduledAt));

    return events.map((e) => ({
      ...e,
      scheduledAt: e.scheduledAt.toISOString(),
      createdAt: e.createdAt?.toISOString() ?? '',
    }));
  },
);

export const addExamDate = command(
  v.object({
    courseCode: v.string(),
    title: v.string(),
    eventType: v.picklist(['exam', 'quiz', 'lab', 'assignment', 'presentation', 'other']),
    scheduledAt: v.string(), // ISO string
    durationMins: v.optional(v.number()),
    weightPct: v.optional(v.number()),
    location: v.optional(v.string()),
  }),
  async ({ courseCode, title, eventType, scheduledAt, durationMins, weightPct, location }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const [course] = await db
      .select({ id: userCourses.id })
      .from(userCourses)
      .where(and(eq(userCourses.code, courseCode), eq(userCourses.userId, userId)))
      .limit(1);

    if (!course) throw new Error('Course not found');

    const [created] = await db
      .insert(courseSchedule)
      .values({
        userId,
        courseId: course.id,
        title,
        eventType: eventType as any,
        scheduledAt: new Date(scheduledAt),
        durationMins,
        weightPct,
        location,
      })
      .returning();

    return { ...created, scheduledAt: created.scheduledAt.toISOString() };
  },
);

export const deleteExamDate = command(
  v.object({ scheduleId: v.string() }),
  async ({ scheduleId }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    await db
      .delete(courseSchedule)
      .where(and(eq(courseSchedule.id, scheduleId), eq(courseSchedule.userId, userId)));
  },
);

// ─── Course videos ────────────────────────────────────────────────────────────

export const getCourseVideos = query(
  v.object({ courseCode: v.string() }),
  async ({ courseCode }) => {
    // From youtube_cache
    const cachedKey = `yt:${courseCode}:`;
    const cached = await db
      .select({ results: youtubeCache.results, createdAt: youtubeCache.createdAt })
      .from(youtubeCache)
      .where(sql`${youtubeCache.cacheKey} LIKE ${cachedKey + '%'}`)
      .orderBy(desc(youtubeCache.createdAt))
      .limit(1);

    const ytVideos = cached.length > 0 ? (cached[0].results as any[]) : [];

    // From uploaded/AI video posts
    const [course] = await db
      .select({ id: userCourses.id })
      .from(userCourses)
      .where(eq(userCourses.code, courseCode))
      .limit(1);

    const uploadedVideos = course
      ? await db
        .select({
          id: posts.id,
          content: posts.content,
          postType: posts.postType,
          likeCount: posts.likeCount,
          viewCount: posts.viewCount,
          aiGenerated: posts.aiGenerated,
          createdAt: posts.createdAt,
        })
        .from(posts)
        .where(
          and(
            eq(posts.courseId, course.id),
            or(eq(posts.postType, 'video'), eq(posts.postType, 'short')),
            eq(posts.isVisible, true),
          ),
        )
        .orderBy(desc(posts.createdAt))
        .limit(30)
      : [];

    return {
      youtube: ytVideos.slice(0, 20),
      uploaded: uploadedVideos.map((v) => ({
        ...v,
        createdAt: v.createdAt?.toISOString() ?? new Date().toISOString(),
      })),
    };
  },
);

// ─── Course materials ─────────────────────────────────────────────────────────

export const getCourseMaterials = query(
  v.object({ courseCode: v.string() }),
  async ({ courseCode }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const [course] = await db
      .select({ id: userCourses.id })
      .from(userCourses)
      .where(and(eq(userCourses.code, courseCode), eq(userCourses.userId, userId)))
      .limit(1);

    if (!course) return [];

    const materials = await db
      .select()
      .from(courseMaterials)
      .where(eq(courseMaterials.courseId, course.id))
      .orderBy(desc(courseMaterials.createdAt));

    return materials.map((m) => ({
      ...m,
      createdAt: m.createdAt?.toISOString() ?? new Date().toISOString(),
    }));
  },
);

export const uploadCourseMaterial = command(
  v.object({
    courseCode: v.string(),
    title: v.string(),
    type: v.picklist(['pdf', 'slide', 'note', 'image', 'video', 'audio', 'other']),
    filename: v.string(),
    contentType: v.string(),
  }),
  async ({ courseCode, title, type, filename, contentType }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const [course] = await db
      .select({ id: userCourses.id })
      .from(userCourses)
      .where(and(eq(userCourses.code, courseCode), eq(userCourses.userId, userId)))
      .limit(1);

    if (!course) throw new Error('Course not found');

    const storageKey = `materials/${userId}/${courseCode}/${Date.now()}-${filename}`;

    const [material] = await db
      .insert(courseMaterials)
      .values({
        courseId: course.id,
        userId,
        type,
        title,
        storageKey,
        processed: false,
      })
      .returning();

    const uploadUrl = await storage.presignedPutUrl(storageKey, { expiresIn: 3600, contentType });

    return {
      materialId: material.id,
      uploadUrl,
      storageKey,
    };
  },
);

// ─── Course leaderboard ───────────────────────────────────────────────────────

export const getCourseLeaderboard = query(
  v.object({
    courseCode: v.string(),
    period: v.optional(v.picklist(['week', 'month', 'all'])),
  }),
  async ({ courseCode, period = 'week' }) => {
    const [course] = await db
      .select({ id: userCourses.id })
      .from(userCourses)
      .where(eq(userCourses.code, courseCode))
      .limit(1);

    if (!course) return [];

    const since =
      period === 'week'
        ? new Date(Date.now() - 7 * 86400000)
        : period === 'month'
          ? new Date(Date.now() - 30 * 86400000)
          : new Date(0);

    const rows = await db
      .select({
        userId: xpEvents.userId,
        total: sql<number>`SUM(${xpEvents.xpAwarded})`,
        name: users.name,
        username: users.username,
        image: users.image,
      })
      .from(xpEvents)
      .leftJoin(users, eq(xpEvents.userId, users.id))
      .where(
        and(
          eq(xpEvents.courseId, course.id),
          gte(xpEvents.createdAt, since),
        ),
      )
      .groupBy(xpEvents.userId, users.name, users.username, users.image)
      .orderBy(desc(sql`SUM(${xpEvents.xpAwarded})`))
      .limit(50);

    return rows.map((r, i) => ({ rank: i + 1, ...r }));
  },
);
