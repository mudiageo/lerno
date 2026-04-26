import { query, command, form, getRequestEvent } from '$app/server';
import { db } from '@lerno/db';
import {
  userCourses,
  courseSchedule,
  courseMaterials,
  posts,
  users,
  communities,
  communityMembers,
  xpEvents,
  topicMastery,
  youtubeCache,
} from '@lerno/db/schema';
import { eq, and, desc, sql, asc, gte, lt, ilike, or, count } from '@lerno/db/drizzle';
import { getFeed } from '../feed/feed.remote';
import * as v from 'valibot';
import { storage } from '@lerno/storage';
import {
  ai,
  buildMaterialSummaryPrompt,
  buildMaterialImagePrompt,
  CONTENT_GENERATION_SYSTEM_PROMPT,
  buildQuizPrompt,
  buildFlashcardPrompt,
  buildTextPostPrompt,
  buildPollPrompt,
  buildThreadPrompt,
  buildShortPrompt,
  buildVideoScriptPrompt,
} from '@lerno/ai';

// ─── My Courses (dashboard) ───────────────────────────────────────────────────

export const getMyCourses = query(v.object({}), async () => {
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
        .select({ avg: sql<number>`AVG(${topicMastery.score})` })
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
            or(sql`${topicMastery.fsrsDue} <= NOW()`, sql`${topicMastery.fsrsDue} IS NULL`)
          )
        );

      // Next upcoming exam
      const [nextExam] = await db
        .select({
          scheduledAt: courseSchedule.scheduledAt,
          title: courseSchedule.title,
          eventType: courseSchedule.eventType,
        })
        .from(courseSchedule)
        .where(
          and(eq(courseSchedule.courseId, course.id), gte(courseSchedule.scheduledAt, new Date()))
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
    })
  );

  return enriched;
});

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
      : await db.select().from(userCourses).where(eq(userCourses.code, courseCode)).limit(1);

    if (!seedCourse) throw new Error('Course not found');

    const courseId = seedCourse.id;

    const [[masteryRow], [flashcardsRow], [quizzesRow], [videosRow], [communityRow], [xpRow]] =
      await Promise.all([
        db
          .select({ avg: sql<number>`COALESCE(AVG(${topicMastery.score}), 0)` })
          .from(topicMastery)
          .where(and(eq(topicMastery.userId, userId), eq(topicMastery.courseId, courseId))),
        db
          .select({ count: count() })
          .from(posts)
          .where(
            and(
              eq(posts.courseId, courseId),
              eq(posts.postType, 'flashcard'),
              eq(posts.isVisible, true)
            )
          ),
        db
          .select({ count: count() })
          .from(posts)
          .where(
            and(eq(posts.courseId, courseId), eq(posts.postType, 'quiz'), eq(posts.isVisible, true))
          ),
        db
          .select({ count: count() })
          .from(posts)
          .where(
            and(
              eq(posts.courseId, courseId),
              eq(posts.postType, 'video'),
              eq(posts.isVisible, true)
            )
          ),
        db
          .select({
            id: communities.id,
            name: communities.name,
            slug: communities.slug,
            memberCount: communities.memberCount,
          })
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
        and(eq(courseSchedule.courseId, courseId), gte(courseSchedule.scheduledAt, new Date()))
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
  }
);

// ─── Course catalog search ─────────────────────────────────────────────────────

export const searchCourseCatalog = query(v.object({ query: v.string() }), async ({ query: q }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;

  // Query seeded courses (from AI user)
  const results = await db
    .select({
      code: userCourses.code,
      title: userCourses.title,
      description: userCourses.description,
      year: userCourses.year,
      creditUnits: userCourses.creditUnits,
    })
    .from(userCourses)
    .where(or(ilike(userCourses.code, `%${q}%`), ilike(userCourses.title, `%${q}%`)))
    .groupBy(
      userCourses.code,
      userCourses.title,
      userCourses.description,
      userCourses.year,
      userCourses.creditUnits
    )
    .limit(20);

  if (!userId) return results;

  // Mark which ones the user is already enrolled in
  const enrolled = await db
    .select({ code: userCourses.code })
    .from(userCourses)
    .where(and(eq(userCourses.userId, userId), eq(userCourses.active, true)));

  const enrolledCodes = new Set(enrolled.map((e) => e.code));
  return results.map((r) => ({ ...r, enrolled: enrolledCodes.has(r.code) }));
});

// ─── Enroll / unenroll ────────────────────────────────────────────────────────

export const enrollCourse = command(
  v.object({
    code: v.string(),
    title: v.string(),
    semester: v.optional(
      v.picklist(['first', 'second', 'summer', 'trimester_1', 'trimester_2', 'trimester_3'])
    ),
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
        await db
          .update(userCourses)
          .set({ active: true })
          .where(eq(userCourses.id, existing[0].id));
        return { id: existing[0].id, reactivated: true };
      }
      return { id: existing[0].id, alreadyEnrolled: true };
    }

    const [created] = await db
      .insert(userCourses)
      .values({ userId, ...input, active: true })
      .returning({ id: userCourses.id });

    return { id: created.id };
  }
);

export const unenrollCourse = command(v.object({ courseId: v.string() }), async ({ courseId }) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  await db
    .update(userCourses)
    .set({ active: false })
    .where(and(eq(userCourses.id, courseId), eq(userCourses.userId, userId)));
});

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
  }
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
  }
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
  }
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
              eq(posts.isVisible, true)
            )
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
  }
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
  }
);

export const uploadCourseMaterial = form(
  v.object({
    courseCode: v.string(),
    title: v.string(),
    file: v.file(),
  }),
  async ({ courseCode, title, file }) => {
    const event = getRequestEvent();
    const userId = event.locals?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const [course] = await db
      .select({ id: userCourses.id, title: userCourses.title })
      .from(userCourses)
      .where(and(eq(userCourses.code, courseCode), eq(userCourses.userId, userId)))
      .limit(1);

    if (!course) throw new Error('Course not found');

    const storageKey = `materials/${userId}/${courseCode}/${Date.now()}-${file.name}`;

    // Detect type
    const type: 'pdf' | 'slide' | 'note' | 'image' | 'video' | 'audio' | 'other' =
      file.type.includes('pdf')
        ? 'pdf'
        : file.type.includes('image')
          ? 'image'
          : file.type.includes('video')
            ? 'video'
            : file.type.includes('audio')
              ? 'audio'
              : /\.(ppt|pptx|key)$/i.test(file.name)
                ? 'slide'
                : 'other';

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

    const contentType = file.type || 'application/octet-stream';
    const uploadUrl = await storage.upload(storageKey, file.stream(), contentType);

    // AI enrichment — run asynchronously so the upload response is fast
    void enrichMaterialWithAI({
      materialId: material.id,
      courseCode,
      courseTitle: course.title,
      title,
      type,
      file,
    });

    await getCourseMaterials({ courseCode }).refresh();

    return {
      materialId: material.id,
      uploadUrl,
      storageKey,
    };
  }
);

// ─── AI material enrichment (runs async after upload) ─────────────────────────

const MAX_EXTRACTED_TEXT_LENGTH = 8000;

async function enrichMaterialWithAI(params: {
  materialId: string;
  courseCode: string;
  courseTitle: string;
  title: string;
  type: string;
  file: File;
}) {
  try {
    let aiResult: {
      summary: string;
      topics: string[];
      keyPoints: Array<{ topic: string; point: string }>;
      definitions: Array<{ term: string; definition: string }>;
      potentialQuestions: string[];
    };

    if (params.type === 'image') {
      // Use vision API for images
      const arrayBuffer = await params.file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const prompt = buildMaterialImagePrompt({
        courseCode: params.courseCode,
        courseTitle: params.courseTitle,
        title: params.title,
      });
      const raw = await ai.generateWithVision({
        prompt,
        imageBase64: base64,
        mimeType: params.file.type,
      });
      aiResult = JSON.parse(raw);
    } else {
      // Try to extract text from non-binary files; fall back to title-only
      let extractedText = '';
      if (params.type !== 'video' && params.type !== 'audio') {
        try {
          extractedText = await params.file.text();
        } catch {
          // Binary file — no extractable text
        }
      }

      const prompt = buildMaterialSummaryPrompt({
        courseCode: params.courseCode,
        courseTitle: params.courseTitle,
        title: params.title,
        type: params.type,
        extractedText: extractedText.slice(0, MAX_EXTRACTED_TEXT_LENGTH),
      });
      const raw = await ai.generate({
        messages: [{ role: 'user', content: prompt }],
        systemPrompt: CONTENT_GENERATION_SYSTEM_PROMPT,
        jsonMode: true,
        maxTokens: 1500,
      });
      aiResult = JSON.parse(raw);
    }

    await db
      .update(courseMaterials)
      .set({
        summary: aiResult.summary ?? null,
        topics: aiResult.topics ?? [],
        keyPoints: aiResult.keyPoints ?? [],
        definitions: aiResult.definitions ?? [],
        potentialQuestions: aiResult.potentialQuestions ?? [],
        ocrText: aiResult.topics?.join(', ') ?? null,
        processed: true,
        processingError: null,
      })
      .where(eq(courseMaterials.id, params.materialId));
  } catch (err: any) {
    console.error('[AI material enrichment] failed:', err?.message ?? err);
    await db
      .update(courseMaterials)
      .set({ processingError: String(err?.message ?? 'Unknown error'), processed: false })
      .where(eq(courseMaterials.id, params.materialId));
  }
}

// ─── AI Post Generation ───────────────────────────────────────────────────────

const GenerateAIPostInput = v.object({
  courseCode: v.string(),
  postType: v.picklist(['text', 'quiz', 'flashcard', 'poll', 'thread', 'short', 'video']),
  topic: v.optional(v.string()),
  materialId: v.optional(v.string()),
  difficulty: v.optional(v.picklist(['easy', 'medium', 'hard'])),
});

export const generateAIPost = command(GenerateAIPostInput, async (input) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const [course] = await db
    .select({ id: userCourses.id, title: userCourses.title, code: userCourses.code })
    .from(userCourses)
    .where(and(eq(userCourses.code, input.courseCode), eq(userCourses.userId, userId)))
    .limit(1);

  if (!course) throw new Error('Course not found');

  // Fetch material context if a materialId was provided
  let context: string | undefined;
  let topic = input.topic ?? '';

  if (input.materialId) {
    const [mat] = await db
      .select({
        title: courseMaterials.title,
        ocrText: courseMaterials.ocrText,
        summary: courseMaterials.summary,
        topics: courseMaterials.topics,
        keyPoints: courseMaterials.keyPoints,
        definitions: courseMaterials.definitions,
        potentialQuestions: courseMaterials.potentialQuestions,
      })
      .from(courseMaterials)
      .where(and(eq(courseMaterials.id, input.materialId), eq(courseMaterials.courseId, course.id)))
      .limit(1);

    if (mat) {
      const parts: string[] = [];
      if (mat.summary) parts.push(`Summary: ${mat.summary}`);
      if (mat.topics?.length) parts.push(`Topics: ${mat.topics.join(', ')}`);
      if (mat.keyPoints?.length) {
        parts.push(`Key points:\n${mat.keyPoints.map((k) => `- ${k.point}`).join('\n')}`);
      }
      if (mat.definitions?.length) {
        parts.push(
          `Definitions:\n${mat.definitions.map((d) => `- ${d.term}: ${d.definition}`).join('\n')}`
        );
      }
      if (mat.potentialQuestions?.length) {
        parts.push(
          `Potential questions:\n${mat.potentialQuestions.map((q) => `- ${q}`).join('\n')}`
        );
      }
      context = parts.join('\n\n');

      // Use first topic from material if none specified
      if (!topic && mat.topics?.length) topic = mat.topics[0];
      else if (!topic) topic = mat.title;
    }
  }

  const params = {
    courseCode: course.code,
    courseTitle: course.title,
    topic: topic || course.title,
    masteryScore: 50,
    context,
  };

  let prompt: string;
  switch (input.postType) {
    case 'quiz':
      prompt = buildQuizPrompt({ ...params, difficulty: input.difficulty });
      break;
    case 'flashcard':
      prompt = buildFlashcardPrompt(params);
      break;
    case 'poll':
      prompt = buildPollPrompt(params);
      break;
    case 'thread':
      prompt = buildThreadPrompt(params);
      break;
    case 'short':
      prompt = buildShortPrompt(params);
      break;
    case 'video':
      prompt = buildVideoScriptPrompt(params);
      break;
    default:
      prompt = buildTextPostPrompt({ ...params, urgencyLevel: 0.3 });
  }

  const raw = await ai.generate({
    messages: [{ role: 'user', content: prompt }],
    systemPrompt: CONTENT_GENERATION_SYSTEM_PROMPT,
    jsonMode: true,
    maxTokens: 1000,
  });

  const draft = JSON.parse(raw);
  return { draft, postType: input.postType, courseId: course.id, materialId: input.materialId ?? null };
});

// ─── Save AI-Generated Post ───────────────────────────────────────────────────

const SaveAIPostInput = v.object({
  courseId: v.string(),
  postType: v.picklist(['text', 'quiz', 'flashcard', 'poll', 'thread', 'short', 'video']),
  content: v.record(v.string(), v.unknown()),
  topicTags: v.optional(v.array(v.string())),
  communityId: v.optional(v.string()),
  materialId: v.optional(v.string()),
});

export const saveAIPost = command(SaveAIPostInput, async (input) => {
  const event = getRequestEvent();
  const userId = event.locals?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const [post] = await db
    .insert(posts)
    .values({
      authorId: userId,
      postType: input.postType as any,
      content: input.content,
      courseId: input.courseId,
      communityId: input.communityId,
      sourceMaterialId: input.materialId ?? null,
      topicTags: input.topicTags ?? [],
      aiGenerated: true,
      isVisible: true,
    })
    .returning({ id: posts.id });

  await db
    .insert(xpEvents)
    .values({ userId, eventType: 'post_created', xpAwarded: 5, courseId: input.courseId });
  await db
    .update(users)
    .set({ xp: sql`${users.xp} + 5` })
    .where(eq(users.id, userId));

  // Invalidate feed cache so new post appears immediately
  await getFeed({}).refresh();

  // If saved from a material, also refresh the material posts query
  if (input.materialId) {
    await getMaterialGeneratedPosts({ materialId: input.materialId }).refresh();
  }

  return { postId: post.id };
});

// ─── Material generated posts ─────────────────────────────────────────────────

export const getMaterialGeneratedPosts = query(
  v.object({ materialId: v.string() }),
  async ({ materialId }) => {
    const rows = await db
      .select({
        id: posts.id,
        postType: posts.postType,
        content: posts.content,
        topicTags: posts.topicTags,
        likeCount: posts.likeCount,
        createdAt: posts.createdAt,
        authorName: users.displayName,
        authorUsername: users.username,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(and(eq(posts.sourceMaterialId, materialId), eq(posts.isVisible, true)))
      .orderBy(desc(posts.createdAt))
      .limit(20);

    return rows.map((r) => ({
      ...r,
      author: { name: r.authorName, username: r.authorUsername },
      createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    }));
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
        name: users.displayName,
        username: users.username,
        image: users.avatarUrl,
      })
      .from(xpEvents)
      .leftJoin(users, eq(xpEvents.userId, users.id))
      .where(and(eq(xpEvents.courseId, course.id), gte(xpEvents.createdAt, since)))
      .groupBy(xpEvents.userId, users.displayName, users.username, users.avatarUrl)
      .orderBy(desc(sql`SUM(${xpEvents.xpAwarded})`))
      .limit(50);

    return rows.map((r, i) => ({ rank: i + 1, ...r }));
  }
);
